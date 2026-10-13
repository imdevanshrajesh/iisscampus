import { eventHighlightRows } from "@/lib/events/display";
import type { CampusEvent } from "@/lib/types";

export function EventHighlights({ event }: { event: CampusEvent }) {
  const rows = eventHighlightRows(event);
  if (!rows.length) return null;

  return (
    <dl className="mt-6 grid gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="rounded-xl border border-line bg-white px-3.5 py-3">
          <dt className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted">{row.label}</dt>
          <dd className="mt-1 text-sm leading-5 text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
