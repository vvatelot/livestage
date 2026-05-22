"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getPendingSyncCount } from "@/lib/db/repository";
import { setupAutoSync } from "@/lib/db/sync";
import { cn } from "@/lib/utils";

type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

export function SyncIndicator() {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cleanup = () => {};

    cleanup = setupAutoSync(setStatus);

    const interval = setInterval(() => {
      void getPendingSyncCount().then(setPending);
    }, 5000);

    void getPendingSyncCount().then(setPending);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);

  if (!isSupabaseConfigured()) {
    return (
      <div
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
        title="Mode local (sans cloud)"
      >
        <CloudOff className="h-3.5 w-3.5 shrink-0" />
        <span className="max-sm:sr-only">Local</span>
      </div>
    );
  }

  const Icon =
    status === "syncing" ? Loader2 : status === "offline" ? CloudOff : Cloud;

  const label =
    status === "syncing"
      ? "Sync..."
      : status === "synced"
        ? "Synchronisé"
        : status === "offline"
          ? "Hors ligne"
          : status === "error"
            ? "Erreur sync"
            : "En attente";
  const pendingLabel =
    pending > 0
      ? ` (${pending > 99 ? "99+" : pending} modification${pending > 1 ? "s" : ""})`
      : "";

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs max-w-[9rem] sm:max-w-none",
        status === "synced" && "text-green-600",
        status === "error" && "text-destructive",
        status === "offline" && "text-muted-foreground",
        status === "syncing" && "text-muted-foreground"
      )}
      title={`${label}${pendingLabel}`}
    >
      <Icon
        className={cn("h-3.5 w-3.5 shrink-0", status === "syncing" && "animate-spin")}
      />
      <span className="max-sm:sr-only">
        {label}
        {pendingLabel}
      </span>
    </div>
  );
}
