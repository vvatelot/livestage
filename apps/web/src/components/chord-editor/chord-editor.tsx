"use client";

import { useEffect, useMemo, useState } from "react";
import { ChordDisplay } from "@/components/chord-display/chord-display";
import { SongPrintActions } from "@/components/song-print/song-print-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { YoutubePlayer } from "@/components/youtube/youtube-player";
import { extractMetadata } from "@/lib/chordpro";
import { isValidYouTubeUrl } from "@/lib/youtube";
import { Minus, Plus } from "lucide-react";

interface ChordEditorProps {
  initialContent?: string;
  initialTitle?: string;
  initialArtist?: string;
  initialKey?: string;
  initialCapo?: number;
  initialYoutubeUrl?: string;
  onChange?: (data: {
    title: string;
    artist: string;
    key: string;
    capo: number;
    chordproContent: string;
    youtubeUrl: string;
  }) => void;
  songId?: string;
}

export function ChordEditor({
  initialContent = "",
  initialTitle = "",
  initialArtist = "",
  initialKey = "",
  initialCapo = 0,
  initialYoutubeUrl = "",
  onChange,
  songId,
}: ChordEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle);
  const [artist, setArtist] = useState(initialArtist);
  const [key, setKey] = useState(initialKey);
  const [capo, setCapo] = useState(initialCapo);
  const [youtubeUrl, setYoutubeUrl] = useState(initialYoutubeUrl);
  const [transpose, setTranspose] = useState(0);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    const meta = extractMetadata(content);
    if (meta.title && !title) setTitle(meta.title);
    if (meta.artist && !artist) setArtist(meta.artist);
    if (meta.key && !key) setKey(meta.key);
    if (meta.capo !== undefined && capo === 0) setCapo(meta.capo);
    if (meta.youtubeUrl && !youtubeUrl) setYoutubeUrl(meta.youtubeUrl);
  }, [content, title, artist, key, capo, youtubeUrl]);

  useEffect(() => {
    if (!onChange) return;
    const timer = window.setTimeout(() => {
      onChange({
        title,
        artist,
        key,
        capo,
        chordproContent: content,
        youtubeUrl,
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [title, artist, key, capo, content, youtubeUrl, onChange]);

  const displayKey = useMemo(() => {
    if (!key) return "";
    return transpose !== 0 ? `${key} (${transpose > 0 ? "+" : ""}${transpose})` : key;
  }, [key, transpose]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la chanson"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist">Artiste</Label>
            <Input
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artiste"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="key">Tonalité {displayKey && `(${displayKey})`}</Label>
            <Input
              id="key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="G, Am, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capo">Capo</Label>
            <Input
              id="capo"
              type="number"
              min={0}
              max={12}
              value={capo}
              onChange={(e) => setCapo(parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="youtube">Vidéo YouTube</Label>
          <Input
            id="youtube"
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
          />
          {youtubeUrl.trim() && !isValidYouTubeUrl(youtubeUrl) && (
            <p className="text-xs text-destructive">URL YouTube non reconnue.</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="content">Contenu ChordPro</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTranspose((t) => t - 1)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm text-muted-foreground w-8 text-center">
                {transpose > 0 ? `+${transpose}` : transpose}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTranspose((t) => t + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? "Masquer" : "Aperçu"}
              </Button>
            </div>
          </div>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="{title: Ma chanson}&#10;{artist: Artiste}&#10;&#10;[G]Première ligne..."
            className="min-h-[400px] font-mono text-sm"
          />
        </div>
      </div>

      {showPreview && (
        <div className="rounded-lg border bg-card p-6 overflow-auto max-h-[calc(100vh-12rem)]">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold">{title || "Sans titre"}</h3>
              {artist && <p className="text-muted-foreground">{artist}</p>}
            </div>
            <SongPrintActions
              songId={songId}
              data={{
                title,
                artist,
                key,
                capo,
                chordproContent: content,
                transpose,
              }}
            />
          </div>
          {youtubeUrl.trim() && (
            <div className="no-print mb-6">
              <YoutubePlayer
                url={youtubeUrl}
                title={title ? `YouTube — ${title}` : "Vidéo YouTube"}
              />
            </div>
          )}
          <ChordDisplay content={content} transpose={transpose} />
        </div>
      )}
    </div>
  );
}
