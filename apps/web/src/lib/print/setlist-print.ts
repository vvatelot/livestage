import type { SetlistItemKind } from "@/lib/types";

export type SetlistPrintEntry =
  | {
      kind: "song";
      index: number;
      title: string;
      artist: string;
      notes?: string;
      transpose?: number;
    }
  | {
      kind: "marker";
      index: number;
      title: string;
      notes?: string;
    };

export interface SetlistPrintData {
  name: string;
  eventDate?: string;
  notes?: string;
  entries: SetlistPrintEntry[];
}

export function buildSetlistPrintData(input: {
  name: string;
  eventDate?: string;
  notes?: string;
  items: Array<{
    kind?: SetlistItemKind;
    label?: string;
    notes?: string;
    transpose?: number;
    song?: { title: string; artist: string; deleted?: boolean };
  }>;
}): SetlistPrintData {
  const entries: SetlistPrintEntry[] = [];
  let index = 0;

  for (const item of input.items) {
    const kind = item.kind ?? "song";
    index += 1;

    if (kind === "marker") {
      entries.push({
        kind: "marker",
        index,
        title: item.label ?? "Section",
        notes: item.notes,
      });
      continue;
    }

    if (!item.song || item.song.deleted) {
      entries.push({
        kind: "song",
        index,
        title: "Chanson supprimée",
        artist: "",
        notes: item.notes,
        transpose: item.transpose,
      });
      continue;
    }

    entries.push({
      kind: "song",
      index,
      title: item.song.title,
      artist: item.song.artist,
      notes: item.notes,
      transpose: item.transpose,
    });
  }

  return {
    name: input.name,
    eventDate: input.eventDate,
    notes: input.notes,
    entries,
  };
}
