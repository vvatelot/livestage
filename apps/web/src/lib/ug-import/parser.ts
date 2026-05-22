import { decodeHtmlEntities } from "../chordpro/decode-html";
import { normalizeUgStorePayload } from "./extract-page-data";
import type { UgStoreData } from "./parser-types";

export type { UgStoreData } from "./parser-types";

export interface UgImportResult {
  title: string;
  artist: string;
  key: string;
  capo: number;
  chordpro: string;
  sourceUrl?: string;
}

export function cleanUgContent(raw: string): string {
  let content = decodeHtmlEntities(raw);

  content = content.replace(/\[\/?tab\]/gi, "");
  content = content.replace(/\[ch\]([^\[]*?)\[\/ch\]/gi, "[$1]");
  content = content.replace(/<[^>]+>/g, "");

  content = content.replace(/\[advertisement\][\s\S]*?\[\/advertisement\]/gi, "");
  content = content.replace(/\[solo\][\s\S]*?\[\/solo\]/gi, "");
  content = content.replace(/\[intro\]/gi, "{comment: Intro}");
  content = content.replace(/\[\/intro\]/gi, "");
  content = content.replace(/\[verse\]/gi, "{start_of_verse}");
  content = content.replace(/\[\/verse\]/gi, "{end_of_verse}");
  content = content.replace(/\[chorus\]/gi, "{start_of_chorus}");
  content = content.replace(/\[\/chorus\]/gi, "{end_of_chorus}");
  content = content.replace(/\[bridge\]/gi, "{start_of_bridge}");
  content = content.replace(/\[\/bridge\]/gi, "{end_of_bridge}");

  return content
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function ugContentToChordPro(
  content: string,
  title: string,
  artist: string,
  key?: string,
  capo?: number
): string {
  const lines: string[] = [];
  lines.push(`{title: ${title}}`);
  if (artist) lines.push(`{artist: ${artist}}`);
  if (key) lines.push(`{key: ${key}}`);
  if (capo && capo > 0) lines.push(`{capo: ${capo}}`);
  lines.push("");
  lines.push(content);
  return lines.join("\n");
}

export function parseUgStoreData(
  data: UgStoreData,
  sourceUrl?: string
): UgImportResult | null {
  const pageData = data.store?.page?.data;
  if (!pageData) return null;

  const tab = pageData.tab;
  const tabView = pageData.tab_view;
  const rawContent =
    tabView?.wiki_tab?.content || tabView?.tab?.content || "";

  if (!rawContent) return null;

  const title = tab?.song_name?.trim() || "Sans titre";
  const artist = tab?.artist_name?.trim() || "";
  const key =
    tab?.tonality?.trim() ||
    tabView?.meta?.tonality?.trim() ||
    "";

  let capo = 0;
  const capoVal = tabView?.meta?.capo;
  if (typeof capoVal === "number") capo = capoVal;
  else if (typeof capoVal === "string") capo = parseInt(capoVal, 10) || 0;

  const cleaned = cleanUgContent(rawContent);

  return {
    title,
    artist,
    key,
    capo,
    chordpro: ugContentToChordPro(cleaned, title, artist, key, capo),
    sourceUrl: sourceUrl || tab?.tab_url,
  };
}

export function parseUgJson(json: string, sourceUrl?: string): UgImportResult | null {
  try {
    const parsed = JSON.parse(json) as unknown;
    const data = normalizeUgStorePayload(parsed);
    if (!data) return null;
    return parseUgStoreData(data, sourceUrl);
  } catch {
    return null;
  }
}

export function parseUgHtml(html: string, sourceUrl?: string): UgImportResult | null {
  const storeMatch = html.match(
    /class="[^"]*js-store[^"]*"[^>]*data-content="([^"]+)"/
  );
  if (storeMatch) {
    const decoded = storeMatch[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    const result = parseUgJson(decoded, sourceUrl);
    if (result) return result;
  }

  const ugappMatch = html.match(/window\.UGAPP\s*=\s*(\{[\s\S]*?\});/);
  if (ugappMatch) {
    const result = parseUgJson(ugappMatch[1], sourceUrl);
    if (result) return result;
  }

  const dataContentAttr = html.match(/data-content="(\{&quot;[\s\S]*?&quot;\})"/);
  if (dataContentAttr) {
    const decoded = dataContentAttr[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&");
    const result = parseUgJson(decoded, sourceUrl);
    if (result) return result;
  }

  // data-content on any element
  const dataContentMatch = html.match(/data-content='(\{[^']+\})'/);
  if (dataContentMatch) {
    const result = parseUgJson(dataContentMatch[1], sourceUrl);
    if (result) return result;
  }

  // window.__DATA__ embedded script
  const dataMatch = html.match(/window\.__DATA__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
  if (dataMatch) {
    const result = parseUgJson(dataMatch[1], sourceUrl);
    if (result) return result;
  }

  // application/json script tag
  const scriptMatch = html.match(
    /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/
  );
  if (scriptMatch) {
    const result = parseUgJson(scriptMatch[1], sourceUrl);
    if (result) return result;
  }

  // Raw JSON pasted directly
  if (html.trim().startsWith("{")) {
    const result = parseUgJson(html, sourceUrl);
    if (result) return result;
  }

  // Fallback: pre tag content
  const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
  if (preMatch) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.split(" by ")?.[0]?.trim() || "Sans titre";
    const artist =
      titleMatch?.[1]?.split(" by ")?.[1]?.replace(/ \|.*$/, "")?.trim() || "";
    const cleaned = cleanUgContent(preMatch[1]);

    return {
      title,
      artist,
      key: "",
      capo: 0,
      chordpro: ugContentToChordPro(cleaned, title, artist),
      sourceUrl,
    };
  }

  return null;
}

export function extractTabIdFromUrl(url: string): string | null {
  const match = url.match(/\/tab(?:s)?\/(?:[^/]+\/)?(\d+)/);
  return match?.[1] ?? null;
}

export function normalizeUgUrl(url: string): string {
  const tabId = extractTabIdFromUrl(url);
  if (tabId) {
    return `https://tabs.ultimate-guitar.com/tab/${tabId}`;
  }
  return url;
}

export const UG_BLOCKED_MESSAGE =
  "Ultimate Guitar bloque les imports automatiques (protection Cloudflare). Ouvrez la page du tab dans votre navigateur, puis utilisez le bookmarklet LiveStage ou collez le code source de la page.";
