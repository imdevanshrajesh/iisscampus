import Link from "next/link";
import { EventCard } from "@/components/events/event-card";
import { MediaFrame } from "@/components/media/media-frame";
import { siteConfig } from "@/lib/config";
import { formatEventDate } from "@/lib/data/catalog";
import type { Achievement, CampusEvent, Category } from "@/lib/types";

export function HomePage({
  events,
  categories,
  achievements,
  hosts,
}: {
  events: CampusEvent[];
  categories: Category[];
  achievements: Achievement[];
  hosts: readonly string[];
}) {
  const featured = events.filter((event) => event.featured);
  const lead = (featured.length ? featured : events).slice(0, 4);
  const ongoing = events.filter((event) => event.eventStatus === "ongoing" && !event.isSample);
  const upcoming = events
    .filter((event) => event.eventStatus === "upcoming" && !event.isSample)
    .slice()
    .sort((a, b) => (a.eventDate ?? "9999").localeCompare(b.eventDate ?? "9999"));
  const highlights = events.slice(0, 3);

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-6 pt-4 md:px-8 md:pt-8">
        <p className="text-sm text-accent">India International School, Sharjah</p>
        <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <h1 className="font-display text-5xl leading-[0.95] text-ink md:text-7xl">What&apos;s on around campus.</h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-muted">
              Events that are happening, the ones still to come, and the boys&apos; student council, kept in one place.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/events" className="rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink">
                See the events
              </Link>
              <Link href="/council" className="rounded-full border border-line px-4 py-2.5 text-sm font-medium">
                Student council
              </Link>
            </div>
          </div>
          {ongoing.length ? (
            <aside className="w-full max-w-md rounded-3xl bg-navy px-5 py-5 text-white">
              <p className="text-sm text-white/60">Right now</p>
              <ul className="mt-3 divide-y divide-white/15">
                {ongoing.slice(0, 3).map((event) => (
                  <li key={event.id} className="py-3">
                    <Link href={`/events/${event.slug}`} className="font-display text-2xl">
                      {event.title}
                    </Link>
                    <p className="mt-1 text-sm text-white/65">{event.shortDescription}</p>
                  </li>
                ))}
              </ul>
            </aside>
          ) : (
            <p className="max-w-xs text-sm leading-6 text-muted lg:pb-2">
              Nothing is marked as happening today.
              {upcoming[0] ? (
                <>
                  {" "}
                  Next is{" "}
                  <Link href={`/events/${upcoming[0].slug}`} className="font-medium text-ink">
                    {upcoming[0].title}
                  </Link>
                  {formatEventDate(upcoming[0].eventDate) ? ` on ${formatEventDate(upcoming[0].eventDate)}` : ""}.
                </>
              ) : null}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8">
        <div className="flex items-end justify-between gap-6">
          <h2 className="font-display text-4xl text-ink">On the board</h2>
          <Link href="/events" className="text-sm text-accent">
            All events
          </Link>
        </div>
        {lead.length ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {lead.slice(0, 3).map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                categories={categories}
                hosts={hosts}
                priority={index === 0}
              />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">Published events will show up here.</p>
        )}
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8">
          <h2 className="font-display text-4xl text-ink">Coming up</h2>
          {upcoming.length ? (
            <ul className="mt-6 divide-y divide-line">
              {upcoming.slice(0, 5).map((event) => (
                <li key={event.id} className="grid gap-2 py-5 md:grid-cols-[11rem_1fr] md:items-baseline">
                  <p className="text-sm text-muted">{formatEventDate(event.eventDate) ?? "Date to be set"}</p>
                  <div>
                    <Link href={`/events/${event.slug}`} className="text-lg font-medium">
                      {event.title}
                    </Link>
                    <p className="mt-1 text-sm leading-6 text-muted">{event.shortDescription}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
              When an upcoming activity is published with a date, it lands here. Dates are not filled in to make the list look busy.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8">
        <h2 className="font-display text-4xl text-ink">Browse by kind</h2>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/events?category=${category.slug}`}
                className="grid gap-1 py-4 md:grid-cols-[14rem_1fr] md:items-baseline"
              >
                <span className="font-display text-2xl">{category.name}</span>
                <span className="text-sm leading-6 text-muted">{category.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-wash">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 py-14 md:px-8">
          <div>
            <p className="text-sm text-accent">Student council · Boys</p>
            <h2 className="font-display mt-2 text-4xl text-ink">The council, year by year.</h2>
          </div>
          <Link href="/council" className="text-sm font-medium text-accent">
            View
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:px-8 lg:grid-cols-2">
        <div>
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-4xl text-ink">Achievements</h2>
            <Link href="/achievements" className="text-sm text-accent">
              Archive
            </Link>
          </div>
          {achievements.length ? (
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {achievements.slice(0, 4).map((item) => (
                <li key={item.id} className="py-4">
                  <p className="text-lg font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {[item.competitionName, item.award, item.winnerName].filter(Boolean).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted">
              Competition results show up here after someone publishes them.
            </p>
          )}
        </div>
        <div>
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-4xl text-ink">From the gallery</h2>
            <Link href="/gallery" className="text-sm text-accent">
              All photographs
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {highlights.map((event) => (
              <Link key={event.id} href={`/gallery#gallery-${event.slug}`}>
                <MediaFrame
                  url={event.coverImageUrl}
                  alt={event.coverAlt}
                  hosts={hosts}
                  title={event.title}
                  kicker="Photo"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-14 md:flex-row md:items-end md:justify-between md:px-8">
          <p className="max-w-xl text-base leading-7 text-muted">
            Registration for a chosen activity opens on Arigo. Signing in there does not, on its own, put a student on an event list.
          </p>
          <a href={siteConfig.arigoUrl ?? "https://arigo.buildkre.com"} className="text-sm font-medium text-accent">
            Open Arigo
          </a>
        </div>
      </section>
    </>
  );
}
