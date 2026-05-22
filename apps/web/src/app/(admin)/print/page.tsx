"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SongPrintSheet } from "@/components/song-print/song-print-sheet";
import { Button } from "@/components/ui/button";
import { loadSongPrintData, type SongPrintData } from "@/lib/print/song-print";

export default function GenericPrintPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const autoPrint = searchParams.get("auto") === "1";
  const [data, setData] = useState<SongPrintData | null>(null);

  useEffect(() => {
    const stored = loadSongPrintData();
    setData(stored);
    if (!stored) return;

    if (autoPrint) {
      const t = window.setTimeout(() => {
        window.print();
      }, 400);
      return () => window.clearTimeout(t);
    }
  }, [autoPrint]);

  if (data === null) {
    return (
      <div className="space-y-4 no-print">
        <p className="text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  if (!data.chordproContent) {
    return (
      <div className="space-y-4 no-print">
        <p className="text-muted-foreground">
          Aucune donnée à imprimer. Revenez à la chanson et cliquez sur Imprimer.
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Utilisez la boîte de dialogue pour imprimer ou enregistrer en PDF.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Retour
          </Button>
          <Button onClick={() => window.print()}>Imprimer</Button>
        </div>
      </div>
      <SongPrintSheet data={data} />
    </div>
  );
}
