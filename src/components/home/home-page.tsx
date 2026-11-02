import Image from "next/image";
import type { CSSProperties } from "react";
import { AchievementCards } from "@/components/home/achievement-cards";
import { ComingUp } from "@/components/home/coming-up";
import { CouncilPreview } from "@/components/home/council-preview";
import { GalleryMosaic } from "@/components/home/gallery-mosaic";
import { AnnouncementHomePanel } from "@/components/home/announcement-home-panel";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { EmsHighlights } from "@/components/home/ems-highlights";
import { LiveNow } from "@/components/home/live-now";
import { RingLink } from "@/components/home/ring-link";
import { SxswMarquee } from "@/components/home/sxsw-marquee";
import { Today } from "@/components/home/today";
import { siteConfig } from "@/lib/config";
import { compareCampusEvents } from "@/lib/data/catalog";
import type { Achievement, Announcement, CampusEvent, Category } from "@/lib/types";

function delay(ms: number) {
  return { "--d": `${ms}ms` } as CSSProperties;
}

export function HomePage({
  events,
  categories,
  achievements,
  hosts,
  logoUrl,
  announcements,
}: {
  events: CampusEvent[];
  categories: Category[];
  achievements: Achievement[];
  hosts: readonly string[];
  logoUrl?: string | null;
  announcements: Announcement[];
}) {
  const campusEvents = events.filter((event) => event.listing !== "external");
  const featured = campusEvents.filter((event) => event.featured);
  const lead = (featured.length ? featured : campusEvents).slice(0, 8);
  const ongoing = campusEvents.filter((event) => event.eventStatus === "ongoing");
  const upcomingRaw = campusEvents
    .filter((event) => event.eventStatus === "upcoming")
    .slice()
    .sort(compareCampusEvents);
  const upcoming = upcomingRaw.length ? upcomingRaw : campusEvents.slice(0, 6);
  const competitions = events
    .filter((event) => event.listing === "competition" || event.listing === "external")
    .slice()
    .sort(compareCampusEvents);

  return (
    <>
      {/* Hero Section */}
      <section className="home-hero">
        <div className="mx-auto max-w-[90rem] px-5 pt-3 md:px-8">
          <div
            className="rise kicker grid grid-cols-2 gap-3 border-y border-ink/80 py-3 text-ink/75"
            style={delay(0)}
          >
            <span>{siteConfig.name}</span>
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
                    IISS X STUDENT COUNCIL BOYS · IISS X STUDENT COUNCIL BOYS ·{" "}
                  </textPath>
                </text>
              </svg>
              <Image src="/brand/iiss-mark.webp" alt="" width={88} height={88} className="hero-stamp__mark" />
            </div>
          </div>

          {/* Decluttered Sub-hero row: removed the repetitive "INSIDE" list */}
          <div className="mt-10 grid gap-6 md:mt-12 md:max-w-2xl">
            <div className="rise" style={delay(420)}>
              <p className="text-lg leading-8 text-ink/80 md:text-xl md:leading-9">
                Live activity, upcoming fixtures, competitions, and the boys&apos; student council.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <RingLink href="/events">Explore Activities</RingLink>
                <RingLink href="/council" tone="quiet">
                  Student Council
                </RingLink>
              </div>
            </div>
          </div>

          {/* Upgraded Stage Radar & Notice Board */}
          <div className="rise home-hero__stage mt-12 md:mt-16" style={delay(540)}>
            <LiveNow ongoing={ongoing} upcoming={upcoming} />
            <AnnouncementHomePanel announcements={announcements} />
          </div>
        </div>
      </section>

      {/* Infinite Horizontal Cards Marquee */}
      <SxswMarquee
        events={lead.length ? lead : upcoming}
        categories={categories}
        hosts={hosts}
        heading="Featured"
        accent="Highlights"
        kicker="Featured Lineup"
      />

      {/* Campus Highlights & Upcoming Events */}
      <EmsHighlights upcomingEvents={upcoming} announcements={announcements} />

      {/* The Competitions Stream */}
      {competitions.length > 0 ? (
        <ComingUp
          events={competitions}
          categories={categories}
          hosts={hosts}
          heading="The"
          accent="competitions"
          kicker="Hosted here and at other schools"
          seeMoreHref="/competitions"
          empty="Published competitions will be listed here."
          direction="reverse"
        />
      ) : null}

      {/* Upgraded Modern Category Showcase */}
      <CategoryShowcase categories={categories} events={campusEvents} />

      {/* Student Council Section */}
      <CouncilPreview logoUrl={logoUrl} />

      {/* Achievements & Gallery Mosaic */}
      <section className="mx-auto grid max-w-[90rem] gap-16 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-2 lg:gap-12">
        <AchievementCards achievements={achievements} categories={categories} hosts={hosts} />
        <GalleryMosaic events={events} hosts={hosts} />
      </section>
    </>
  );
}
