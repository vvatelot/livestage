import type { SetlistPrintData } from "@/lib/print/setlist-print";
import { cn, formatDate } from "@/lib/utils";

interface SetlistPrintSheetProps {
  data: SetlistPrintData;
}

export function SetlistPrintSheet({ data }: SetlistPrintSheetProps) {
  const formattedDate = data.eventDate ? formatDate(data.eventDate) : null;

  return (
    <article className="setlist-print-sheet mx-auto max-w-[210mm] bg-white text-black rounded-lg border p-8 print:border-0 print:p-0 print:max-w-none print:shadow-none">
      <div className="setlist-print-header border-b border-black/15 pb-4 mb-6">
        <h1 className="setlist-print-title text-2xl font-bold tracking-tight">
          {data.name}
        </h1>
        {formattedDate && (
          <p className="setlist-print-date text-base mt-2 text-black/80">
            {formattedDate}
          </p>
        )}
        {data.notes && (
          <p className="setlist-print-notes text-sm mt-3 text-black/70 whitespace-pre-wrap">
            {data.notes}
          </p>
        )}
      </div>

      {data.entries.length === 0 ? (
        <p className="text-black/60 italic">Setlist vide</p>
      ) : (
        <ol className="setlist-print-list list-none m-0 p-0 space-y-0">
          {data.entries.map((entry) => (
            <li
              key={`${entry.kind}-${entry.index}`}
              className={cn(
                "setlist-print-item flex gap-3 py-2.5 border-b border-black/10 last:border-b-0",
                entry.kind === "marker" && "setlist-print-item--marker"
              )}
            >
              <span
                className="setlist-print-index tabular-nums font-semibold w-8 shrink-0 text-black/70"
                aria-hidden
              >
                {entry.index}.
              </span>
              <div className="min-w-0 flex-1">
                {entry.kind === "song" ? (
                  <>
                    <p className="setlist-print-song-title font-medium leading-snug">
                      {entry.title}
                    </p>
                    {entry.artist ? (
                      <p className="setlist-print-song-artist text-sm text-black/65 mt-0.5">
                        {entry.artist}
                      </p>
                    ) : null}
                    {entry.transpose != null && entry.transpose !== 0 ? (
                      <p className="setlist-print-song-meta text-xs text-black/55 mt-1">
                        Transposition{" "}
                        {entry.transpose > 0 ? `+${entry.transpose}` : entry.transpose}
                      </p>
                    ) : null}
                    {entry.notes ? (
                      <p className="setlist-print-item-notes text-xs italic text-black/55 mt-1 whitespace-pre-wrap">
                        {entry.notes}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="setlist-print-section-title font-semibold uppercase tracking-wide text-sm text-black/80">
                      {entry.title}
                    </p>
                    <p className="setlist-print-section-kind text-xs text-black/50 mt-0.5">
                      Section
                    </p>
                    {entry.notes ? (
                      <p className="setlist-print-item-notes text-xs text-black/55 mt-1 whitespace-pre-wrap">
                        {entry.notes}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
