/** Decode HTML entities in tab content (UG exports &Ccedil;, &#231;, etc.) */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&Ccedil;/gi, "Ç")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&Eacute;/gi, "É")
    .replace(/&eacute;/gi, "é")
    .replace(/&Egrave;/gi, "È")
    .replace(/&egrave;/gi, "è")
    .replace(/&Agrave;/gi, "À")
    .replace(/&agrave;/gi, "à")
    .replace(/&Ugrave;/gi, "Ù")
    .replace(/&ugrave;/gi, "ù")
    .replace(/&Ouml;/gi, "Ö")
    .replace(/&ouml;/gi, "ö")
    .replace(/&iuml;/gi, "ï")
    .replace(/&Iuml;/gi, "Ï");
}
