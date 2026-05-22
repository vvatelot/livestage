import Link from "next/link";
import { Music, Play, User } from "lucide-react";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SyncIndicator } from "@/components/sync-indicator";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="app-header sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <SyncIndicator />
            <Link
              href="/auth"
              className="sm:hidden inline-flex items-center justify-center rounded-md border border-input bg-background p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Compte et connexion"
            >
              <User className="h-4 w-4" />
            </Link>
            <Link
              href="/setlists"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-2.5 py-1.5 sm:px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              aria-label="Mode scène"
            >
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Mode scène</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6">
        {children}
      </main>

      <MobileBottomNav />
    </div>
  );
}
