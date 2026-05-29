import { db } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getAuthContext } from "@/lib/supabase/auth";
import type {
  Setlist,
  SetlistItem,
  Song,
  SyncEntity,
  SyncOperation,
  SyncQueueItem,
} from "@/lib/types";
import { generateId } from "@/lib/utils";

function syncQueueKey(entity: SyncEntity, entityId: string): [SyncEntity, string] {
  return [entity, entityId];
}

/** Une seule entrée par chanson/setlist : remplace l’ancienne au lieu d’empiler. */
async function enqueueSync(
  entity: SyncEntity,
  entityId: string,
  operation: SyncOperation,
  payload: Record<string, unknown>
) {
  if (!isSupabaseConfigured()) return;

  const auth = await getAuthContext();
  if (!auth) return;

  await db.syncQueue
    .where("[entity+entityId]")
    .equals(syncQueueKey(entity, entityId))
    .delete();

  await db.syncQueue.add({
    entity,
    entityId,
    operation,
    payload,
    createdAt: new Date().toISOString(),
    retries: 0,
  });
}

/** Fusionne les centaines de milliers d’entrées créées par l’auto-save à chaque frappe. */
export async function dedupeSyncQueue(): Promise<number> {
  const all = await db.syncQueue.toArray();
  if (all.length <= 1) return all.length;

  const latest = new Map<
    string,
    Omit<SyncQueueItem, "id">
  >();

  for (const item of all) {
    const key = `${item.entity}:${item.entityId}`;
    const existing = latest.get(key);
    if (!existing || item.createdAt >= existing.createdAt) {
      latest.set(key, {
        entity: item.entity,
        entityId: item.entityId,
        operation: item.operation,
        payload: item.payload,
        createdAt: item.createdAt,
        retries: item.retries,
      });
    }
  }

  await db.transaction("rw", db.syncQueue, async () => {
    await db.syncQueue.clear();
    await db.syncQueue.bulkAdd([...latest.values()]);
  });

  return latest.size;
}

/** Supprime toute la file (les chansons locales dans IndexedDB ne sont pas touchées). */
export async function clearSyncQueue(): Promise<void> {
  await db.syncQueue.clear();
}

// ─── Songs ───────────────────────────────────────────────────────────────────

export async function getSongs(): Promise<Song[]> {
  return db.songs.filter((s) => !s.deleted).sortBy("title");
}

export async function getSong(id: string): Promise<Song | undefined> {
  const song = await db.songs.get(id);
  return song?.deleted ? undefined : song;
}

export async function createSong(
  data: Omit<Song, "id" | "createdAt" | "updatedAt">
): Promise<Song> {
  const now = new Date().toISOString();
  const song: Song = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  await db.songs.add(song);
  await enqueueSync("song", song.id, "create", song as unknown as Record<string, unknown>);
  return song;
}

export async function updateSong(
  id: string,
  data: Partial<Omit<Song, "id" | "createdAt">>
): Promise<Song | undefined> {
  const existing = await db.songs.get(id);
  if (!existing || existing.deleted) return undefined;

  const updated: Song = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await db.songs.put(updated);
  await enqueueSync("song", id, "update", updated as unknown as Record<string, unknown>);
  return updated;
}

export async function deleteSong(id: string): Promise<void> {
  const existing = await db.songs.get(id);
  if (!existing) return;

  const updated: Song = {
    ...existing,
    deleted: true,
    updatedAt: new Date().toISOString(),
  };
  await db.songs.put(updated);
  await enqueueSync("song", id, "delete", { id });
}

// ─── Setlists ────────────────────────────────────────────────────────────────

export async function getSetlists(): Promise<Setlist[]> {
  return db.setlists.filter((s) => !s.deleted).reverse().sortBy("updatedAt");
}

export async function getSetlist(id: string): Promise<Setlist | undefined> {
  const setlist = await db.setlists.get(id);
  return setlist?.deleted ? undefined : setlist;
}

export async function createSetlist(
  data: Omit<Setlist, "id" | "createdAt" | "updatedAt">
): Promise<Setlist> {
  const now = new Date().toISOString();
  const setlist: Setlist = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  await db.setlists.add(setlist);
  await enqueueSync("setlist", setlist.id, "create", setlist as unknown as Record<string, unknown>);
  return setlist;
}

export async function updateSetlist(
  id: string,
  data: Partial<Omit<Setlist, "id" | "createdAt">>
): Promise<Setlist | undefined> {
  const existing = await db.setlists.get(id);
  if (!existing || existing.deleted) return undefined;

  const updated: Setlist = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await db.setlists.put(updated);
  await enqueueSync("setlist", id, "update", updated as unknown as Record<string, unknown>);
  return updated;
}

export async function deleteSetlist(id: string): Promise<void> {
  const existing = await db.setlists.get(id);
  if (!existing) return;

  const updated: Setlist = {
    ...existing,
    deleted: true,
    updatedAt: new Date().toISOString(),
  };
  await db.setlists.put(updated);
  await enqueueSync("setlist", id, "delete", { id });

  const items = await db.setlistItems.where("setlistId").equals(id).toArray();
  for (const item of items) {
    await deleteSetlistItem(item.id);
  }
}

export async function duplicateSetlist(id: string): Promise<Setlist | undefined> {
  const existing = await getSetlist(id);
  if (!existing) return undefined;

  const copy = await createSetlist({
    name: `${existing.name} (copie)`,
    eventDate: existing.eventDate,
    notes: existing.notes,
  });

  const items = await getSetlistItems(id);
  for (const item of items) {
    if (item.kind === "marker") {
      await addSetlistMarker(copy.id, {
        label: item.label ?? "Section",
        notes: item.notes,
      });
    } else if (item.songId) {
      await addSetlistItem(copy.id, item.songId, item.notes, item.transpose);
    }
  }

  return copy;
}

// ─── Setlist Items ───────────────────────────────────────────────────────────

export async function getSetlistItems(setlistId: string): Promise<SetlistItem[]> {
  const items = await db.setlistItems
    .where("setlistId")
    .equals(setlistId)
    .filter((i) => !i.deleted)
    .sortBy("position");
  return items.map((item) => ({
    ...item,
    kind: item.kind ?? "song",
  }));
}

export async function getSetlistWithSongs(setlistId: string) {
  const setlist = await getSetlist(setlistId);
  if (!setlist) return null;

  const items = await getSetlistItems(setlistId);
  const songs = await Promise.all(
    items.map((i) =>
      i.kind === "marker" || !i.songId ? Promise.resolve(undefined) : getSong(i.songId)
    )
  );

  return {
    setlist,
    items: items.map((item, index) => ({
      ...item,
      song: songs[index],
    })),
  };
}

export async function addSetlistItem(
  setlistId: string,
  songId: string,
  notes?: string,
  transpose?: number
): Promise<SetlistItem> {
  const existing = await db.setlistItems
    .where("setlistId")
    .equals(setlistId)
    .filter((i) => !i.deleted)
    .toArray();

  const now = new Date().toISOString();
  const item: SetlistItem = {
    id: generateId(),
    setlistId,
    kind: "song",
    songId,
    position: existing.length,
    notes,
    transpose,
    createdAt: now,
    updatedAt: now,
  };

  await db.setlistItems.add(item);
  await enqueueSync("setlist_item", item.id, "create", item as unknown as Record<string, unknown>);
  await updateSetlist(setlistId, {});
  return item;
}

export async function addSetlistMarker(
  setlistId: string,
  data: { label: string; notes?: string }
): Promise<SetlistItem> {
  const existing = await db.setlistItems
    .where("setlistId")
    .equals(setlistId)
    .filter((i) => !i.deleted)
    .toArray();

  const now = new Date().toISOString();
  const item: SetlistItem = {
    id: generateId(),
    setlistId,
    kind: "marker",
    label: data.label.trim() || "Section",
    notes: data.notes?.trim() || undefined,
    position: existing.length,
    createdAt: now,
    updatedAt: now,
  };

  await db.setlistItems.add(item);
  await enqueueSync("setlist_item", item.id, "create", item as unknown as Record<string, unknown>);
  await updateSetlist(setlistId, {});
  return item;
}

export async function updateSetlistItem(
  id: string,
  data: Partial<Omit<SetlistItem, "id" | "createdAt">>
): Promise<SetlistItem | undefined> {
  const existing = await db.setlistItems.get(id);
  if (!existing || existing.deleted) return undefined;

  const updated: SetlistItem = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await db.setlistItems.put(updated);
  await enqueueSync("setlist_item", id, "update", updated as unknown as Record<string, unknown>);
  return updated;
}

export async function deleteSetlistItem(id: string): Promise<void> {
  const existing = await db.setlistItems.get(id);
  if (!existing) return;

  const updated: SetlistItem = {
    ...existing,
    deleted: true,
    updatedAt: new Date().toISOString(),
  };
  await db.setlistItems.put(updated);
  await enqueueSync("setlist_item", id, "delete", { id });
}

export async function reorderSetlistItems(
  setlistId: string,
  orderedIds: string[]
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await updateSetlistItem(orderedIds[i], { position: i });
  }
  await updateSetlist(setlistId, {});
}

export async function prefetchSetlistForOffline(setlistId: string): Promise<void> {
  const data = await getSetlistWithSongs(setlistId);
  if (!data) return;
  // Songs are already in IndexedDB; this ensures they're loaded into memory cache
  for (const item of data.items) {
    if (item.kind !== "marker" && item.song) {
      await db.songs.put(item.song);
    }
  }
}

export async function getPendingSyncCount(): Promise<number> {
  return db.syncQueue.count();
}

/** @deprecated Ne fait plus rien — conservé pour les bundles en cache qui l’appellent encore. */
export async function seedDemoData(): Promise<void> {}
