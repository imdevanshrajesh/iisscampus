"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Download, ExternalLink, Eye, Maximize2, X } from "lucide-react";
import { classifyMediaUrl } from "@/lib/media/url";
import type { CampusEvent, GalleryImage } from "@/lib/types";

export type GalleryGroup = {
  event: CampusEvent;
  images: GalleryImage[];
  placeholder: string | null;
  totalCount?: number;
};

type Slide = {
  id: string;
  src: string;
  alt: string;
  caption: string | null;
  attribution: string | null;
  eventTitle: string;
  eventSlug: string;
  groupIndex: number;
};

export function GalleryView({
  groups,
  hosts,
  showEventActions = false,
}: {
  groups: GalleryGroup[];
  hosts: readonly string[];
  showEventActions?: boolean;
}) {
  const [activeSlide, setActiveSlide] = useState<number | null>(null);

  // Flatten valid slides
  const slides: Slide[] = useMemo(() => {
    return groups.flatMap((group, groupIndex) =>
      group.images.flatMap((image) => {
        const classified = classifyMediaUrl(image.url, hosts);
        if (!classified.ok) return [];
        return [
          {
            id: `${group.event.id}-${image.id}`,
            src: classified.url,
            alt: image.alt,
            caption: image.caption,
            attribution: image.attribution,
            eventTitle: group.event.title,
            eventSlug: group.event.slug,
            groupIndex,
          },
        ];
      }),
    );
  }, [groups, hosts]);

  const isOpen = activeSlide !== null && activeSlide >= 0 && activeSlide < slides.length;
  const current = isOpen ? slides[activeSlide] : null;

  // Keyboard navigation & lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveSlide(null);
      } else if (e.key === "ArrowLeft") {
        setActiveSlide((prev) => (prev !== null && prev > 0 ? prev - 1 : slides.length - 1));
      } else if (e.key === "ArrowRight") {
        setActiveSlide((prev) => (prev !== null && prev < slides.length - 1 ? prev + 1 : 0));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, slides.length]);

  function next() {
    setActiveSlide((prev) => (prev !== null && prev < slides.length - 1 ? prev + 1 : 0));
  }

  function prev() {
    setActiveSlide((prev) => (prev !== null && prev > 0 ? prev - 1 : slides.length - 1));
  }

  // Pre-calculate index map
  let cursor = 0;
  const groupSlideIndices = groups.map((g) => {
    const validCount = g.images.filter((img) => classifyMediaUrl(img.url, hosts).ok).length;
    const start = cursor;
    cursor += validCount;
    return { start, count: validCount };
  });

  return (
    <div className="space-y-16">
      {groups.map((group, gIdx) => {
        const allCount = group.totalCount ?? group.images.length;
        const { start } = groupSlideIndices[gIdx];

        return (
          <section key={group.event.id} aria-labelledby={`gallery-${group.event.slug}`} className="space-y-6">
            {/* Event Gallery Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-line pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Event Gallery
                </span>
                <h2 id={`gallery-${group.event.slug}`} className="font-display mt-1 text-2xl text-ink md:text-3xl font-medium tracking-tight">
                  {group.event.title}
                </h2>
              </div>

              {showEventActions ? (
                <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium">
                  <Link
                    href={`/events/${group.event.slug}#photographs`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-ink shadow-xs hover:bg-wash transition"
                  >
                    <span>All event photos</span>
                    <span className="rounded-full bg-navy/10 px-1.5 py-0.2 text-[10px] font-semibold text-navy">
                      {allCount}
                    </span>
                  </Link>
                  <Link
                    href={`/events/${group.event.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-2 text-white shadow-xs hover:bg-navy/90 transition"
                  >
                    <span>Event details</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              ) : null}
            </div>

            {/* Photo Grid with Uniform Uniform Styling & notmistix-style Hover Zoom */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {group.images.length ? (
                group.images.map((image, iIdx) => {
                  const classified = classifyMediaUrl(image.url, hosts);
                  const slideIndex = start + iIdx;

                  if (!classified.ok) {
                    return (
                      <div
                        key={image.id}
                        className="flex aspect-[4/3] items-end rounded-2xl bg-wash p-4 text-xs text-muted border border-line/60"
                      >
                        Photograph unavailable
                      </div>
                    );
                  }

                  return (
                    <figure
                      key={image.id}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line/80 bg-white shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-md"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveSlide(slideIndex)}
                        className="relative aspect-[4/3] w-full overflow-hidden bg-wash text-left focus:outline-none"
                        aria-label={`Open photo from ${group.event.title}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={classified.url}
                          alt={image.alt}
                          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-108"
                          loading="lazy"
                        />

                        {/* notmistix style hover overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 transition duration-300 group-hover:opacity-100 flex items-center justify-center gap-2 text-white">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                            <Maximize2 size={16} />
                          </span>
                        </div>
                      </button>

                      {image.caption || image.attribution ? (
                        <figcaption className="p-3 text-xs leading-5 text-muted border-t border-line/50">
                          {image.caption ? <span className="block font-medium text-ink">{image.caption}</span> : null}
                          {image.attribution ? (
                            <span className="block text-[11px] text-muted">{image.attribution}</span>
                          ) : null}
                        </figcaption>
                      ) : null}
                    </figure>
                  );
                })
              ) : (
                <div className="col-span-full rounded-2xl border border-dashed border-line bg-wash/30 p-8 text-center">
                  <p className="text-sm font-medium text-ink">No pinned photographs for this event yet.</p>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* notmistix.com/works Inspired Fullscreen Lightbox Modal */}
      {isOpen && current ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo Lightbox"
          className="fixed inset-0 z-50 flex flex-col justify-between bg-black/92 backdrop-blur-2xl text-white animate-in fade-in duration-200"
        >
          {/* Top Bar: Event Title, Counter, and Close Button */}
          <div className="relative z-10 flex items-center justify-between px-5 py-4 md:px-8 border-b border-white/10">
            <div className="min-w-0 pr-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold">
                {current.eventTitle}
              </span>
              <p className="text-sm font-medium text-white/90 truncate">
                {current.caption || current.eventTitle || "Photograph"}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Photo Counter */}
              <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-mono tracking-wider text-white/90">
                <span className="text-gold font-bold">{(activeSlide ?? 0) + 1}</span> / {slides.length}
              </div>

              {/* View Event Link */}
              <Link
                href={`/events/${current.eventSlug}`}
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 hover:bg-white/20 transition"
              >
                <span>Event page</span>
                <ExternalLink size={12} />
              </Link>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveSlide(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/25 hover:scale-105 transition"
                aria-label="Close photograph modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Center Stage: Image with Side Controls */}
          <div className="relative flex flex-1 items-center justify-center p-4 md:p-8 overflow-hidden">
            {/* Prev Button */}
            <button
              type="button"
              onClick={prev}
              className="absolute left-4 md:left-8 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white hover:bg-white/20 hover:scale-110 transition shadow-lg"
              aria-label="Previous photograph"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Main Full-Res Image */}
            <div className="relative flex max-h-[75vh] max-w-5xl items-center justify-center select-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.src}
                alt={current.alt}
                className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-2xl transition duration-300"
              />
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={next}
              className="absolute right-4 md:right-8 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white hover:bg-white/20 hover:scale-110 transition shadow-lg"
              aria-label="Next photograph"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Bottom Bar: Caption & notmistix.com Scrubber Dots */}
          <div className="relative z-10 flex flex-col items-center gap-3 border-t border-white/10 px-5 py-4 md:px-8">
            {current.attribution ? (
              <p className="text-xs text-white/50 tracking-wide">
                Photo by {current.attribution}
              </p>
            ) : null}

            {/* notmistix style scrubber dots */}
            <div className="flex max-w-full items-center gap-1.5 overflow-x-auto py-1 px-4 no-scrollbar">
              {slides.map((s, idx) => {
                const isActive = idx === activeSlide;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className="group relative flex h-6 items-center justify-center px-1"
                    aria-label={`Jump to slide ${idx + 1}`}
                  >
                    <span
                      className={`block rounded-full transition-all duration-300 ease-out ${
                        isActive
                          ? "h-2 w-7 bg-gold shadow-[0_0_8px_rgba(196,165,116,0.6)]"
                          : "h-2 w-2 bg-white/30 group-hover:bg-white/60 group-hover:scale-125"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
