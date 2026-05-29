"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { renderChordProHtml } from "@/lib/chordpro";
import { cn } from "@/lib/utils";

interface ChordDisplayProps {
  content: string;
  transpose?: number;
  live?: boolean;
  darkMode?: boolean;
  fontSize?: number;
  className?: string;
  /** Réduit la partition pour éviter le scroll horizontal (alignement accords/paroles conservé). */
  fitWidth?: boolean;
}

function clearFitStyles(
  outer: HTMLDivElement,
  shell: HTMLDivElement,
  inner: HTMLDivElement
) {
  outer.style.removeProperty("height");
  shell.style.removeProperty("width");
  shell.style.removeProperty("height");
  inner.style.removeProperty("--chord-sheet-scale");
  inner.style.removeProperty("--chord-sheet-inner-w");
}

function applyFit(
  outer: HTMLDivElement,
  shell: HTMLDivElement,
  inner: HTMLDivElement
) {
  clearFitStyles(outer, shell, inner);

  const available = outer.clientWidth;
  const needed = inner.scrollWidth;
  if (available <= 0 || needed <= available) return;

  const scale = available / needed;
  const naturalHeight = inner.offsetHeight;

  inner.style.setProperty("--chord-sheet-scale", String(scale));
  inner.style.setProperty("--chord-sheet-inner-w", `${needed}px`);
  shell.style.width = `${needed * scale}px`;
  shell.style.height = `${naturalHeight * scale}px`;
  outer.style.height = `${naturalHeight * scale}px`;
}

export function ChordDisplay({
  content,
  transpose = 0,
  live = false,
  darkMode = false,
  fontSize = 1,
  className,
  fitWidth = true,
}: ChordDisplayProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const html = useMemo(
    () => renderChordProHtml(content, transpose, live ? "chord-sheet chord-sheet-live" : "chord-sheet"),
    [content, transpose, live]
  );

  useLayoutEffect(() => {
    if (!fitWidth) return;
    const outer = outerRef.current;
    const shell = shellRef.current;
    const inner = innerRef.current;
    if (!outer || !shell || !inner) return;

    const update = () => applyFit(outer, shell, inner);

    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    return () => {
      ro.disconnect();
      clearFitStyles(outer, shell, inner);
    };
  }, [html, fitWidth, fontSize, live]);

  if (!fitWidth) {
    return (
      <div
        className={cn(live && darkMode && "dark", className)}
        style={live ? { fontSize: `${fontSize}rem` } : undefined}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div ref={outerRef} className={cn("chord-display-fit w-full min-w-0", className)}>
      <div ref={shellRef} className="chord-display-fit-shell">
        <div
          ref={innerRef}
          className={cn("chord-display-fit-inner", live && darkMode && "dark")}
          style={live ? { fontSize: `${fontSize}rem` } : undefined}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
