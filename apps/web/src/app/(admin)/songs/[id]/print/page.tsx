"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { SongPrintSheet } from "@/components/song-print/song-print-sheet";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { loadSongPrintData } from "@/lib/print/song-print";

export default function SongPrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const autoPrint = searchParams.get("auto") === "1";
  const transposeParam = searchParams.get("transpose");
  const transposeFromUrl = transposeParam ? parseInt(transposeParam, 10) : 0;
  const transpose = Number.isFinite(transposeFromUrl) ? transposeFromUrl : 0;

  const song = useLiveQuery(() => db.songs.get(id), [id]);
  const sessionData = useMemo(() => loadSongPrintData(), []);

  const printData = useMemo(() => {
    if (!song || song.deleted) return null;
    return {
      title: sessionData?.title ?? song.title,
      artist: sessionData?.artist ?? song.artist,
      key: sessionData?.key ?? song.key,
      capo: sessionData?.capo ?? song.capo,
      chordproContent: sessionData?.chordproContent ?? song.chordproContent,
      transpose: sessionData?.transpose ?? transpose,
    };
  }, [song, sessionData, transpose]);

  useEffect(() => {
    if (!autoPrint || !printData) return;
    const t = window.setTimeout(() => {
      window.print();
    }, 400);
    return () => window.clearTimeout(t);
  }, [autoPrint, printData]);

  if (!song) {
    return <p className="text-muted-foreground">Chargement…</p>;
  }

  if (song.deleted || !printData) {
    return <p className="text-muted-foreground">Chanson supprimée.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Utilisez la boîte de dialogue pour imprimer ou enregistrer en PDF.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/songs/${id}`}>Retour</Link>
          </Button>
          <Button onClick={() => window.print()}>Imprimer</Button>
        </div>
      </div>
      <SongPrintSheet data={printData} />
    </div>
  );
}
