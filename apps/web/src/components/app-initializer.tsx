"use client";

import { useEffect } from "react";
import { dedupeSyncQueue } from "@/lib/db/repository";

export function AppInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void dedupeSyncQueue();
  }, []);

  return <>{children}</>;
}
