export interface SongPrintData {
  title: string;
  artist: string;
  key?: string;
  capo?: number;
  chordproContent: string;
  transpose?: number;
}

export const SONG_PRINT_STORAGE_KEY = "livestage-print";

export function saveSongPrintData(data: SongPrintData): void {
  sessionStorage.setItem(SONG_PRINT_STORAGE_KEY, JSON.stringify(data));
}

export function loadSongPrintData(): SongPrintData | null {
  try {
    const raw = sessionStorage.getItem(SONG_PRINT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SongPrintData;
  } catch {
    return null;
  }
}

export function clearSongPrintData(): void {
  sessionStorage.removeItem(SONG_PRINT_STORAGE_KEY);
}
