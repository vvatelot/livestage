import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface UgTabContent {
  type?: string;
  content?: string;
}

interface UgWikiTab {
  content?: string;
  tuning?: string;
}

interface UgPageData {
  store?: {
    page?: {
      data?: {
        tab_view?: {
          wiki_tab?: UgWikiTab;
          tab?: UgTabContent;
        };
      };
    };
  };
}

function cleanUgContent(raw: string): string {
  let content = raw;
  content = content.replace(/\[\/?tab\]/gi, "");
  content = content.replace(/\[ch\]([^\[]*?)\[\/ch\]/gi, "[$1]");
  content = content.replace(/<[^>]+>/g, "");
  content = content
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
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
  content = content
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
  return content.trim();
}

function ugContentToChordPro(
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

function extractPageData(html: string): UgPageData | null {
  const patterns = [
    /window\.__DATA__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/,
    /data-content="(\{&quot;[\s\S]*?&quot;\})"/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        let jsonStr = match[1];
        jsonStr = jsonStr.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
        return JSON.parse(jsonStr);
      } catch {
        continue;
      }
    }
  }

  const scriptMatch = html.match(
    /<script[^>]*type="application\/json"[^>]*id="[^"]*data[^"]*"[^>]*>([\s\S]*?)<\/script>/
  );
  if (scriptMatch) {
    try {
      return JSON.parse(scriptMatch[1]);
    } catch {
      // continue
    }
  }

  return null;
}

function extractFromHtml(html: string) {
  const data = extractPageData(html);

  if (data?.store?.page?.data?.tab_view) {
    const tabView = data.store.page.data.tab_view;
    const rawContent = tabView.wiki_tab?.content || tabView.tab?.content || "";
    if (!rawContent) return null;

    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const artistMatch = html.match(/"artist_name"\s*:\s*"([^"]+)"/);
    const keyMatch = html.match(/"tonality"\s*:\s*"([^"]+)"/);
    const capoMatch = html.match(/"capo"\s*:\s*(\d+)/);

    return {
      title: titleMatch?.[1]?.trim() || "Sans titre",
      artist: artistMatch?.[1] || "",
      content: cleanUgContent(rawContent),
      key: keyMatch?.[1],
      capo: capoMatch ? parseInt(capoMatch[1], 10) : 0,
    };
  }

  const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
  if (preMatch) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    return {
      title: titleMatch?.[1]?.split(" by ")?.[0]?.trim() || "Sans titre",
      artist:
        titleMatch?.[1]?.split(" by ")?.[1]?.replace(/ \|.*$/, "")?.trim() || "",
      content: cleanUgContent(preMatch[1]),
    };
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { url } = await req.json();

    if (!url || !url.includes("ultimate-guitar.com")) {
      return new Response(JSON.stringify({ error: "URL Ultimate Guitar invalide" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Impossible de récupérer la page (${response.status})` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();
    const extracted = extractFromHtml(html);

    if (!extracted?.content) {
      return new Response(
        JSON.stringify({
          error: "Impossible d'extraire le contenu. Collez le texte manuellement.",
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    const chordpro = ugContentToChordPro(
      extracted.content,
      extracted.title,
      extracted.artist,
      extracted.key,
      extracted.capo
    );

    return new Response(
      JSON.stringify({
        title: extracted.title,
        artist: extracted.artist,
        key: extracted.key || "",
        capo: extracted.capo || 0,
        chordpro,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erreur lors de l'import",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
