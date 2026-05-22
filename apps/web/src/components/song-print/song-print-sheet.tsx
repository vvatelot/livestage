"use client";

import { ChordDisplay } from "@/components/chord-display/chord-display";
import type { SongPrintData } from "@/lib/print/song-print";

interface SongPrintSheetProps {
  data: SongPrintData;
}

export function SongPrintSheet({ data }: SongPrintSheetProps) {
  const transpose = data.transpose ?? 0;
  const metaParts: string[] = [];
  if (data.key) {
    const keyLabel =
      transpose !== 0
        ? `${data.key} (${transpose > 0 ? "+" : ""}${transpose})`
        : data.key;
    metaParts.push(`Tonalité : ${keyLabel}`);
  }
  if (data.capo && data.capo > 0) {
    metaParts.push(`Capo : ${data.capo}`);
  }

  return (
    <article className="song-print-sheet max-w-3xl mx-auto bg-white text-black rounded-lg border p-8 print:border-0 print:p-0 print:max-w-none">
      <header className="song-print-header mb-6">
        <h1 className="song-print-title text-2xl font-bold">
          {data.title.trim() || "Sans titre"}
        </h1>
        {data.artist.trim() && (
          <p className="song-print-artist text-muted-foreground mt-1">
            {data.artist}
          </p>
        )}
        {metaParts.length > 0 && (
          <p className="song-print-meta text-sm text-muted-foreground mt-2">
            {metaParts.join(" · ")}
          </p>
        )}
      </header>
      <ChordDisplay
        content={data.chordproContent}
        transpose={transpose}
        className="song-print-body"
      />
    </article>
  );
}
