import Link from "next/link";
import { ActivityCalendar } from "@/components/events/activity-calendar";
import { EventCard } from "@/components/events/event-card";
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
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const years = publishedYears(events.filter((event) => (event.listing ?? "event") === listing));
  const active = Boolean(
    filters.query ||
      filters.category ||
      filters.year ||
      filters.status ||
      filters.grade ||
      filters.from ||
      filters.to ||
      filters.fee,
  );
  const ongoing = events.filter(
    (event) =>
      (event.listing ?? "event") === listing && event.eventStatus === "ongoing" && !event.isSample,
  );
  const calendarEvents = events.filter((event) => (event.listing ?? "event") === listing && !event.isSample);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <p className="text-sm text-accent">{kicker}</p>
      <h1 className="font-display mt-3 text-5xl text-ink md:text-6xl">{title}</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-muted">{intro}</p>

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
        <p className="mt-8 text-sm text-muted">Nothing marked as happening right now.</p>
      )}

      <div className="mt-10">
        <ActivityCalendar events={calendarEvents} />
      </div>

      <form method="get" className="mt-10 grid gap-4 border-y border-line py-6 md:grid-cols-4" action={basePath}>
        <label className="grid gap-1.5 text-sm">
          Search
          <input name="q" defaultValue={filters.query} placeholder="Name or description" className="rounded-md border border-line px-3 py-2" />
        </label>
        <label className="grid gap-1.5 text-sm">
          Category
          <select name="category" defaultValue={filters.category} className="rounded-md border border-line bg-white px-3 py-2">
            <option value="">All</option>
            {categories.map((category) => (
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
        <label className="grid gap-1.5 text-sm">
          Grade
          <select name="grade" defaultValue={filters.grade} className="rounded-md border border-line bg-white px-3 py-2">
            <option value="">All</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((grade) => (
              <option key={grade} value={String(grade)}>
                Grade {grade}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm">
          From date
          <input type="date" name="from" defaultValue={filters.from} className="rounded-md border border-line px-3 py-2" />
        </label>
        <label className="grid gap-1.5 text-sm">
          To date
          <input type="date" name="to" defaultValue={filters.to} className="rounded-md border border-line px-3 py-2" />
        </label>
        <label className="grid gap-1.5 text-sm">
          Fee
          <select name="fee" defaultValue={filters.fee} className="rounded-md border border-line bg-white px-3 py-2">
            <option value="">Any</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
        </label>
        <div className="flex items-end gap-4 md:col-span-4">
          <button type="submit" className="rounded-md bg-ink px-4 py-2 text-sm text-white">
            Apply
          </button>
          {active ? (
            <Link href={basePath} className="text-sm text-accent">
              Clear filters
            </Link>
          ) : null}
        </div>
      </form>

      {visible.length ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((event) => (
            <EventCard key={event.id} event={event} categories={categories} hosts={hosts} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-line px-6 py-12">
          <p className="text-lg font-medium">{active ? "Nothing matches those filters." : "Nothing published here yet."}</p>
        </div>
      )}

      {pageCount > 1 ? (
        <nav className="mt-10 flex gap-4 text-sm" aria-label="Pagination">
          <span className="text-muted">
            Page {current} of {pageCount}
          </span>
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
