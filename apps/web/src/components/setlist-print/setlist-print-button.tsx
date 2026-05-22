"use client";

import Link from "next/link";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SetlistPrintButtonProps {
  setlistId: string;
  className?: string;
}

export function SetlistPrintButton({ setlistId, className }: SetlistPrintButtonProps) {
  return (
    <Button variant="outline" asChild className={className}>
      <Link href={`/setlists/${setlistId}/print?auto=1`} title="Ouvre la page d’impression">
        <Printer className="h-4 w-4" />
        Imprimer
      </Link>
    </Button>
  );
}
