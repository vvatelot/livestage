"use client";

import { useEffect } from "react";
import { dedupeSyncQueue, seedDemoData } from "@/lib/db/repository";

export function AppInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void dedupeSyncQueue().then(() => seedDemoData());
  }, []);

  return <>{children}</>;
}
