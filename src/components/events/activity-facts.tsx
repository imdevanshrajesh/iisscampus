import { paragraphs } from "@/lib/data/catalog";
import type { CampusEvent } from "@/lib/types";

function formatTime(value: string | null) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  const date = new Date(Date.UTC(2000, 0, 1, hours, minutes));
  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
}

export function ActivityFacts({ event }: { event: CampusEvent }) {
  const start = formatTime(event.startTime);
  const end = formatTime(event.endTime);
  const grades =
    event.gradeFrom != null && event.gradeTo != null
      ? event.gradeFrom === event.gradeTo
        ? `Grade ${event.gradeFrom}`
        : `Grades ${event.gradeFrom}–${event.gradeTo}`
      : null;
  const fee =
    event.feeAed == null ? null : event.feeAed === 0 ? "Free" : `AED ${event.feeAed.toFixed(event.feeAed % 1 ? 2 : 0)}`;
  const packing = event.packingList ? paragraphs(event.packingList) : [];

  const rows = [
    start || end ? { label: "Time", value: [start, end].filter(Boolean).join(" – ") } : null,
    grades ? { label: "Grades", value: grades } : null,
    fee ? { label: "Fee", value: fee } : null,
    event.capacity != null ? { label: "Places", value: String(event.capacity) } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  if (!rows.length && !packing.length) return null;

  return (
    <section className="border-t border-line py-10">
      <h2 className="text-2xl font-medium tracking-tight">Details</h2>
      {rows.length ? (
        <dl className="mt-4 grid max-w-2xl gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl border border-line bg-white px-4 py-3">
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">{row.label}</dt>
              <dd className="mt-1 text-sm text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {packing.length ? (
        <div className="mt-6 max-w-2xl">
          <h3 className="text-lg font-medium">What to bring</h3>
          <div className="mt-3 space-y-2 text-base leading-7 text-ink">
            {packing.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
