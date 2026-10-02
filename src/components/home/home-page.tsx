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
  const featured = events.filter((event) => event.featured).slice(0, 3);
  const upcoming = events.filter((event) => event.eventStatus === "upcoming" && !event.isSample);
  const highlights = events.slice(0, 3);

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-end gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
            India International School, Sharjah
          </p>
          <h1 className="mt-5 max-w-xl text-5xl font-medium leading-[0.98] tracking-tight text-balance md:text-7xl">
            Every moment on campus has a story.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-muted">
            Discover the events, activities, achievements, and experiences that bring our school community together.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/events" className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink">
              Explore Events
            </Link>
            <a href="#highlights" className="rounded-md border border-line px-4 py-2.5 text-sm font-medium">
              View Highlights
            </a>
          </div>
        </div>
        <div className="grid gap-3 lg:col-span-5">
          {(featured.length ? featured : events).slice(0, 3).map((event, index) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="grid grid-cols-[4.5rem_1fr] items-center gap-4 border-t border-line py-4"
            >
              <span className="text-sm text-muted">0{index + 1}</span>
              <span>
                <span className="block text-lg font-medium tracking-tight">{event.title}</span>
                <span className="text-sm text-muted">
                  {categories.find((category) => category.id === event.categoryId)?.name}
                  {event.isSample ? " · Sample" : ""}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <div className="flex items-end justify-between gap-6">
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl">Featured</h2>
            <Link href="/events" className="text-sm text-accent">
              All activities
            </Link>
          </div>
          {featured.length ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((event, index) => (
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
            <EmptyPanel
              title="No featured activities yet"
              text="Published events marked as featured will appear here."
            />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <h2 className="text-3xl font-medium tracking-tight md:text-4xl">Upcoming</h2>
        {upcoming.length ? (
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {upcoming.map((event) => (
              <li key={event.id} className="grid gap-3 py-5 md:grid-cols-[10rem_1fr_auto] md:items-center">
                <p className="text-sm text-muted">{formatEventDate(event.eventDate) ?? "Date to be announced"}</p>
                <div>
                  <Link href={`/events/${event.slug}`} className="text-lg font-medium tracking-tight">
                    {event.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted">{event.shortDescription}</p>
                </div>
                <Link href={`/events/${event.slug}`} className="text-sm text-accent">
                  View details
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyPanel
            title="Nothing scheduled just yet"
            text="When an upcoming activity is published, it will be listed here with its date and details. No dates are invented to fill this space."
          />
        )}
      </section>

      <section className="border-y border-line bg-background">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <h2 className="text-3xl font-medium tracking-tight md:text-4xl">Explore by category</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/events?category=${category.slug}`}
                className="rounded-xl border border-line bg-wash/60 p-5 transition-colors hover:border-accent"
              >
                <p className="text-lg font-medium tracking-tight">{category.name}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="highlights" className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <h2 className="text-3xl font-medium tracking-tight md:text-4xl">Recent highlights</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {highlights.map((event) => (
            <article key={event.id}>
              <MediaFrame
                url={event.coverImageUrl}
                alt={event.coverAlt}
                hosts={hosts}
                title={event.title}
                kicker="Highlight"
              />
              <h3 className="mt-4 text-xl font-medium tracking-tight">
                <Link href={`/events/${event.slug}`}>{event.title}</Link>
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">{event.shortDescription}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <h2 className="text-3xl font-medium tracking-tight md:text-4xl">Achievements</h2>
          {achievements.length ? (
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {achievements.slice(0, 3).map((item) => (
                <li key={item.id} className="rounded-xl border border-white/15 p-5">
                  <p className="text-lg font-medium">{item.title}</p>
                  <p className="mt-2 text-sm text-white/70">
                    {[item.competitionName, item.award, item.winnerName].filter(Boolean).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 max-w-xl text-base leading-7 text-white/75">
              Competition results and named awards will appear here only after they are approved for publication.
            </p>
          )}
          <Link href="/achievements" className="mt-8 inline-flex text-sm text-white">
            View the archive
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <div className="flex items-end justify-between gap-6">
          <h2 className="text-3xl font-medium tracking-tight md:text-4xl">Gallery</h2>
          <Link href="/gallery" className="text-sm text-accent">
            Open gallery
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
          {events.slice(0, 3).map((event) => (
            <Link key={event.id} href={`/gallery#gallery-${event.slug}`} className="block">
              <MediaFrame
                url={event.coverImageUrl}
                alt={event.coverAlt}
                hosts={hosts}
                title={event.title}
                kicker="Photograph pending"
              />
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-16 md:flex-row md:items-end md:justify-between md:px-8 md:py-20">
          <div>
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl">Be part of what&apos;s next.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted">
              Discover student-led events, participate in initiatives, and register for selected activities through Arigo.
            </p>
          </div>
          <a
            href={siteConfig.arigoUrl ?? "https://arigo.buildkre.com"}
            className="rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white"
          >
            Explore Arigo
          </a>
        </div>
      </section>
    </>
  );
}

function EmptyPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-8 rounded-xl border border-line bg-background px-6 py-10">
      <p className="text-lg font-medium tracking-tight">{title}</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}
