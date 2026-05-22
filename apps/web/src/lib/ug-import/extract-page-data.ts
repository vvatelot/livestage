import type { UgStoreData } from "./parser-types";

function decodeHtmlAttr(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
}

function hasTabContent(data: Record<string, unknown>): boolean {
  const tabView = data.tab_view as Record<string, unknown> | undefined;
  if (!tabView) return false;
  const wiki = tabView.wiki_tab as { content?: string } | undefined;
  const tab = tabView.tab as { content?: string } | undefined;
  return Boolean(wiki?.content || tab?.content);
}

/** Normalise les formats UG (js-store, UGAPP, __DATA__, etc.) vers store.page.data */
export function normalizeUgStorePayload(parsed: unknown): UgStoreData | null {
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;

  if (o.store && typeof o.store === "object") {
    const store = o.store as Record<string, unknown>;
    const page = store.page as Record<string, unknown> | undefined;
    const data = page?.data as Record<string, unknown> | undefined;
    if (data && hasTabContent(data)) {
      return { store: o.store } as UgStoreData;
    }
  }

  if (o.page && typeof o.page === "object") {
    const page = o.page as Record<string, unknown>;
    const data = page.data as Record<string, unknown> | undefined;
    if (data && hasTabContent(data)) {
      return { store: { page: o.page } } as UgStoreData;
    }
  }

  if (hasTabContent(o)) {
    return { store: { page: { data: o } } } as UgStoreData;
  }

  return null;
}

function tryParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function findPageDataInTree(obj: unknown, depth = 0): Record<string, unknown> | null {
  if (depth > 14 || !obj || typeof obj !== "object") return null;

  if (!Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    if (hasTabContent(record)) return record;

    for (const value of Object.values(record)) {
      const found = findPageDataInTree(value, depth + 1);
      if (found) return found;
    }
    return null;
  }

  for (const item of obj) {
    const found = findPageDataInTree(item, depth + 1);
    if (found) return found;
  }
  return null;
}

function wrapPageData(pageData: Record<string, unknown>): string {
  return JSON.stringify({
    store: { page: { data: pageData } },
  } satisfies UgStoreData);
}

function fromNormalized(payload: unknown): string | null {
  const normalized = normalizeUgStorePayload(payload);
  if (!normalized) return null;
  return JSON.stringify(normalized);
}

/** Extraction côté navigateur (bookmarklet) — plusieurs sources UG actuelles */
export function extractUgJsonFromWindow(win: Window = window): string | null {
  const w = win as Window & {
    UGAPP?: { store?: unknown };
    __DATA__?: unknown;
    __NEXT_DATA__?: unknown;
  };

  if (w.UGAPP?.store) {
    const json = fromNormalized({ store: w.UGAPP.store });
    if (json) return json;
  }

  if (w.__DATA__) {
    const json = fromNormalized(w.__DATA__);
    if (json) return json;
  }

  if (w.__NEXT_DATA__) {
    const pageData = findPageDataInTree(w.__NEXT_DATA__);
    if (pageData) return wrapPageData(pageData);
  }

  const doc = win.document;

  const selectors = [
    ".js-store[data-content]",
    ".js-store",
    "[class*='js-store'][data-content]",
    "[data-content]",
  ];

  for (const selector of selectors) {
    const elements = doc.querySelectorAll(selector);
    for (const el of elements) {
      const raw = el.getAttribute("data-content");
      if (!raw || raw.length < 50) continue;
      const decoded = decodeHtmlAttr(raw);
      const parsed = tryParseJson(decoded);
      const json = parsed ? fromNormalized(parsed) : null;
      if (json) return json;
    }
  }

  const scripts = doc.querySelectorAll(
    'script[type="application/json"], script#__NEXT_DATA__, script[id*="__NEXT"]'
  );
  for (const script of scripts) {
    const text = script.textContent?.trim();
    if (!text || text.length < 100) continue;
    const parsed = tryParseJson(text);
    if (parsed) {
      const json = fromNormalized(parsed);
      if (json) return json;
      const pageData = findPageDataInTree(parsed);
      if (pageData) return wrapPageData(pageData);
    }
  }

  for (const script of doc.querySelectorAll("script:not([src])")) {
    const text = script.textContent || "";
    const dataMatch = text.match(/window\.__DATA__\s*=\s*(\{[\s\S]*?\});/);
    if (dataMatch) {
      const parsed = tryParseJson(dataMatch[1]);
      const json = parsed ? fromNormalized(parsed) : null;
      if (json) return json;
    }
    const ugappMatch = text.match(/window\.UGAPP\s*=\s*(\{[\s\S]*?\});/);
    if (ugappMatch) {
      const parsed = tryParseJson(ugappMatch[1]) as { store?: unknown } | null;
      if (parsed?.store) {
        const json = fromNormalized({ store: parsed.store });
        if (json) return json;
      }
    }
  }

  return null;
}
