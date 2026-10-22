import Link from "next/link";
import { councilKindLabel } from "@/components/council/council-year";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { eventStatusLabel } from "@/lib/data/catalog";
import { countStaffSuggestions } from "@/lib/data/queries";
import { requireWorkspace } from "@/lib/manage/access";
import type { CampusEvent } from "@/lib/types";

function monthSeries(events: CampusEvent[]) {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, index) => {
    const offset = 5 - index;
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(date);
    return { key, label, count: 0 };
  });
  for (const event of events) {
    if (!event.eventDate) continue;
    const bucket = buckets.find((item) => event.eventDate?.startsWith(item.key));
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

function MonthChart({ series }: { series: { key: string; label: string; count: number }[] }) {
  const max = Math.max(1, ...series.map((item) => item.count));
  const width = 560;
  const height = 148;
  const barWidth = 28;
  const gap = (width - series.length * barWidth) / (series.length + 1);
  return (
    <svg viewBox={`0 0 ${width} ${height + 28}`} className="mt-4 w-full" role="img" aria-label="Events by month">
      {series.map((item, index) => {
        const barHeight = item.count === 0 ? 2 : (item.count / max) * (height - 8);
        const x = gap + index * (barWidth + gap);
        const y = height - barHeight;
        return (
          <g key={item.key}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={6} fill="#c65a12" />
            <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="12" fill="#1c2438">
              {item.count}
            </text>
            <text x={x + barWidth / 2} y={height + 18} textAnchor="middle" fontSize="12" fill="#6a6258">
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default async function ManageHomePage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;

  const counts = access.workspace.events.reduce(
    (summary, event) => {
      summary[event.publicationStatus] += 1;
      return summary;
    },
    { draft: 0, in_review: 0, published: 0, archived: 0 },
  );
  const ongoing = access.workspace.events.filter(
    (event) => event.eventStatus === "ongoing" && event.publicationStatus === "published",
  );
  const waiting = access.workspace.events.filter((event) => event.publicationStatus === "in_review");
  const months = monthSeries(access.workspace.events);
  const suggestionCount = access.role === "administrator" ? await countStaffSuggestions() : null;
  const statusRows = [
    ["Published", counts.published],
    ["In review", counts.in_review],
    ["Drafts", counts.draft],
    ["Archived", counts.archived],
  ] as const;
  const statusMax = Math.max(1, ...statusRows.map(([, value]) => value));

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">{access.role}</p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-ink">Overview</h1>
        </div>
        <Link href="/manage/events/new" className="rounded-md bg-navy px-3.5 py-2 text-sm text-white">
          New event
        </Link>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["On now", ongoing.length, "/events?status=ongoing"],
            ["In review", counts.in_review, "/manage/events?status=in_review"],
            ["Drafts", counts.draft, "/manage/events?status=draft"],
            ["Council years", access.workspace.councilYears.length, "/manage/council"],
            ...(suggestionCount === null ? [] : [["Suggestions", suggestionCount, "/manage/suggestions"] as const]),
          ] as const
        ).map(([label, value, href]) => (
          <Link key={label} href={href} className="rounded-lg border border-[#e3e6ea] bg-white px-4 py-3.5">
            <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted">{label}</dt>
            <dd className="mt-2 text-3xl font-medium tracking-tight">{value}</dd>
          </Link>
        ))}
      </dl>

      <div className="mt-3 grid gap-3 lg:grid-cols-5">
        <section className="rounded-lg border border-[#e3e6ea] bg-white p-4 lg:col-span-3">
          <h2 className="text-sm font-medium">Events by month</h2>
          <p className="mt-1 text-xs text-muted">Counted from each event&apos;s start date, for the last six months.</p>
          <MonthChart series={months} />
        </section>
        <section className="rounded-lg border border-[#e3e6ea] bg-white p-4 lg:col-span-2">
          <h2 className="text-sm font-medium">Publication</h2>
          <ul className="mt-4 grid gap-3">
            {statusRows.map(([label, value]) => (
              <li key={label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{label}</span>
                  <span className="text-muted">{value}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eef1f4]">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(value / statusMax) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <section className="rounded-lg border border-[#e3e6ea] bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium">Happening now</h2>
            <Link href="/manage/events/new" className="text-sm text-accent">
              New event
            </Link>
          </div>
          {ongoing.length ? (
            <ul className="mt-4 divide-y divide-line">
              {ongoing.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/manage/events/${event.id}/edit`} className="font-medium">
                      {event.title}
                    </Link>
                    <p className="text-sm text-muted">{eventStatusLabel(event.eventStatus)}</p>
                  </div>
                  <a
                    href={`/events/${event.slug}`}
                    className="text-sm text-accent"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted">
              No published event is marked as ongoing. Set that status on an event when it is actually happening.
            </p>
          )}
          {waiting.length ? (
            <p className="mt-4 text-sm text-muted">{waiting.length} event{waiting.length === 1 ? "" : "s"} waiting in review.</p>
          ) : null}
        </section>

        <section className="rounded-lg border border-[#e3e6ea] bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium">Student council · Boys</h2>
            <Link href="/manage/council/new" className="text-sm text-accent">
              New year
            </Link>
          </div>
          {access.workspace.councilYears.length ? (
            <ul className="mt-4 divide-y divide-line">
              {access.workspace.councilYears.slice(0, 6).map((year) => (
                <li key={year.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/manage/council/${year.id}/edit`} className="font-medium">
                      {year.label}
                    </Link>
                    <p className="text-sm text-muted">
                      {councilKindLabel(year.kind)} · {year.publicationStatus.replace("_", " ")}
                    </p>
                  </div>
                  <span className="text-sm text-muted">
                    {year.photos.length} photos
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted">
              Add the current council year, then later years as they come. Each year holds its own photographs and posts.
            </p>
          )}
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/manage/events" className="text-ink">
          All events · {counts.published} published
        </Link>
        <Link href="/manage/achievements" className="text-ink">
          Achievements · {access.workspace.achievements.length}
        </Link>
        <Link href="/manage/gallery" className="text-ink">
          Gallery
        </Link>
      </div>
    </div>
  );
}