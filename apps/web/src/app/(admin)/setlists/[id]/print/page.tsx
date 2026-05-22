"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SetlistPrintSheet } from "@/components/setlist-print/setlist-print-sheet";
import { Button } from "@/components/ui/button";
import { getSetlistWithSongs } from "@/lib/db/repository";
import {
  buildSetlistPrintData,
  type SetlistPrintData,
} from "@/lib/print/setlist-print";

export default function SetlistPrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const autoPrint = searchParams.get("auto") === "1";
  const [data, setData] = useState<SetlistPrintData | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getSetlistWithSongs(id);
      if (cancelled) return;

      if (!result || result.setlist.deleted) {
        setMissing(true);
        setData(null);
        return;
      }

      setData(
        buildSetlistPrintData({
          name: result.setlist.name,
          eventDate: result.setlist.eventDate,
          notes: result.setlist.notes,
          items: result.items,
        })
      );
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!autoPrint || !data) return;
    const t = window.setTimeout(() => {
      window.print();
    }, 400);
    return () => window.clearTimeout(t);
  }, [autoPrint, data]);

  if (missing) {
    return (
      <div className="space-y-4 no-print">
        <p className="text-muted-foreground">Setlist introuvable.</p>
        <Button variant="outline" asChild>
          <Link href="/setlists">Retour</Link>
        </Button>
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Chargement…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Format A4 — utilisez la boîte de dialogue pour imprimer ou enregistrer en PDF.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/setlists/${id}`}>Retour</Link>
          </Button>
          <Button onClick={() => window.print()}>Imprimer</Button>
        </div>
      </div>
      <SetlistPrintSheet data={data} />
    </div>
  );
}
