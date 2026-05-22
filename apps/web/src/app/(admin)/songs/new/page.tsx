"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ChordEditor } from "@/components/chord-editor/chord-editor";
import { Button } from "@/components/ui/button";
import { createSong } from "@/lib/db/repository";
import { SAMPLE_CHORDPRO } from "@/lib/types";

export default function NewSongPage() {
  const router = useRouter();
  const [data, setData] = useState({
    title: "",
    artist: "",
    key: "",
    capo: 0,
    chordproContent: SAMPLE_CHORDPRO,
    youtubeUrl: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = useCallback(
    (newData: typeof data) => setData(newData),
    []
  );

  async function handleSave() {
    if (!data.title.trim()) return;
    setSaving(true);
    const song = await createSong(data);
    setSaving(false);
    router.push(`/songs/${song.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nouvelle chanson</h1>
        <Button onClick={handleSave} disabled={saving || !data.title.trim()}>
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
      <ChordEditor
        initialContent={data.chordproContent}
        onChange={handleChange}
      />
    </div>
  );
}
