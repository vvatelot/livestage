"use client";

import { useMemo } from "react";
import { renderChordProHtml } from "@/lib/chordpro";
import { cn } from "@/lib/utils";

interface ChordDisplayProps {
  content: string;
  transpose?: number;
  live?: boolean;
  darkMode?: boolean;
  fontSize?: number;
  className?: string;
}

export function ChordDisplay({
  content,
  transpose = 0,
  live = false,
  darkMode = false,
  fontSize = 1,
  className,
}: ChordDisplayProps) {
  const html = useMemo(
    () => renderChordProHtml(content, transpose, live ? "chord-sheet chord-sheet-live" : "chord-sheet"),
    [content, transpose, live]
  );

  return (
    <div
      className={cn(live && darkMode && "dark", className)}
      style={live ? { fontSize: `${fontSize}rem` } : undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
