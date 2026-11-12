"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { CouncilLogo } from "@/components/brand/council-logo";
import { CouncilBoardSection } from "@/components/council/council-board";
import { RevealOnScroll } from "@/components/home/reveal-on-scroll";
import { councilMembersOnBoard, formatEventDate, paragraphs } from "@/lib/data/catalog";
import { classifyMediaUrl } from "@/lib/media/url";
import { linkHostIsInstagram } from "@/lib/social";
import { partitionCouncilYears } from "@/lib/terms";
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
  const { primary, collapsed, ordered } = useMemo(() => partitionCouncilYears(years), [years]);
  const [expandedArchiveIds, setExpandedArchiveIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    function openFromHash() {
      const slug = window.location.hash.replace(/^#/, "").trim();
      if (!slug) return;
      const target = collapsed.find((item) => item.slug === slug);
      if (target) {
        setExpandedArchiveIds((prev) => {
          if (prev.has(target.id)) return prev;
          const next = new Set(prev);
          next.add(target.id);
          return next;
        });
      }
    }

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [collapsed]);

  function openYearBySlug(slug: string) {
    const target = collapsed.find((item) => item.slug === slug);
    if (!target) return;
    setExpandedArchiveIds((prev) => {
      const next = new Set(prev);
      next.add(target.id);
      return next;
    });
  }

  function toggleArchiveYear(id: string) {
    setExpandedArchiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allArchiveExpanded =
    collapsed.length > 0 && collapsed.every((item) => expandedArchiveIds.has(item.id));

  function toggleAllArchives() {
    if (allArchiveExpanded) {
      setExpandedArchiveIds(new Set());
      return;
    }
    setExpandedArchiveIds(new Set(collapsed.map((item) => item.id)));
  }

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
            <p className="text-[0.68rem] font-medium tracking-[0.22em] text-accent uppercase">
              Student council · Boys
            </p>
            <h1 className="font-display mt-4 max-w-[12ch] text-[clamp(3.2rem,6vw,6rem)] leading-[0.86] text-ink">
              The boys who <span className="italic">run the year.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-muted">
              The sitting council is shown in full below. Previous terms stay preserved in the expandable archive at the bottom.
            </p>
          </div>
        </div>

        {ordered.length ? (
          <div className="relative z-[1] mt-12 flex flex-wrap items-center gap-2 md:pl-[calc(18rem+4rem)]">
            {yearChips(ordered, scixcom, openYearBySlug)}
          </div>
        ) : null}
      </section>

      {primary ? (
        <CouncilYearExpanded year={primary} hosts={hosts} delay={0} />
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

      {collapsed.length > 0 ? (
        <section className="border-t border-line bg-wash/20">
          <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
                  Archive
                </p>
                <h2 className="font-display mt-1.5 text-3xl text-ink md:text-4xl">
                  Previous &amp; Other Terms ({collapsed.length})
                </h2>
                <p className="mt-1.5 text-sm text-muted">
                  Collapsed to keep this year clear. Open any year to view its full roster, photographs, and notes.
                </p>
              </div>
              {collapsed.length > 1 ? (
                <button
                  type="button"
                  onClick={toggleAllArchives}
                  className="rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-ink/40"
                >
                  {allArchiveExpanded ? "Collapse all years" : "Expand all years"}
                </button>
              ) : null}
            </div>

            <div className="mt-6 space-y-4">
              {collapsed.map((year) => {
                const isOpen = expandedArchiveIds.has(year.id);
                const counts = [
                  year.members.length ? `${year.members.length} ${year.members.length === 1 ? "post" : "posts"}` : null,
                  year.photos.length ? `${year.photos.length} ${year.photos.length === 1 ? "photo" : "photos"}` : null,
                  year.posts.length ? `${year.posts.length} ${year.posts.length === 1 ? "update" : "updates"}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <div
                    key={year.id}
                    id={year.slug}
                    className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs transition"
                  >
                    <button
                      type="button"
                      onClick={() => toggleArchiveYear(year.id)}
                      aria-expanded={isOpen}
                      aria-controls={`council-panel-${year.slug}`}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-wash/35 sm:px-7"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="rounded-full bg-wash px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
                            {kindLabel[year.kind]}
                          </span>
                          {counts ? (
                            <span className="text-xs text-muted">{counts}</span>
                          ) : null}
                        </div>
                        <h3 className="font-display mt-2 text-2xl text-ink sm:text-3xl">
                          {year.label}
                        </h3>
                        {!isOpen && year.summary ? (
                          <p className="mt-1.5 line-clamp-2 max-w-2xl text-sm text-muted">
                            {year.summary}
                          </p>
                        ) : null}
                      </div>

                      <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink">
                        <span>{isOpen ? "Hide details" : "View year"}</span>
                        <ChevronDown
                          size={15}
                          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </span>
                    </button>

                    {isOpen ? (
                      <div
                        id={`council-panel-${year.slug}`}
                        className="border-t border-line/80 px-5 py-8 sm:px-7"
                      >
                        <CouncilYearBody year={year} hosts={hosts} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function yearChips(
  years: CouncilYear[],
  scixcom: { label: string; url: string },
  onSelectYear: (slug: string) => void,
) {
  const chips: ReactNode[] = [];
  const instagram = linkHostIsInstagram(scixcom.url);
  for (const year of years) {
    chips.push(
      <a
        key={year.id}
        href={`#${year.slug}`}
        onClick={() => onSelectYear(year.slug)}
        className="council-year-chip"
      >
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

function CouncilYearExpanded({
  year,
  hosts,
  delay,
}: {
  year: CouncilYear;
  hosts: readonly string[];
  delay: number;
}) {
  return (
    <section id={year.slug} className="council-year-block border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <RevealOnScroll delay={delay}>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">{kindLabel[year.kind]}</p>
          <h2 className="font-display mt-2 text-4xl text-ink md:text-5xl">{year.label}</h2>
          {year.summary ? <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{year.summary}</p> : null}
        </RevealOnScroll>
        <CouncilYearBody year={year} hosts={hosts} />
      </div>
    </section>
  );
}

function CouncilYearBody({
  year,
  hosts,
}: {
  year: CouncilYear;
  hosts: readonly string[];
}) {
  const photos = year.photos.filter((photo) => classifyMediaUrl(photo.url, hosts).ok);
  const main = councilMembersOnBoard(year.members ?? [], "main");
  const junior = councilMembersOnBoard(year.members ?? [], "junior");
  const juniorHeading = year.juniorHeading?.trim() || "Junior Student Council";

  return (
    <>
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
    </>
  );
}
