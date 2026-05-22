"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageSquare, Music, Play } from "lucide-react";
import {
  SetlistSortable,
  type SetlistSortableRow,
} from "@/components/setlist/setlist-sortable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/db";
import {
  addSetlistItem,
  addSetlistMarker,
  deleteSetlistItem,
  getSetlistWithSongs,
  prefetchSetlistForOffline,
  reorderSetlistItems,
} from "@/lib/db/repository";
import {
  SETLIST_MARKER_PRESETS,
  type SetlistMarkerPreset,
  type Song,
} from "@/lib/types";

export default function SetlistDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [addOpen, setAddOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sectionLabel, setSectionLabel] = useState("");
  const [sectionNotes, setSectionNotes] = useState("");
  const [items, setItems] = useState<SetlistSortableRow[]>([]);

  const setlist = useLiveQuery(() => db.setlists.get(id), [id]);
  const allSongs = useLiveQuery(
    () => db.songs.filter((s) => !s.deleted).sortBy("title"),
    []
  );

  useEffect(() => {
    async function load() {
      const data = await getSetlistWithSongs(id);
      if (data) {
        setItems(
          data.items.map((i) => {
            if ((i.kind ?? "song") === "marker") {
              return {
                id: i.id,
                kind: "marker" as const,
                title: i.label ?? "Section",
                notes: i.notes,
              };
            }
            return {
              id: i.id,
              kind: "song" as const,
              songId: i.songId,
              title: i.song?.title ?? "Chanson supprimée",
              artist: i.song?.artist,
              notes: i.notes,
            };
          })
        );
      }
    }
    load();
  }, [id, setlist?.updatedAt]);

  useEffect(() => {
    prefetchSetlistForOffline(id);
  }, [id]);

  const itemSongIds = new Set(
    items
      .filter((i) => i.kind === "song" && i.songId)
      .map((i) => i.songId as string)
  );

  const availableSongs = (allSongs ?? []).filter(
    (s) =>
      !itemSongIds.has(s.id) &&
      (s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.artist.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleAddSong(song: Song) {
    await addSetlistItem(id, song.id);
    setAddOpen(false);
    setSearch("");
  }

  function openSectionDialog() {
    setSectionLabel("");
    setSectionNotes("");
    setSectionOpen(true);
  }

  async function handleAddSection() {
    const label = sectionLabel.trim();
    if (!label) return;
    await addSetlistMarker(id, { label, notes: sectionNotes.trim() || undefined });
    setSectionOpen(false);
    setSectionLabel("");
    setSectionNotes("");
  }

  if (!setlist || setlist.deleted) {
    return <p className="text-muted-foreground">Setlist introuvable.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{setlist.name}</h1>
          {setlist.notes && (
            <p className="text-muted-foreground">{setlist.notes}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setAddOpen(true)}>
            <Music className="h-4 w-4" />
            Chanson
          </Button>
          <Button variant="outline" onClick={() => openSectionDialog()}>
            <MessageSquare className="h-4 w-4" />
            Section
          </Button>
          <Button asChild>
            <Link href={`/live/${id}`}>
              <Play className="h-4 w-4" />
              Mode scène
            </Link>
          </Button>
        </div>
      </div>

      <SetlistSortable
        items={items}
        onReorder={(orderedIds) => reorderSetlistItems(id, orderedIds)}
        onRemove={(itemId) => deleteSetlistItem(itemId)}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une chanson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {availableSongs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune chanson disponible
                </p>
              ) : (
                availableSongs.map((song) => (
                  <button
                    key={song.id}
                    type="button"
                    className="w-full text-left rounded-md px-3 py-2 hover:bg-accent transition-colors"
                    onClick={() => handleAddSong(song)}
                  >
                    <p className="font-medium">{song.title}</p>
                    <p className="text-sm text-muted-foreground">{song.artist}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={sectionOpen} onOpenChange={setSectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SETLIST_MARKER_PRESETS) as SetlistMarkerPreset[]).map(
                (preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSectionLabel(SETLIST_MARKER_PRESETS[preset].label)
                    }
                  >
                    {SETLIST_MARKER_PRESETS[preset].label}
                  </Button>
                )
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-label">Titre</Label>
              <Input
                id="section-label"
                placeholder="ex. Pause, Annonce sponsors…"
                value={sectionLabel}
                onChange={(e) => setSectionLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-notes">Notes (optionnel)</Label>
              <Textarea
                id="section-notes"
                placeholder="Détails pour le groupe : durée, texte à dire…"
                value={sectionNotes}
                onChange={(e) => setSectionNotes(e.target.value)}
                rows={4}
              />
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={!sectionLabel.trim()}
              onClick={handleAddSection}
            >
              Ajouter la section
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
