"use client";

import { Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { SongPrintData } from "@/lib/print/song-print";
import { saveSongPrintData } from "@/lib/print/song-print";

interface SongPrintActionsProps {
  data: SongPrintData;
  /** Chanson enregistrée : utilise la page dédiée avec métadonnées Dexie. */
  songId?: string;
  className?: string;
}

export function SongPrintActions({
  data,
  songId,
  className,
}: SongPrintActionsProps) {
  const router = useRouter();

  function handlePrint() {
    saveSongPrintData(data);
    const transpose = data.transpose ?? 0;
    if (songId) {
      router.push(
        `/songs/${songId}/print?transpose=${transpose}&auto=1`
      );
    } else {
      router.push("/print?auto=1");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={handlePrint}
      title="Ouvre la page d’impression"
    >
      <Printer className="h-4 w-4" />
      Imprimer
    </Button>
  );
}
