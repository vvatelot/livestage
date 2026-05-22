"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListMusic, Music, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Accueil", icon: Home, match: (path: string) => path === "/" },
  { href: "/songs", label: "Chansons", icon: Music, match: (path: string) => path.startsWith("/songs") },
  {
    href: "/setlists",
    label: "Setlists",
    icon: ListMusic,
    match: (path: string) => path.startsWith("/setlists"),
  },
  { href: "/auth", label: "Compte", icon: User, match: (path: string) => path.startsWith("/auth") },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
      aria-label="Navigation principale"
    >
      <div className="grid grid-cols-4 gap-0 px-1 pt-1">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md px-1 py-2 text-[10px] font-medium transition-colors min-h-11",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} aria-hidden />
              <span className="truncate max-w-full">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
