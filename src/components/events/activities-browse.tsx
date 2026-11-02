import { PreviewTrigger } from "@/components/preview/preview-provider";
import { UnifiedBrowseConsole } from "@/components/events/unified-browse-console";
import { filterPublishedEvents, formatEventDate, publishedYears } from "@/lib/data/catalog";
import type { CampusEvent, Category, EventListing } from "@/lib/types";

type Filters = {
  query?: string;
  category?: string;
  year?: string;
  status?: string;
  grade?: string;
  from?: string;
  to?: string;
  fee?: string;
};

export function ActivitiesBrowse({
  listing,
  title,
  kicker,
  intro,
  basePath,
  events,
  categories,
  hosts,
  filters,
}: {
  listing: EventListing;
  title: string;
  kicker: string;
  intro: string;
  basePath: "/events" | "/competitions";
  events: CampusEvent[];
  categories: Category[];
  hosts: readonly string[];
  filters: Filters;
}) {
  const filtered = filterPublishedEvents(events, categories, { ...filters, listing });
  const page = 1;
  const pageSize = 18;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const years = publishedYears(events.filter((event) => (event.listing ?? "event") === listing));

  const ongoing = events.filter(
    (event) =>
      (event.listing ?? "event") === listing && event.eventStatus === "ongoing" && !event.isSample,
  );
  const allListingEvents = events.filter(
    (event) => (event.listing ?? "event") === listing && !event.isSample,
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
      {/* Header */}
      <div className="border-b border-line/70 pb-8">
        <p className="text-sm font-semibold tracking-wider text-accent uppercase">{kicker}</p>
        <h1 className="font-display mt-2 text-4xl sm:text-5xl md:text-6xl text-ink tracking-tight">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted">{intro}</p>
      </div>

      {/* Ongoing Live Banner */}
      {ongoing.length ? (
        <section className="mt-8 rounded-[1.75rem] border border-white/10 bg-navy p-5 text-white shadow-xl md:p-6">
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
              <p className="text-xs uppercase tracking-wider text-white/70 font-semibold">
                Happening On Stage Now
              </p>
            </div>
            <span className="text-xs text-white/50">{ongoing.length} Ongoing</span>
          </div>

          <ul className="mt-3 divide-y divide-white/10">
            {ongoing.map((event) => (
              <li key={event.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                <PreviewTrigger event={event} className="font-display text-left text-2xl text-white hover:text-gold transition">
                  {event.title}
                </PreviewTrigger>
                <span className="text-sm text-white/60">{formatEventDate(event.eventDate) ?? "Dates open"}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Unified Search, Filter, Category Tabs & Multi-View Console */}
      <UnifiedBrowseConsole
        basePath={basePath}
        categories={categories}
        years={years}
        filters={filters}
        events={visible}
        allEvents={allListingEvents}
        hosts={hosts}
      />

      {/* Pagination */}
      {pageCount > 1 ? (
        <nav className="mt-12 flex items-center justify-between border-t border-line/60 pt-6 text-sm" aria-label="Pagination">
          <span className="text-muted">
            Showing Page {current} of {pageCount} ({filtered.length} total)
          </span>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-navy px-3 py-1 text-white font-medium">1</span>
          </div>
        </nav>
      ) : null}
    </div>
  );
}

export function activityFiltersFromParams(params: Record<string, string | string[] | undefined>): Filters {
  return {
    query: first(params.q),
    category: first(params.category),
    year: first(params.year),
    status: first(params.status),
    grade: first(params.grade),
    from: first(params.from),
    to: first(params.to),
    fee: first(params.fee),
  };
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
