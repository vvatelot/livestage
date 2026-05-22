"use client";

import { useMemo } from "react";
import { parseYouTubeVideoId } from "@/lib/youtube";
import { cn } from "@/lib/utils";

interface YoutubePlayerProps {
  url: string;
  title?: string;
  className?: string;
}

export function YoutubePlayer({ url, title = "Vidéo YouTube", className }: YoutubePlayerProps) {
  const videoId = useMemo(() => parseYouTubeVideoId(url), [url]);

  if (!videoId) {
    return (
      <p className="text-sm text-muted-foreground">
        URL YouTube invalide. Exemples : https://www.youtube.com/watch?v=… ou https://youtu.be/…
      </p>
    );
  }

  return (
    <div
      className={cn(
        "aspect-video w-full overflow-hidden rounded-lg border bg-muted",
        className
      )}
    >
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
