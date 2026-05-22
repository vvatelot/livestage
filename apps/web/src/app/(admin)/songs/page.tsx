"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, ExternalLink, Globe, Plus, Search, Trash2, Upload } from "lucide-react";
import { UgBookmarkletCard } from "@/components/ug-import/ug-bookmarklet-card";
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
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/db";
import { createSong, deleteSong } from "@/lib/db/repository";
import { toChordProFile } from "@/lib/chordpro";
import { UG_BLOCKED_MESSAGE } from "@/lib/ug-import/parser";
import type { Song } from "@/lib/types";

export default function SongsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [ugUrl, setUgUrl] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importBlocked, setImportBlocked] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const [pasteHtml, setPasteHtml] = useState("");

  const songs = useLiveQuery(
    () => db.songs.filter((s) => !s.deleted).sortBy("title"),
    []
  );

  const filtered = (songs ?? []).filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase())
  );

  async function importFromApi(payload: Record<string, string | undefined>) {
    const res = await fetch("/api/import-ultimate-guitar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 403 || data.blocked) {
        setImportBlocked(true);
      }
      throw new Error(data.error || "Import échoué");
    }

    return data as {
      title: string;
      artist: string;
      key: string;
      capo: number;
      chordpro: string;
    };
  }

  async function saveImportedSong(
    data: { title: string; artist: string; key: string; capo: number; chordpro: string },
    sourceUrl?: string
  ) {
    const song = await createSong({
      title: data.title,
      artist: data.artist,
      key: data.key || "",
      capo: data.capo || 0,
      chordproContent: data.chordpro,
      sourceUrl,
    });
    setImportOpen(false);
    setUgUrl("");
    setPasteContent("");
    setPasteHtml("");
    setImportBlocked(false);
    setImportError("");
    router.push(`/songs/${song.id}`);
  }

  async function handleImportUg() {
    if (!ugUrl.trim()) return;
    setImportLoading(true);
    setImportError("");
    setImportBlocked(false);

    try {
      const data = await importFromApi({ url: ugUrl });
      await saveImportedSong(data, ugUrl);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Erreur d'import");
    } finally {
      setImportLoading(false);
    }
  }

  async function handleImportHtml() {
    if (!pasteHtml.trim()) return;
    setImportLoading(true);
    setImportError("");

    try {
      const data = await importFromApi({ html: pasteHtml, sourceUrl: ugUrl || undefined });
      await saveImportedSong(data, ugUrl || undefined);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Erreur d'import");
    } finally {
      setImportLoading(false);
    }
  }

  async function handleImportPaste() {
    if (!pasteContent.trim()) return;
    setImportLoading(true);
    setImportError("");

    try {
      // Try UG JSON/HTML first, then ChordPro
      try {
        const data = await importFromApi({ json: pasteContent, html: pasteContent });
        await saveImportedSong(data);
        return;
      } catch {
        // Not UG format, try ChordPro
      }

      const { extractMetadata } = await import("@/lib/chordpro");
      const meta = extractMetadata(pasteContent);
      await saveImportedSong({
        title: meta.title || "Sans titre",
        artist: meta.artist || "",
        key: meta.key || "",
        capo: meta.capo || 0,
        chordpro: pasteContent,
      });
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Erreur d'import");
    } finally {
      setImportLoading(false);
    }
  }

  function handleExport(song: Song) {
    const content = toChordProFile(song);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${song.title.replace(/[^a-z0-9]/gi, "_")}.cho`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result as string;
      const { extractMetadata } = await import("@/lib/chordpro");
      const meta = extractMetadata(content);
      const song = await createSong({
        title: meta.title || file.name.replace(/\.(cho|pro|chordpro|txt)$/i, ""),
        artist: meta.artist || "",
        key: meta.key || "",
        capo: meta.capo || 0,
        chordproContent: content,
      });
      router.push(`/songs/${song.id}`);
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Bibliothèque</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Globe className="h-4 w-4" />
            Importer
          </Button>
          <label>
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4" />
                Fichier .cho
              </span>
            </Button>
            <input
              type="file"
              accept=".cho,.pro,.chordpro,.txt"
              className="hidden"
              onChange={handleImportFile}
            />
          </label>
          <Button asChild>
            <Link href="/songs/new">
              <Plus className="h-4 w-4" />
              Nouvelle chanson
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par titre ou artiste..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search ? "Aucun résultat" : "Aucune chanson. Commencez par en ajouter une !"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((song) => (
            <Card key={song.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="flex items-center justify-between p-4">
                <Link href={`/songs/${song.id}`} className="flex-1 min-w-0">
                  <p className="font-medium truncate">{song.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {song.artist}
                    {song.key && ` · ${song.key}`}
                    {song.capo > 0 && ` · Capo ${song.capo}`}
                  </p>
                </Link>
                <div className="flex items-center gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleExport(song)}
                    title="Exporter .cho"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSong(song.id)}
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

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importer une chanson</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <UgBookmarkletCard />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* URL directe — souvent bloquée */}
            <div className="space-y-2">
              <Label htmlFor="ug-url">URL Ultimate Guitar</Label>
              <Input
                id="ug-url"
                placeholder="https://fr.ultimate-guitar.com/tab/..."
                value={ugUrl}
                onChange={(e) => {
                  setUgUrl(e.target.value);
                  setImportBlocked(false);
                }}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleImportUg}
                  disabled={importLoading || !ugUrl.trim()}
                  className="flex-1"
                >
                  {importLoading ? "Import..." : "Importer par URL"}
                </Button>
                {ugUrl && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={ugUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
              {importBlocked && (
                <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-sm space-y-2">
                  <p className="text-amber-800 dark:text-amber-200">{UG_BLOCKED_MESSAGE}</p>
                  <p className="text-muted-foreground">
                    Cliquez <ExternalLink className="inline h-3 w-3" /> pour ouvrir la page, puis utilisez le bookmarklet ci-dessus.
                  </p>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Coller HTML de la page UG */}
            <div className="space-y-2">
              <Label htmlFor="paste-html">Coller le code source HTML de la page UG</Label>
              <Textarea
                id="paste-html"
                placeholder="Ctrl+U sur la page UG, copiez tout le HTML et collez ici..."
                value={pasteHtml}
                onChange={(e) => setPasteHtml(e.target.value)}
                className="min-h-[80px] font-mono text-xs"
              />
              <Button
                variant="secondary"
                onClick={handleImportHtml}
                disabled={importLoading || !pasteHtml.trim()}
                className="w-full"
              >
                Importer depuis le HTML
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* ChordPro / JSON */}
            <div className="space-y-2">
              <Label htmlFor="paste">Coller ChordPro ou JSON UG</Label>
              <Textarea
                id="paste"
                placeholder="{title: Ma chanson}... ou JSON data-content"
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                className="min-h-[80px] font-mono text-sm"
              />
              <Button
                variant="secondary"
                onClick={handleImportPaste}
                disabled={importLoading || !pasteContent.trim()}
                className="w-full"
              >
                Importer le texte
              </Button>
            </div>

            {importError && !importBlocked && (
              <p className="text-sm text-destructive">{importError}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
