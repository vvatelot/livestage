export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  capo: number;
  chordproContent: string;
  sourceUrl?: string;
  youtubeUrl?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  deleted?: boolean;
}

export interface Setlist {
  id: string;
  name: string;
  eventDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  deleted?: boolean;
}

export type SetlistItemKind = "song" | "marker";

export type SetlistMarkerPreset = "speech" | "pause" | "tuning" | "break";

export const SETLIST_MARKER_PRESETS: Record<
  SetlistMarkerPreset,
  { label: string }
> = {
  speech: { label: "Annonce" },
  pause: { label: "Pause" },
  tuning: { label: "Accordage" },
  break: { label: "Entracte" },
};

export interface SetlistItem {
  id: string;
  setlistId: string;
  kind: SetlistItemKind;
  songId?: string;
  label?: string;
  position: number;
  notes?: string;
  transpose?: number;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  deleted?: boolean;
}

export type SyncEntity = "song" | "setlist" | "setlist_item";

export type SyncOperation = "create" | "update" | "delete";

export interface SyncQueueItem {
  id?: number;
  entity: SyncEntity;
  entityId: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  createdAt: string;
  retries: number;
}

export interface LiveSettings {
  fontSize: number;
  darkMode: boolean;
  autoScroll: boolean;
  autoScrollSpeed: number;
  locked: boolean;
}

export const DEFAULT_LIVE_SETTINGS: LiveSettings = {
  fontSize: 1.5,
  darkMode: true,
  autoScroll: false,
  autoScrollSpeed: 30,
  locked: false,
};

export const SAMPLE_CHORDPRO = `{title: Swing Low Sweet Chariot}
{artist: Traditional}
{key: D}

{start_of_verse}
Swing [D]low, sweet [G]chari[D]ot
Comin' for to carry me [A7]home
{end_of_verse}

{start_of_chorus}
[D]Country roads, take me [A]home
To the [E]place I be[A]long
{end_of_chorus}`;
