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
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CloudOff className="h-3.5 w-3.5" />
        <span>Local</span>
      </div>
    );
  }

  const Icon =
    status === "syncing" ? Loader2 : status === "offline" ? CloudOff : Cloud;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs",
        status === "synced" && "text-green-600",
        status === "error" && "text-destructive",
        status === "offline" && "text-muted-foreground",
        status === "syncing" && "text-muted-foreground"
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", status === "syncing" && "animate-spin")} />
      <span>
        {status === "syncing" && "Sync..."}
        {status === "synced" && "Synchronisé"}
        {status === "offline" && "Hors ligne"}
        {status === "error" && "Erreur sync"}
        {status === "idle" && "En attente"}
        {pending > 0 &&
          ` (${pending > 99 ? "99+" : pending} modification${pending > 1 ? "s" : ""})`}
      </span>
    </div>
  );
}
