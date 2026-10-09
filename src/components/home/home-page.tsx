import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { AchievementCards } from "@/components/home/achievement-cards";
import { BoardCard } from "@/components/home/board-card";
import { ComingUp } from "@/components/home/coming-up";
import { CouncilPreview } from "@/components/home/council-preview";
import { GalleryMosaic } from "@/components/home/gallery-mosaic";
import { LiveNow } from "@/components/home/live-now";
import { RevealOnScroll } from "@/components/home/reveal-on-scroll";
import { RingLink } from "@/components/home/ring-link";
import { Today } from "@/components/home/today";
import { siteConfig } from "@/lib/config";
import { compareCampusEvents } from "@/lib/data/catalog";
import type { Achievement, CampusEvent, Category } from "@/lib/types";

const pageAnchors = [
  { href: "/events", label: "Events" },
  { href: "/council", label: "Council" },
  { href: "/achievements", label: "Achievements" },
  { href: "/gallery", label: "Gallery" },
];

function delay(ms: number) {
  return { "--d": `${ms}ms` } as CSSProperties;
}

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
  const lead = (featured.length ? featured : events).slice(0, 5);
  const ongoing = events.filter((event) => event.eventStatus === "ongoing" && !event.isSample);
  const upcoming = events
    .filter((event) => event.eventStatus === "upcoming" && !event.isSample)
    .slice()
    .sort(compareCampusEvents);
  const completed = events
    .filter((event) => event.eventStatus === "completed" && !event.isSample)
    .slice()
    .sort(compareCampusEvents);

  return (
    <>
      <section className="home-hero">
        <div className="mx-auto max-w-[90rem] px-5 pt-4 md:px-8 md:pt-8">
          <div
            className="rise kicker grid grid-cols-2 gap-3 border-y border-ink/80 py-3 text-ink/75 md:grid-cols-3"
            style={delay(0)}
          >
            <span>{siteConfig.name}</span>
            <span className="hidden text-center md:block">IISIANS</span>
            <span className="text-right">
              <Today />
            </span>
          </div>

          <div className="mt-10 flex items-end justify-between gap-10 md:mt-14">
            <h1 className="hero-title font-display text-ink">
              <span className="rise block" style={delay(120)}>
                What&apos;s
              </span>
              <span className="rise relative inline-block italic" style={delay(260)}>
                going on
                <span className="hero-title__question">?</span>
                <svg className="hero-scribble" viewBox="0 0 400 30" preserveAspectRatio="none" aria-hidden="true">
                  <path pathLength={1} d="M4 20 C 70 8, 140 26, 210 14 S 330 6, 396 18" />
                </svg>
              </span>
            </h1>
            <div className="rise hero-stamp hidden shrink-0 md:block" style={delay(360)} aria-hidden="true">
              <svg viewBox="0 0 200 200" className="hero-stamp__ring">
                <defs>
                  <path id="hero-stamp-path" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
                </defs>
                <text>
                  <textPath href="#hero-stamp-path">
                    {`${siteConfig.name} · ${siteConfig.name} · `}
                  </textPath>
                </text>
              </svg>
              <Image src="/brand/iiss-mark.webp" alt="" width={88} height={88} className="hero-stamp__mark" />
            </div>
          </div>

          <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-[1fr_auto] md:items-end">
            <div className="rise max-w-xl" style={delay(420)}>
              <p className="text-lg leading-8 text-ink/80 md:text-xl md:leading-9">
                Live activity, what&apos;s next, and the boys&apos; student council.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <RingLink href="/events">See what&apos;s on</RingLink>
                <RingLink href="/council" tone="quiet">
                  Student council
                </RingLink>
              </div>
            </div>
            <nav className="rise" style={delay(540)} aria-label="On this page">
              <p className="kicker text-muted">Inside</p>
              <ul className="mt-3 space-y-1.5 border-l border-accent/50 pl-4">
                {pageAnchors.map((link, index) => (
                  <li key={link.href}>
                    <Link href={link.href} className="group flex items-baseline gap-3 text-sm text-ink">
                      <span className="font-display text-xs italic text-accent">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-link">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="rise home-hero__stage mt-14 md:mt-20" style={delay(680)}>
            <LiveNow ongoing={ongoing} upcoming={upcoming} />
          </div>
        </div>
      </section>

      <section id="board" className="mx-auto max-w-[90rem] px-5 py-20 md:px-8 md:py-28">
        <RevealOnScroll>
          <div className="flex items-end justify-between gap-6 border-b border-ink pb-4">
            <h2 className="font-display text-[clamp(2.6rem,5vw,4.5rem)] leading-none text-ink">
              On the <span className="italic">board</span>
            </h2>
            <Link href="/events" className="text-link text-sm text-ink">
              All events
            </Link>
          </div>
        </RevealOnScroll>
        {lead.length ? (
          <div className="board-grid mt-8">
            {lead.slice(0, 5).map((event, index) => (
              <RevealOnScroll
                key={event.id}
                className={index === 0 ? "board-grid__lead" : index === 3 ? "board-grid__wide" : ""}
                delay={index * 80}
              >
                <BoardCard
                  event={event}
                  categories={categories}
                  hosts={hosts}
                  tall={index === 0 || index === 2}
                  priority={index === 0}
                />
              </RevealOnScroll>
            ))}
          </div>
        ) : (
          <RevealOnScroll delay={120}>
            <p className="font-display mt-10 max-w-xl text-3xl italic leading-tight text-ink/70">
              The board is clear for now. Published events will be pinned here.
            </p>
          </RevealOnScroll>
        )}
      </section>

      <ComingUp
        events={upcoming}
        categories={categories}
        heading="Coming"
        accent="up"
        kicker="Next on the calendar"
        seeMoreHref="/events?status=upcoming"
        empty="Nothing dated yet. Upcoming activities land here the moment they are published."
      />

      <ComingUp
        events={completed}
        categories={categories}
        heading="Just"
        accent="finished"
        kicker="Most recent first"
        seeMoreHref="/events?status=completed"
      />

      <section className="mx-auto max-w-[90rem] px-5 py-20 md:px-8 md:py-28">
        <RevealOnScroll>
          <h2 className="font-display max-w-[12ch] text-[clamp(2.6rem,5vw,4.5rem)] leading-[0.9] text-ink">
            Browse <span className="italic">by kind.</span>
          </h2>
        </RevealOnScroll>
        <ol className="mt-10 border-t border-ink">
          {categories.map((category, index) => (
            <li key={category.id} className="border-b border-line">
              <RevealOnScroll delay={index * 50}>
                <Link
                  href={`/events?category=${category.slug}`}
                  className="group grid gap-2 py-6 md:grid-cols-[5rem_1fr_auto] md:items-baseline md:gap-8"
                >
                  <span className="font-display text-2xl italic text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-3xl text-ink transition-[transform,color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-3 group-hover:text-accent md:text-4xl">
                    {category.name}
                  </span>
                  <span className="max-w-md text-sm leading-6 text-muted md:text-right">{category.description}</span>
                </Link>
              </RevealOnScroll>
            </li>
          ))}
        </ol>
      </section>

      <CouncilPreview />

      <section className="mx-auto grid max-w-[90rem] gap-16 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-2 lg:gap-12">
        <AchievementCards achievements={achievements} categories={categories} hosts={hosts} />
        <GalleryMosaic events={events} hosts={hosts} />
      </section>
    </>
  );
}
