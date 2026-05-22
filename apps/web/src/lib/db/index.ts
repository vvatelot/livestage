import Dexie, { type EntityTable } from "dexie";
import type { Setlist, SetlistItem, Song, SyncQueueItem } from "@/lib/types";

class LiveStageDB extends Dexie {
  songs!: EntityTable<Song, "id">;
  setlists!: EntityTable<Setlist, "id">;
  setlistItems!: EntityTable<SetlistItem, "id">;
  syncQueue!: EntityTable<SyncQueueItem, "id">;

  constructor() {
    super("livestage");

    this.version(1).stores({
      songs: "id, title, artist, key, updatedAt, deleted",
      setlists: "id, name, eventDate, updatedAt, deleted",
      setlistItems: "id, setlistId, songId, position, updatedAt, deleted",
      syncQueue: "++id, entity, entityId, createdAt",
    });

    this.version(2).stores({
      songs: "id, title, artist, key, updatedAt, deleted",
      setlists: "id, name, eventDate, updatedAt, deleted",
      setlistItems: "id, setlistId, songId, position, updatedAt, deleted",
      syncQueue: "++id, [entity+entityId], entity, entityId, createdAt",
    });

    this.version(3)
      .stores({
        songs: "id, title, artist, key, updatedAt, deleted",
        setlists: "id, name, eventDate, updatedAt, deleted",
        setlistItems: "id, setlistId, kind, songId, position, updatedAt, deleted",
        syncQueue: "++id, [entity+entityId], entity, entityId, createdAt",
      })
      .upgrade((tx) =>
        tx
          .table("setlistItems")
          .toCollection()
          .modify((item) => {
            if (!item.kind) {
              item.kind = "song";
            }
          })
      );
  }
}

export const db = new LiveStageDB();
