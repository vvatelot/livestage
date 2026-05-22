"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  LockOpen,
  Minus,
  Moon,
  Plus,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { ChordDisplay } from "@/components/chord-display/chord-display";
import { SongPrintActions } from "@/components/song-print/song-print-actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getSetlistWithSongs, prefetchSetlistForOffline } from "@/lib/db/repository";
import { DEFAULT_LIVE_SETTINGS, type LiveSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

type LiveEntry =
  | {
      kind: "song";
      songId: string;
      title: string;
      artist: string;
      content: string;
      transpose: number;
      notes?: string;
    }
  | {
      kind: "marker";
      title: string;
      notes?: string;
    };

export default function LiveModePage() {
  const params = useParams();
  const router = useRouter();
  const setlistId = params.id as string;

  const [items, setItems] = useState<LiveEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [settings, setSettings] = useState<LiveSettings>(DEFAULT_LIVE_SETTINGS);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    async function load() {
      await prefetchSetlistForOffline(setlistId);
      const data = await getSetlistWithSongs(setlistId);
      if (!data) {
        router.push("/setlists");
        return;
      }

      const liveItems: LiveEntry[] = [];
      for (const i of data.items) {
        if ((i.kind ?? "song") === "marker") {
          liveItems.push({
            kind: "marker",
            title: i.label ?? "Section",
            notes: i.notes,
          });
          continue;
        }
        if (!i.song || i.song.deleted) continue;
        liveItems.push({
          kind: "song",
          songId: i.songId!,
          title: i.song.title,
          artist: i.song.artist,
          content: i.song.chordproContent,
          transpose: i.transpose ?? 0,
          notes: i.notes,
        });
      }
      setItems(liveItems);
      setLoading(false);
    }
    load();
  }, [setlistId, router]);

  // Wake lock
  useEffect(() => {
    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Wake lock not supported or denied
      }
    }
    requestWakeLock();

    return () => {
      wakeLockRef.current?.release();
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (!settings.autoScroll || !scrollRef.current) {
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
      }
      return;
    }

    let lastTime = 0;
    const scroll = (time: number) => {
      if (!scrollRef.current) return;
      if (lastTime) {
        const delta = time - lastTime;
        scrollRef.current.scrollTop += (settings.autoScrollSpeed * delta) / 1000;
      }
      lastTime = time;
      autoScrollRef.current = requestAnimationFrame(scroll);
    };

    autoScrollRef.current = requestAnimationFrame(scroll);

    return () => {
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
      }
    };
  }, [settings.autoScroll, settings.autoScrollSpeed, currentIndex]);

  const hideControlsLater = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (!settings.locked) {
        setShowControls(false);
      }
    }, 3000);
  }, [settings.locked]);

  useEffect(() => {
    hideControlsLater();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [hideControlsLater]);

  function handleTap() {
    if (settings.locked) return;
    setShowControls(true);
    hideControlsLater();
  }

  function goNext() {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((i) => i + 1);
      scrollRef.current?.scrollTo(0, 0);
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      scrollRef.current?.scrollTo(0, 0);
    }
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
      if (e.key === "Escape") router.push(`/setlists/${setlistId}`);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  // Swipe navigation
  useEffect(() => {
    let touchStartX = 0;
    function onTouchStart(e: TouchEvent) {
      touchStartX = e.touches[0].clientX;
    }
    function onTouchEnd(e: TouchEvent) {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 80) {
        if (diff < 0) goNext();
        else goPrev();
      }
    }
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  });

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Setlist vide</p>
        <Button onClick={() => router.push(`/setlists/${setlistId}`)}>
          Retour
        </Button>
      </div>
    );
  }

  const current = items[currentIndex];
  const isSong = current.kind === "song";

  return (
    <div
      className={cn(
        "fixed inset-0 flex flex-col",
        settings.darkMode ? "bg-zinc-950 text-zinc-100" : "bg-white text-zinc-900"
      )}
      onClick={handleTap}
    >
      {/* Top bar */}
      <div
        className={cn(
          "absolute top-0 inset-x-0 z-50 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-sm text-white">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/setlists/${setlistId}`);
              }}
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <p className="font-semibold truncate">{current.title}</p>
              <p className="text-sm text-white/70 truncate">
                {isSong ? `${current.artist} · ` : ""}
                {currentIndex + 1}/{items.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setSettings((s) => ({
                  ...s,
                  fontSize: Math.max(1, s.fontSize - 0.25),
                }));
              }}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setSettings((s) => ({
                  ...s,
                  fontSize: Math.min(3, s.fontSize + 0.25),
                }));
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setSettings((s) => ({ ...s, darkMode: !s.darkMode }));
              }}
            >
              {settings.darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setSettings((s) => ({ ...s, locked: !s.locked }));
              }}
            >
              {settings.locked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <LockOpen className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setShowControls(true);
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Settings panel */}
        {showControls && (
          <div
            className="px-4 py-3 bg-black/40 backdrop-blur-sm text-white space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-scroll" className="text-white text-sm">
                Auto-scroll
              </Label>
              <Switch
                id="auto-scroll"
                checked={settings.autoScroll}
                onCheckedChange={(checked) =>
                  setSettings((s) => ({ ...s, autoScroll: checked }))
                }
              />
            </div>
            {settings.autoScroll && (
              <div className="flex items-center gap-3">
                <Label className="text-white text-sm shrink-0">Vitesse</Label>
                <input
                  type="range"
                  min={10}
                  max={80}
                  value={settings.autoScrollSpeed}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      autoScrollSpeed: parseInt(e.target.value, 10),
                    }))
                  }
                  className="flex-1"
                />
              </div>
            )}
            {isSong && (
              <>
                <div className="flex items-center gap-3">
                  <Label className="text-white text-sm shrink-0">Transposition</Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-8 w-8"
                    onClick={() => {
                      setItems((prev) =>
                        prev.map((item, idx) =>
                          idx === currentIndex && item.kind === "song"
                            ? { ...item, transpose: item.transpose - 1 }
                            : item
                        )
                      );
                    }}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm w-8 text-center">
                    {current.transpose > 0 ? `+${current.transpose}` : current.transpose}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-8 w-8"
                    onClick={() => {
                      setItems((prev) =>
                        prev.map((item, idx) =>
                          idx === currentIndex && item.kind === "song"
                            ? { ...item, transpose: item.transpose + 1 }
                            : item
                        )
                      );
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="pt-2 border-t border-white/20">
                  <SongPrintActions
                    data={{
                      title: current.title,
                      artist: current.artist,
                      chordproContent: current.content,
                      transpose: current.transpose,
                    }}
                    className="border-white/30 text-white hover:bg-white/10"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-20"
      >
        {isSong ? (
          <>
            {current.notes && (
              <p className="text-sm italic text-muted-foreground mb-4">{current.notes}</p>
            )}
            <ChordDisplay
              content={current.content}
              transpose={current.transpose}
              live
              darkMode={settings.darkMode}
              fontSize={settings.fontSize}
            />
          </>
        ) : (
          <div className="flex min-h-full flex-col items-center justify-center text-center px-4">
            <p
              className="font-bold leading-tight"
              style={{ fontSize: `${settings.fontSize * 2}rem` }}
            >
              {current.title}
            </p>
            {current.notes ? (
              <p
                className={cn(
                  "mt-8 max-w-2xl whitespace-pre-wrap leading-relaxed",
                  settings.darkMode ? "text-zinc-300" : "text-zinc-600"
                )}
                style={{ fontSize: `${settings.fontSize}rem` }}
              >
                {current.notes}
              </p>
            ) : (
              <p className="mt-6 text-muted-foreground text-lg">Section</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div
        className={cn(
          "absolute bottom-0 inset-x-0 z-50 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="lg"
            className="text-white hover:bg-white/20"
            disabled={currentIndex === 0}
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <span className="text-white text-sm">
            {currentIndex + 1} / {items.length}
          </span>
          <Button
            variant="ghost"
            size="lg"
            className="text-white hover:bg-white/20"
            disabled={currentIndex === items.length - 1}
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
