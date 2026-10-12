"use client";

import type { ReactNode } from "react";
import { CouncilLogo } from "@/components/brand/council-logo";
import { CouncilBoardSection } from "@/components/council/council-board";
import { RevealOnScroll } from "@/components/home/reveal-on-scroll";
import { councilMembersOnBoard, formatEventDate, paragraphs } from "@/lib/data/catalog";
import { classifyMediaUrl } from "@/lib/media/url";
import { linkHostIsInstagram } from "@/lib/social";
import type { CouncilKind, CouncilYear } from "@/lib/types";

const kindLabel: Record<CouncilKind, string> = {
  current: "This year",
  upcoming: "Coming up",
  past: "Earlier",
};

export function CouncilPageView({
  years,
  hosts,
  scixcom,
  logoUrl,
}: {
  years: CouncilYear[];
  hosts: readonly string[];
  scixcom: { label: string; url: string };
  logoUrl?: string | null;
}) {
  return (
    <div className="council-page">
      <section className="council-hero relative mx-auto max-w-[90rem] px-5 py-8 md:px-8 md:py-14">
        <div className="grid items-end gap-10 md:grid-cols-[18rem_1fr] md:gap-16">
          <CouncilLogo
            url={logoUrl}
            alt="Student Council, Boys"
            width={640}
            height={640}
            className="mx-auto h-auto w-full max-w-[16rem] object-contain md:mx-0"
            priority
          />
          <div>
            <p className="text-[0.68rem] font-medium tracking-[0.22em] text-accent uppercase">Student council · Boys</p>
            <h1 className="font-display mt-4 max-w-[12ch] text-[clamp(3.2rem,6vw,6rem)] leading-[0.86] text-ink">
              The boys who <span className="italic">run the year.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-muted">
              Photographs and short posts for the current council, the one coming in, and the years already finished.
            </p>
          </div>
        </div>

        {years.length ? (
          <div className="relative z-[1] mt-12 flex flex-wrap items-center gap-2 md:pl-[calc(18rem+4rem)]">
            {yearChips(years, scixcom)}
          </div>
        ) : null}
      </section>

      {years.length ? (
        years.map((year, yearIndex) => (
          <CouncilYearSection key={year.id} year={year} hosts={hosts} delay={yearIndex * 40} />
        ))
      ) : (
        <div className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
          <RevealOnScroll>
            <div className="max-w-xl border-t border-line pt-8">
              <p className="font-display text-3xl text-ink">The page is ready.</p>
              <p className="mt-3 text-base leading-7 text-muted">
                Add a year from the content desk, attach the photographs and posts, and publish it.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      )}
    </div>
  );
}

function yearChips(years: CouncilYear[], scixcom: { label: string; url: string }) {
  const chips: ReactNode[] = [];
  const instagram = linkHostIsInstagram(scixcom.url);
  for (const year of years) {
    chips.push(
      <a key={year.id} href={`#${year.slug}`} className="council-year-chip">
        <span className="council-year-chip__label">{year.label}</span>
        <span className="council-year-chip__kind">{kindLabel[year.kind]}</span>
      </a>,
    );
    if (year.kind === "current" && scixcom.url) {
      chips.push(
        <a
          key={`${year.id}-scixcom`}
          href={scixcom.url}
          className="council-year-chip council-scixcom"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={instagram ? `${scixcom.label} on Instagram` : scixcom.label}
        >
          {instagram ? <InstagramMark /> : null}
          <span className="council-year-chip__label">{scixcom.label}</span>
        </a>,
      );
    }
  }
  return chips;
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="shrink-0">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" />
    </svg>
  );
}

function CouncilYearSection({
  year,
  hosts,
  delay,
}: {
  year: CouncilYear;
  hosts: readonly string[];
  delay: number;
}) {
  const photos = year.photos.filter((photo) => classifyMediaUrl(photo.url, hosts).ok);
  const main = councilMembersOnBoard(year.members ?? [], "main");
  const junior = councilMembersOnBoard(year.members ?? [], "junior");
  const juniorHeading = year.juniorHeading?.trim() || "Junior Student Council";

  return (
    <section id={year.slug} className="council-year-block border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <RevealOnScroll delay={delay}>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">{kindLabel[year.kind]}</p>
          <h2 className="font-display mt-2 text-4xl text-ink md:text-5xl">{year.label}</h2>
          {year.summary ? <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{year.summary}</p> : null}
        </RevealOnScroll>

        <CouncilBoardSection
          title="Student Council"
          members={main}
          hosts={hosts}
          yearSlug={year.slug}
          board="main"
        />

        <CouncilBoardSection
          title={juniorHeading}
          members={junior}
          hosts={hosts}
          yearSlug={year.slug}
          board="junior"
        />

        {photos.length ? (
          <div className="gallery-mosaic mt-12">
            {photos.map((photo, index) => (
              <RevealOnScroll key={photo.id} className={index % 4 === 1 ? "gallery-mosaic__tall" : ""} delay={index * 60}>
                <figure className="gallery-tile overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.alt} className="w-full object-cover" loading="lazy" />
                  {photo.caption ? <figcaption className="mt-2 text-sm text-muted">{photo.caption}</figcaption> : null}
                </figure>
              </RevealOnScroll>
            ))}
          </div>
        ) : null}

        {year.posts.length ? (
          <div className="mt-12 grid gap-8">
            {year.posts.map((post, index) => {
              const image = post.imageUrl ? classifyMediaUrl(post.imageUrl, hosts) : null;
              const date = formatEventDate(post.publishedOn);
              return (
                <RevealOnScroll key={post.id} delay={index * 70}>
                  <article className="council-post grid gap-5 border-t border-line/70 pt-8 md:grid-cols-[13rem_1fr] md:gap-10">
                    <div>
                      {date ? <p className="text-sm text-muted">{date}</p> : null}
                      <h3 className="font-display mt-1 text-2xl text-ink">{post.title}</h3>
                    </div>
                    <div>
                      {image?.ok ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image.url}
                          alt={post.imageAlt ?? ""}
                          className="mb-4 aspect-[3/2] w-full rounded-2xl object-cover"
                          loading="lazy"
                        />
                      ) : null}
                      <div className="max-w-2xl space-y-3 text-base leading-7">
                        {paragraphs(post.body).map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  </article>
                </RevealOnScroll>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
