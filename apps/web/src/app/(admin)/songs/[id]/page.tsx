"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ChordEditor } from "@/components/chord-editor/chord-editor";
import { SongPrintActions } from "@/components/song-print/song-print-actions";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { updateSong } from "@/lib/db/repository";

export default function EditSongPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [saving, setSaving] = useState(false);

  const song = useLiveQuery(() => db.songs.get(id), [id]);

  const handleChange = useCallback(
    async (data: {
      title: string;
      artist: string;
      key: string;
      capo: number;
      chordproContent: string;
      youtubeUrl: string;
    }) => {
      if (!song) return;
      await updateSong(id, data);
    },
    [id, song]
  );

  async function handleSave() {
    setSaving(true);
    router.push("/songs");
    setSaving(false);
  }

  if (!song) {
    return <p className="text-muted-foreground">Chargement...</p>;
  }

  if (song.deleted) {
    return <p className="text-muted-foreground">Chanson supprimée.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{song.title}</h1>
        <div className="flex flex-wrap gap-2">
          <SongPrintActions
            songId={id}
            data={{
              title: song.title,
              artist: song.artist,
              key: song.key,
              capo: song.capo,
              chordproContent: song.chordproContent,
            }}
          />
          <Button variant="outline" onClick={() => router.push("/songs")}>
            Retour
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>
      <ChordEditor
        initialContent={song.chordproContent}
        initialTitle={song.title}
        initialArtist={song.artist}
        initialKey={song.key}
        initialCapo={song.capo}
        initialYoutubeUrl={song.youtubeUrl ?? ""}
        onChange={handleChange}
        songId={id}
      />
    </div>
  );
}
