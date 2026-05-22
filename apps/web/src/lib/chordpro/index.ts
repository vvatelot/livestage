import { ChordProParser, HtmlTableFormatter } from "chordsheetjs";
import type { Song } from "@/lib/types";
import { decodeHtmlEntities } from "./decode-html";
import { isChordOverWordsFormat, renderAlignedChordHtml } from "./aligned-render";

const parser = new ChordProParser();
const formatter = new HtmlTableFormatter();

export function parseChordPro(content: string) {
  return parser.parse(content);
}

export function renderChordProHtml(
  content: string,
  transpose = 0,
  className = "chord-sheet"
): string {
  const normalized = decodeHtmlEntities(content);

  // UG / aligned format: chords on separate line above lyrics
  if (isChordOverWordsFormat(normalized)) {
    const alignedClass = className.includes("chord-sheet-live")
      ? `${className} chord-sheet-aligned`
      : "chord-sheet chord-sheet-aligned";
    return renderAlignedChordHtml(normalized, transpose, alignedClass);
  }

  try {
    let song = parser.parse(normalized);
    if (transpose !== 0) {
      song = song.transpose(transpose);
    }
    const html = formatter.format(song);
    return `<div class="${className}">${html}</div>`;
  } catch {
    return `<pre class="${className}">${escapeHtml(normalized)}</pre>`;
  }
}

export function extractMetadata(content: string): Partial<Song> {
  const decoded = decodeHtmlEntities(content);
  const titleMatch = decoded.match(/\{title:\s*(.+?)\}/i);
  const artistMatch = decoded.match(/\{artist:\s*(.+?)\}/i);
  const keyMatch = decoded.match(/\{key:\s*(.+?)\}/i);
  const capoMatch = decoded.match(/\{capo:\s*(\d+)\}/i);
  const youtubeMatch = decoded.match(/\{youtube:\s*(.+?)\}/i);

  return {
    title: titleMatch?.[1]?.trim() || "",
    artist: artistMatch?.[1]?.trim() || "",
    key: keyMatch?.[1]?.trim() || "",
    capo: capoMatch ? parseInt(capoMatch[1], 10) : 0,
    youtubeUrl: youtubeMatch?.[1]?.trim() || "",
  };
}

export function toChordProFile(song: Song): string {
  const lines: string[] = [];

  if (!song.chordproContent.includes("{title:")) {
    lines.push(`{title: ${song.title}}`);
  }
  if (!song.chordproContent.includes("{artist:") && song.artist) {
    lines.push(`{artist: ${song.artist}}`);
  }
  if (!song.chordproContent.includes("{key:") && song.key) {
    lines.push(`{key: ${song.key}}`);
  }
  if (!song.chordproContent.includes("{capo:") && song.capo > 0) {
    lines.push(`{capo: ${song.capo}}`);
  }

  if (lines.length > 0) {
    lines.push("");
  }

  lines.push(song.chordproContent);
  return lines.join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
