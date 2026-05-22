"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChordDisplay } from "@/components/chord-display/chord-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSong } from "@/lib/db/repository";
import {
  UG_IMPORT_MESSAGE,
  getAppOrigin,
  isUgImportMessage,
} from "@/lib/ug-import/bookmarklet";
import { parseUgJson, type UgImportResult, UG_BLOCKED_MESSAGE } from "@/lib/ug-import/parser";

function parseFromHash(): UgImportResult | null {
  const hash = window.location.hash;
  if (!hash.startsWith("#data=")) return null;

  try {
    const json = decodeURIComponent(hash.slice(6));
    return parseUgJson(json, document.referrer || undefined);
  } catch {
    return null;
  }
}

export default function ImportUgPage() {
  const router = useRouter();
  const [result, setResult] = useState<UgImportResult | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [waiting, setWaiting] = useState(true);

  const applyImport = useCallback((json: string, sourceUrl?: string) => {
    const parsed = parseUgJson(json, sourceUrl);
    if (!parsed) {
      setError("Impossible de parser les données Ultimate Guitar.");
      setWaiting(false);
      return;
    }
    setResult(parsed);
    setWaiting(false);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    // Fallback: ancien bookmarklet via hash URL
    const fromHash = parseFromHash();
    if (fromHash) {
      setResult(fromHash);
      setWaiting(false);
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }

    const allowedOrigin = getAppOrigin();

    function onMessage(event: MessageEvent) {
      if (!isUgImportMessage(event.data)) return;

      const fromUg =
        typeof event.origin === "string" && event.origin.includes("ultimate-guitar.com");
      const fromSelf = Boolean(allowedOrigin && event.origin === allowedOrigin);

      if (!fromUg && !fromSelf) return;

      applyImport(event.data.data, event.data.sourceUrl);
    }

    window.addEventListener("message", onMessage);

    // Signal readiness to opener (UG page with bookmarklet)
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: UG_IMPORT_MESSAGE.READY }, "*");
    }

    // Timeout if no data received
    const timeout = setTimeout(() => {
      setWaiting((w) => {
        if (w) {
          setError(
            "Aucune donnée reçue. Utilisez le bookmarklet depuis une page tab Ultimate Guitar."
          );
        }
        return false;
      });
    }, 15_000);

    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timeout);
    };
  }, [applyImport]);

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    const song = await createSong({
      title: result.title,
      artist: result.artist,
      key: result.key,
      capo: result.capo,
      chordproContent: result.chordpro,
      sourceUrl: result.sourceUrl,
    });
    router.push(`/songs/${song.id}`);
  }

  if (error) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Import Ultimate Guitar</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{UG_BLOCKED_MESSAGE}</p>
          <Button variant="outline" onClick={() => router.push("/songs")}>
            Retour à la bibliothèque
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (waiting || !result) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-muted-foreground">En attente des données Ultimate Guitar…</p>
        <p className="text-sm text-muted-foreground">
          Si rien ne se passe, vérifiez que les popups ne sont pas bloquées.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">{result.title}</h1>
          <p className="text-muted-foreground truncate">{result.artist}</p>
          {result.sourceUrl && (
            <p className="text-xs text-muted-foreground truncate mt-1">{result.sourceUrl}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => router.push("/songs")}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          <ChordDisplay content={result.chordpro} />
        </CardContent>
      </Card>
    </div>
  );
}
