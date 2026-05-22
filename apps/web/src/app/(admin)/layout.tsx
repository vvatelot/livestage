import Link from "next/link";
import { Music, ListMusic, Play } from "lucide-react";
import { SyncIndicator } from "@/components/sync-indicator";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <Music className="h-5 w-5 text-primary" />
              LiveStage
            </Link>
            <nav className="hidden sm:flex items-center gap-4 text-sm">
              <Link
                href="/songs"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Bibliothèque
              </Link>
              <Link
                href="/setlists"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Setlists
              </Link>
              <Link
                href="/auth"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Compte
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <SyncIndicator />
            <Link
              href="/setlists"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Mode scène</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>

      <nav className="sm:hidden fixed bottom-0 inset-x-0 border-t bg-background z-40">
        <div className="flex justify-around py-2">
          <Link href="/songs" className="flex flex-col items-center gap-1 px-3 py-1 text-xs text-muted-foreground">
            <Music className="h-5 w-5" />
            Chansons
          </Link>
          <Link href="/setlists" className="flex flex-col items-center gap-1 px-3 py-1 text-xs text-muted-foreground">
            <ListMusic className="h-5 w-5" />
            Setlists
          </Link>
        </div>
      </nav>
    </div>
  );
}
