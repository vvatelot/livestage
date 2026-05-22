import { Chord } from "chordsheetjs";
import { decodeHtmlEntities } from "./decode-html";

const CHORD_IN_BRACKETS = /\[[^\]]+\]/g;
const DIRECTIVE_LINE = /^\{[^}]+\}$/;

/** Line with only chords (and spaces), e.g. "    [C]              [F]" */
export function isChordOnlyLine(line: string): boolean {
  if (!CHORD_IN_BRACKETS.test(line)) return false;
  const withoutChords = line.replace(CHORD_IN_BRACKETS, "");
  return withoutChords.replace(/\s/g, "").length === 0;
}

/** UG-style: chord line above lyric line, aligned with spaces */
export function isChordOverWordsFormat(content: string): boolean {
  const lines = content.split("\n");
  let pairs = 0;

  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    const next = lines[i + 1];
    if (line.startsWith("{") || next.startsWith("{")) continue;
    if (isChordOnlyLine(line) && next.trim() && !isChordOnlyLine(next)) {
      pairs++;
    }
  }

  return pairs >= 1;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function transposeChordInBrackets(match: string, semitones: number): string {
  const name = match.slice(1, -1);
  try {
    const chord = Chord.parse(name);
    if (!chord) return match;
    return `[${chord.transpose(semitones).toString()}]`;
  } catch {
    return match;
  }
}

function highlightChordsInLine(line: string, transpose: number): string {
  let processed = line;
  if (transpose !== 0) {
    processed = line.replace(CHORD_IN_BRACKETS, (m) =>
      transposeChordInBrackets(m, transpose)
    );
  }
  return escapeHtml(processed).replace(
    /\[([^\]]+)\]/g,
    '<span class="chord-mark">[$1]</span>'
  );
}

function renderLyricLine(line: string): string {
  return escapeHtml(decodeHtmlEntities(line));
}

type Block =
  | { type: "directive"; text: string }
  | { type: "pair"; chord: string; lyric: string }
  | { type: "text"; text: string };

function parseBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (DIRECTIVE_LINE.test(line.trim())) {
      blocks.push({ type: "directive", text: line.trim() });
      i++;
      continue;
    }

    if (
      isChordOnlyLine(line) &&
      i + 1 < lines.length &&
      lines[i + 1].trim() &&
      !isChordOnlyLine(lines[i + 1]) &&
      !lines[i + 1].startsWith("{")
    ) {
      blocks.push({ type: "pair", chord: line, lyric: lines[i + 1] });
      i += 2;
      continue;
    }

    if (line.trim() || line.length > 0) {
      blocks.push({ type: "text", text: line });
    }
    i++;
  }

  return blocks;
}

/**
 * Renders chord-over-words layout (UG style) preserving space alignment.
 */
export function renderAlignedChordHtml(
  content: string,
  transpose = 0,
  className = "chord-sheet chord-sheet-aligned"
): string {
  const decoded = decodeHtmlEntities(content);
  const blocks = parseBlocks(decoded);

  const parts: string[] = [`<div class="${className}">`];

  for (const block of blocks) {
    if (block.type === "directive") {
      const label = block.text.replace(/^\{|\}$/g, "").replace(/:\s*/, ": ");
      parts.push(`<div class="directive">${escapeHtml(label)}</div>`);
    } else if (block.type === "pair") {
      parts.push('<div class="aligned-pair">');
      parts.push(
        `<div class="chord-line">${highlightChordsInLine(block.chord, transpose)}</div>`
      );
      parts.push(`<div class="lyric-line">${renderLyricLine(block.lyric)}</div>`);
      parts.push("</div>");
    } else if (block.type === "text" && block.text.trim()) {
      if (CHORD_IN_BRACKETS.test(block.text)) {
        parts.push(
          `<div class="chord-line">${highlightChordsInLine(block.text, transpose)}</div>`
        );
      } else {
        parts.push(`<div class="lyric-line">${renderLyricLine(block.text)}</div>`);
      }
    }
  }

  parts.push("</div>");
  return parts.join("");
}
