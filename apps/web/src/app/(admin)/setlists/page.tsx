"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Play, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/db";
import { createSetlist, deleteSetlist, duplicateSetlist } from "@/lib/db/repository";
import { formatDate } from "@/lib/utils";

export default function SetlistsPage() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");

  const setlists = useLiveQuery(
    () => db.setlists.filter((s) => !s.deleted).reverse().sortBy("updatedAt"),
    []
  );

  async function handleCreate() {
    if (!name.trim()) return;
    const setlist = await createSetlist({
      name: name.trim(),
      eventDate: eventDate || undefined,
    });
    setCreateOpen(false);
    setName("");
    setEventDate("");
    router.push(`/setlists/${setlist.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Setlists</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle setlist
        </Button>
      </div>

      {(setlists ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucune setlist. Créez-en une pour votre prochain concert !
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {(setlists ?? []).map((setlist) => (
            <Card key={setlist.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="flex items-center justify-between p-4">
                <Link href={`/setlists/${setlist.id}`} className="flex-1 min-w-0">
                  <p className="font-medium truncate">{setlist.name}</p>
                  {setlist.eventDate && (
                    <p className="text-sm text-muted-foreground">
                      {formatDate(setlist.eventDate)}
                    </p>
                  )}
                </Link>
                <div className="flex items-center gap-1 ml-4">
                  <Button variant="default" size="sm" asChild>
                    <Link href={`/live/${setlist.id}`}>
                      <Play className="h-4 w-4" />
                      Scène
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => duplicateSetlist(setlist.id)}
                    title="Dupliquer"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSetlist(setlist.id)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle setlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                placeholder="Concert du 15 juin"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date (optionnel)</Label>
              <Input
                id="date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <Button onClick={handleCreate} disabled={!name.trim()} className="w-full">
              Créer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
