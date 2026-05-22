import { NextResponse } from "next/server";
import {
  normalizeUgUrl,
  parseUgHtml,
  parseUgJson,
  UG_BLOCKED_MESSAGE,
} from "@/lib/ug-import/parser";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Referer: "https://www.ultimate-guitar.com/",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "same-origin",
  "Upgrade-Insecure-Requests": "1",
};

async function fetchUgPage(url: string): Promise<Response> {
  const normalizedUrl = normalizeUgUrl(url);
  const proxyUrl = process.env.UG_IMPORT_PROXY_URL;

  if (proxyUrl) {
    const proxied = `${proxyUrl}${encodeURIComponent(normalizedUrl)}`;
    return fetch(proxied, { headers: BROWSER_HEADERS });
  }

  return fetch(normalizedUrl, { headers: BROWSER_HEADERS, redirect: "follow" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, html, json, sourceUrl } = body as {
      url?: string;
      html?: string;
      json?: string;
      sourceUrl?: string;
    };

    // Parse pasted JSON (from bookmarklet or devtools)
    if (json) {
      const result = parseUgJson(json, sourceUrl || url);
      if (!result) {
        return NextResponse.json(
          { error: "JSON Ultimate Guitar invalide ou incomplet." },
          { status: 422 }
        );
      }
      return NextResponse.json(result);
    }

    // Parse pasted HTML (view-source or devtools)
    if (html) {
      const result = parseUgHtml(html, sourceUrl || url);
      if (!result) {
        return NextResponse.json(
          {
            error:
              "Impossible d'extraire le contenu du HTML. Vérifiez que vous avez collé la page complète.",
          },
          { status: 422 }
        );
      }
      return NextResponse.json(result);
    }

    // URL fetch (often blocked by Cloudflare)
    if (!url || !url.includes("ultimate-guitar.com")) {
      return NextResponse.json(
        { error: "URL Ultimate Guitar invalide" },
        { status: 400 }
      );
    }

    const response = await fetchUgPage(url);

    if (response.status === 403) {
      return NextResponse.json(
        {
          error: UG_BLOCKED_MESSAGE,
          blocked: true,
          fallbackUrl: url,
        },
        { status: 403 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Impossible de récupérer la page (${response.status})` },
        { status: 502 }
      );
    }

    const pageHtml = await response.text();
    const extracted = parseUgHtml(pageHtml, url);

    if (!extracted?.chordpro) {
      return NextResponse.json(
        {
          error:
            "Impossible d'extraire le contenu. Utilisez le bookmarklet ou collez le HTML de la page.",
          blocked: pageHtml.includes("cf-mitigated") || pageHtml.includes("Just a moment"),
        },
        { status: 422 }
      );
    }

    return NextResponse.json(extracted);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur lors de l'import",
      },
      { status: 500 }
    );
  }
}
