import { db } from "@/lib/db";
import { getAuthContext } from "@/lib/supabase/auth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Setlist, SetlistItem, Song } from "@/lib/types";
import { clampAutoScrollSpeed } from "@/lib/types";

const MAX_SYNC_RETRIES = 3;

function songToRemote(song: Song, userId: string) {
  return {
    id: song.id,
    user_id: userId,
    title: song.title,
    artist: song.artist,
    key: song.key,
    capo: song.capo,
    chordpro_content: song.chordproContent,
    source_url: song.sourceUrl ?? null,
    youtube_url: song.youtubeUrl ?? null,
    tags: song.tags ?? null,
    auto_scroll_speed: song.autoScrollSpeed ?? null,
    deleted: song.deleted ?? false,
    created_at: song.createdAt,
    updated_at: song.updatedAt,
  };
}

function songFromRemote(row: Record<string, unknown>): Song {
  return {
    id: row.id as string,
    title: row.title as string,
    artist: (row.artist as string) ?? "",
    key: (row.key as string) ?? "",
    capo: (row.capo as number) ?? 0,
    chordproContent: row.chordpro_content as string,
    sourceUrl: (row.source_url as string) ?? undefined,
    youtubeUrl: (row.youtube_url as string) ?? undefined,
    tags: (row.tags as string[]) ?? undefined,
    autoScrollSpeed:
      row.auto_scroll_speed != null
        ? clampAutoScrollSpeed(row.auto_scroll_speed)
        : undefined,
    deleted: (row.deleted as boolean) ?? false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    syncedAt: new Date().toISOString(),
  };
}

function setlistToRemote(setlist: Setlist, userId: string) {
  return {
    id: setlist.id,
    user_id: userId,
    name: setlist.name,
    event_date: setlist.eventDate ?? null,
    notes: setlist.notes ?? null,
    deleted: setlist.deleted ?? false,
    created_at: setlist.createdAt,
    updated_at: setlist.updatedAt,
  };
}

function setlistFromRemote(row: Record<string, unknown>): Setlist {
  return {
    id: row.id as string,
    name: row.name as string,
    eventDate: (row.event_date as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    deleted: (row.deleted as boolean) ?? false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    syncedAt: new Date().toISOString(),
  };
}

function setlistItemToRemote(item: SetlistItem, userId: string) {
  const kind = item.kind ?? "song";
  return {
    id: item.id,
    user_id: userId,
    setlist_id: item.setlistId,
    kind,
    song_id: kind === "song" ? (item.songId ?? null) : null,
    label: item.label ?? null,
    position: item.position,
    notes: item.notes ?? null,
    transpose: item.transpose ?? null,
    deleted: item.deleted ?? false,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function setlistItemFromRemote(row: Record<string, unknown>): SetlistItem {
  const kind = (row.kind as SetlistItem["kind"]) ?? "song";
  return {
    id: row.id as string,
    setlistId: row.setlist_id as string,
    kind,
    songId: (row.song_id as string) ?? undefined,
    label: (row.label as string) ?? undefined,
    position: row.position as number,
    notes: (row.notes as string) ?? undefined,
    transpose: (row.transpose as number) ?? undefined,
    deleted: (row.deleted as boolean) ?? false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    syncedAt: new Date().toISOString(),
  };
}

function isAuthOrRlsError(error: { message: string; code?: string }): boolean {
  const msg = error.message.toLowerCase();
  return (
    msg.includes("row-level security") ||
    msg.includes("not authenticated") ||
    msg.includes("jwt") ||
    msg.includes("invalid claim") ||
    error.code === "42501" ||
    error.code === "PGRST301"
  );
}

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

let syncInProgress = false;
let syncIntervalId: ReturnType<typeof setInterval> | null = null;
let autoSyncCleanup: (() => void) | null = null;

export async function syncWithSupabase(): Promise<SyncStatus> {
  if (!isSupabaseConfigured() || syncInProgress) {
    return isSupabaseConfigured() ? "idle" : "offline";
  }

  const supabase = createClient();
  if (!supabase) return "offline";

  const auth = await getAuthContext();
  if (!auth) {
    return "idle";
  }

  syncInProgress = true;

  try {
    const userId = auth.user.id;

    const queue = await db.syncQueue.orderBy("createdAt").toArray();

    for (const item of queue) {
      try {
        let error: { message: string; code?: string } | null = null;

        if (item.entity === "song") {
          const song = item.payload as unknown as Song;
          if (item.operation === "delete") {
            const res = await supabase
              .from("songs")
              .update({ deleted: true, updated_at: new Date().toISOString() })
              .eq("id", item.entityId)
              .eq("user_id", userId);
            error = res.error;
          } else {
            const res = await supabase
              .from("songs")
              .upsert(songToRemote(song, userId), { onConflict: "id" });
            error = res.error;
          }
        } else if (item.entity === "setlist") {
          const setlist = item.payload as unknown as Setlist;
          if (item.operation === "delete") {
            const res = await supabase
              .from("setlists")
              .update({ deleted: true, updated_at: new Date().toISOString() })
              .eq("id", item.entityId)
              .eq("user_id", userId);
            error = res.error;
          } else {
            const res = await supabase
              .from("setlists")
              .upsert(setlistToRemote(setlist, userId), { onConflict: "id" });
            error = res.error;
          }
        } else if (item.entity === "setlist_item") {
          const setlistItem = item.payload as unknown as SetlistItem;
          if (item.operation === "delete") {
            const res = await supabase
              .from("setlist_items")
              .update({ deleted: true, updated_at: new Date().toISOString() })
              .eq("id", item.entityId)
              .eq("user_id", userId);
            error = res.error;
          } else {
            const res = await supabase
              .from("setlist_items")
              .upsert(setlistItemToRemote(setlistItem, userId), {
                onConflict: "id",
              });
            error = res.error;
          }
        }

        if (error) {
          if (isAuthOrRlsError(error)) {
            syncInProgress = false;
            return "error";
          }
          if (item.id !== undefined && item.retries < MAX_SYNC_RETRIES) {
            await db.syncQueue.update(item.id, { retries: item.retries + 1 });
          }
          continue;
        }

        if (item.id !== undefined) {
          await db.syncQueue.delete(item.id);
        }
      } catch {
        if (item.id !== undefined && item.retries < MAX_SYNC_RETRIES) {
          await db.syncQueue.update(item.id, { retries: item.retries + 1 });
        }
      }
    }

    const lastSync = localStorage.getItem("livestage_last_sync");
    const since = lastSync ?? "1970-01-01T00:00:00.000Z";

    const { data: remoteSongs, error: songsError } = await supabase
      .from("songs")
      .select("*")
      .eq("user_id", userId)
      .gt("updated_at", since);

    if (songsError && isAuthOrRlsError(songsError)) {
      syncInProgress = false;
      return "error";
    }

    if (remoteSongs) {
      for (const row of remoteSongs) {
        const remote = songFromRemote(row);
        const local = await db.songs.get(remote.id);
        if (!local || new Date(remote.updatedAt) >= new Date(local.updatedAt)) {
          await db.songs.put(remote);
        }
      }
    }

    const { data: remoteSetlists } = await supabase
      .from("setlists")
      .select("*")
      .eq("user_id", userId)
      .gt("updated_at", since);

    if (remoteSetlists) {
      for (const row of remoteSetlists) {
        const remote = setlistFromRemote(row);
        const local = await db.setlists.get(remote.id);
        if (!local || new Date(remote.updatedAt) >= new Date(local.updatedAt)) {
          await db.setlists.put(remote);
        }
      }
    }

    const { data: remoteItems } = await supabase
      .from("setlist_items")
      .select("*")
      .eq("user_id", userId)
      .gt("updated_at", since);

    if (remoteItems) {
      for (const row of remoteItems) {
        const remote = setlistItemFromRemote(row);
        const local = await db.setlistItems.get(remote.id);
        if (!local || new Date(remote.updatedAt) >= new Date(local.updatedAt)) {
          await db.setlistItems.put(remote);
        }
      }
    }

    localStorage.setItem("livestage_last_sync", new Date().toISOString());
    syncInProgress = false;
    return "synced";
  } catch {
    syncInProgress = false;
    return "error";
  }
}

function stopSyncPolling() {
  if (syncIntervalId !== null) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}

function startSyncPolling(runSync: () => void) {
  stopSyncPolling();
  syncIntervalId = setInterval(runSync, 60_000);
}

export function setupAutoSync(onStatusChange?: (status: SyncStatus) => void) {
  if (!isSupabaseConfigured()) return () => {};

  if (autoSyncCleanup) {
    autoSyncCleanup();
    autoSyncCleanup = null;
  }

  const supabase = createClient();
  if (!supabase) return () => {};

  const runSync = async () => {
    const auth = await getAuthContext();
    if (!auth) {
      onStatusChange?.("idle");
      return;
    }
    onStatusChange?.("syncing");
    const status = await syncWithSupabase();
    onStatusChange?.(status);
  };

  const applyAuthState = async (hasSession: boolean) => {
    if (hasSession) {
      await runSync();
      startSyncPolling(() => void runSync());
    } else {
      stopSyncPolling();
      onStatusChange?.("idle");
    }
  };

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      stopSyncPolling();
      onStatusChange?.("idle");
      return;
    }
    if (session?.user) {
      void applyAuthState(true);
    }
  });

  const onOnline = () => void runSync();
  window.addEventListener("online", onOnline);

  void getAuthContext().then((auth) => {
    void applyAuthState(Boolean(auth));
  });

  const cleanup = () => {
    subscription.unsubscribe();
    stopSyncPolling();
    window.removeEventListener("online", onOnline);
  };

  autoSyncCleanup = cleanup;
  return cleanup;
}
