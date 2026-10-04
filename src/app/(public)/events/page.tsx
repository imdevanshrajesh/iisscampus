import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/events/event-card";
import { filterPublishedEvents, formatEventDate, publishedYears } from "@/lib/data/catalog";
import { getPublicCatalog } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Events & Activities",
  description: "Browse published campus events and student activities.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const catalog = await getPublicCatalog();
  const filters = {
    query: first(params.q),
    category: first(params.category),
    year: first(params.year),
    status: first(params.status),
  };
  const filtered = filterPublishedEvents(catalog.events, catalog.categories, filters);
  const page = Math.max(1, Number(first(params.page) || "1") || 1);
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const years = publishedYears(catalog.events);
  const active = Boolean(filters.query || filters.category || filters.year || filters.status);
  const ongoing = catalog.events.filter((event) => event.eventStatus === "ongoing" && !event.isSample);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <p className="text-sm text-accent">Events</p>
      <h1 className="font-display mt-3 text-5xl text-ink md:text-6xl">What&apos;s happening, and what happened.</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-muted">
        Search published activities by name, category, year, or status. Drafts stay off this page.
      </p>

      {ongoing.length ? (
        <section className="mt-8 rounded-[1.5rem] bg-navy px-5 py-5 text-white md:px-6">
          <p className="text-sm text-white/60">On now</p>
          <ul className="mt-3 divide-y divide-white/15">
            {ongoing.map((event) => (
              <li key={event.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                <Link href={`/events/${event.slug}`} className="font-display text-2xl">
                  {event.title}
                </Link>
                <span className="text-sm text-white/60">{formatEventDate(event.eventDate) ?? "Dates open"}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-8 text-sm text-muted">No event is marked as happening right now.</p>
      )}

      <form method="get" className="mt-10 grid gap-4 border-y border-line py-6 md:grid-cols-4" action="/events">
        <label className="grid gap-1.5 text-sm">
          Search
          <input
            name="q"
            defaultValue={filters.query}
            placeholder="Name or description"
            className="rounded-md border border-line px-3 py-2"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          Category
          <select name="category" defaultValue={filters.category} className="rounded-md border border-line bg-white px-3 py-2">
            <option value="">All</option>
            {catalog.categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        {years.length ? (
          <label className="grid gap-1.5 text-sm">
            Year
            <select name="year" defaultValue={filters.year} className="rounded-md border border-line bg-white px-3 py-2">
              <option value="">All</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="grid gap-1.5 text-sm">
          Status
          <select name="status" defaultValue={filters.status} className="rounded-md border border-line bg-white px-3 py-2">
            <option value="">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <div className="flex items-end gap-4 md:col-span-4">
          <button type="submit" className="rounded-md bg-ink px-4 py-2 text-sm text-white">
            Apply
          </button>
          {active ? (
            <Link href="/events" className="text-sm text-accent">
              Clear filters
            </Link>
          ) : null}
        </div>
      </form>

      {visible.length ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((event) => (
            <EventCard key={event.id} event={event} categories={catalog.categories} hosts={catalog.mediaHosts} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-line px-6 py-12">
          <p className="text-lg font-medium">No activities match those filters.</p>
          <p className="mt-2 text-sm text-muted">Try another category, or clear the search.</p>
        </div>
      )}

      {pageCount > 1 ? (
        <nav className="mt-10 flex gap-4 text-sm" aria-label="Pagination">
          {current > 1 ? <Link href={pageHref(filters, current - 1)}>Previous</Link> : null}
          <span className="text-muted">
            Page {current} of {pageCount}
          </span>
          {current < pageCount ? <Link href={pageHref(filters, current + 1)}>Next</Link> : null}
        </nav>
      ) : null}
    </div>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function pageHref(
  filters: { query?: string; category?: string; year?: string; status?: string },
  page: number,
) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.category) params.set("category", filters.category);
  if (filters.year) params.set("year", filters.year);
  if (filters.status) params.set("status", filters.status);
  params.set("page", String(page));
  return `/events?${params.toString()}`;
}
