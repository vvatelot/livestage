"use client";

import { useEffect, useState } from "react";
import { Bookmark, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAppOrigin, getBookmarkletCode } from "@/lib/ug-import/bookmarklet";

export function UgBookmarkletCard() {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(getAppOrigin());
  }, []);

  const bookmarkletCode = origin ? getBookmarkletCode(origin) : "";

  async function handleCopy() {
    if (!bookmarkletCode) return;
    await navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
      <div className="flex items-center gap-2 font-medium text-sm">
        <Bookmark className="h-4 w-4 text-primary" />
        Méthode recommandée (bookmarklet)
      </div>

      <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
        <li>Glissez le bouton ci-dessous dans la barre de favoris</li>
        <li>Ouvrez une page <strong>tab</strong> Ultimate Guitar (accords chargés)</li>
        <li>Cliquez sur le favori — la chanson s&apos;ouvre dans LiveStage</li>
      </ol>

      <div className="flex flex-wrap gap-2">
        <a
          href={bookmarkletCode || "#"}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          onClick={(e) => e.preventDefault()}
          draggable={Boolean(bookmarkletCode)}
          title="Glisser vers la barre de favoris"
        >
          <Bookmark className="h-4 w-4" />
          Importer dans LiveStage
        </a>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          disabled={!bookmarkletCode}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copié
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copier le code
            </>
          )}
        </Button>
      </div>

      {origin && (
        <p className="text-xs text-muted-foreground">
          Configuré pour <code className="text-foreground">{origin}</code>.
          {origin.includes("localhost") && (
            <> En production, recréez le favori depuis votre instance déployée.</>
          )}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Glissez le bouton dans les favoris (ne reformatez pas le code à la main).
        Utilisez <strong>Copier le code</strong> puis collez l’URL telle quelle dans un
        nouveau favori. Autorisez les pop-ups.
      </p>
    </div>
  );
}
