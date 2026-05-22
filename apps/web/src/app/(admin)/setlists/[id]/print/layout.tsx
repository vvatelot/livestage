import { Suspense } from "react";

export default function SetlistPrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
      {children}
    </Suspense>
  );
}
