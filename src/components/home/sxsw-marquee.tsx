"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Calendar, Clock, Pause, Play } from "lucide-react";
import { PreviewTrigger } from "@/components/preview/preview-provider";
import { categoryById, formatEventDate, getEffectiveEventStatus } from "@/lib/data/catalog";
import { categoryStyle } from "@/lib/home/category-style";
import { classifyMediaUrl } from "@/lib/media/url";
import type { CampusEvent, Category } from "@/lib/types";

export function SxswMarquee({
  events,
  categories,
  hosts,
  heading = "FEATURED HIGHLIGHTS",
  accent = "",
  kicker = "Campus Highlights",
}: {
  events: CampusEvent[];
  categories: Category[];
  hosts: readonly string[];
  heading?: string;
  accent?: string;
  kicker?: string;
}) {
  const [isPaused, setIsPaused] = useState(false);

  if (!events.length) return null;

  // Double the list for seamless infinite loop
  const displayEvents = events.length < 5 ? [...events, ...events, ...events] : [...events, ...events];

  return (
    <section className="relative overflow-hidden py-14 md:py-20 bg-gradient-to-b from-transparent via-navy/[0.03] to-transparent">
      {/* Top Header & Controls */}
      <div className="mx-auto max-w-[90rem] px-5 md:px-8 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
            <p className="kicker text-muted text-xs uppercase tracking-widest">{kicker}</p>
          </div>
          <h2 className="font-display text-[clamp(2.2rem,4.5vw,3.8rem)] leading-none text-ink mt-1">
            {heading} {accent ? <span className="italic text-accent">{accent}</span> : null}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-ink shadow-xs backdrop-blur-md transition hover:bg-wash"
            aria-label={isPaused ? "Play marquee" : "Pause marquee"}
          >
            {isPaused ? <Play size={12} className="text-accent fill-accent" /> : <Pause size={12} className="text-accent" />}
            <span>{isPaused ? "Resume Flow" : "Pause"}</span>
          </button>

          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-navy/90"
          >
            <span>All Events</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      {/* Edge Gradient Fades for Seamless Cinema Effect */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 sm:w-28 bg-gradient-to-r from-[#fcfbf5] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 sm:w-28 bg-gradient-to-l from-[#fcfbf5] to-transparent" />

      {/* Infinite Scrolling Track */}
      <div className="overflow-hidden py-3">
        <div
          className="sxsw-track flex gap-5 px-5"
          style={{
            animationPlayState: isPaused ? "paused" : "running",
          }}
        >
          {displayEvents.map((event, index) => {
            const category = categoryById(categories, event.categoryId);
            const style = categoryStyle(category?.slug);
            const dateStr = formatEventDate(event.eventDate);
            const isLive = getEffectiveEventStatus(event) === "ongoing" && !event.isSample;
            const validCover = event.coverImageUrl ? classifyMediaUrl(event.coverImageUrl, hosts) : null;
            const hasCover = Boolean(validCover?.ok);

            return (
              <div
                key={`${event.id}-${index}`}
                className="w-[300px] sm:w-[350px] shrink-0 group select-none"
              >
                <article className="relative flex h-[410px] flex-col justify-between overflow-hidden rounded-2xl border border-line/80 bg-white shadow-md transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl hover:border-accent/40">
                  <PreviewTrigger event={event} className="flex h-full w-full flex-col justify-between text-left">
                    {/* Media Cover Frame */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-navy/5 select-none">
                      {hasCover && validCover?.ok ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={validCover.url}
                          alt={event.coverAlt || event.title}
                          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-108"
                          loading="lazy"
                        />
                      ) : (
                        <div className="relative flex h-full w-full flex-col justify-between p-5 bg-gradient-to-br from-wash via-surface to-line/60">
                          <div className="relative z-10 flex items-center justify-between">
                            <span className="font-display text-xs italic tracking-widest text-accent uppercase">
                              IISS Campus
                            </span>
                            <span className="text-[10px] font-mono text-muted/70">
                              ACTIVITY
                            </span>
                          </div>
                          <span className="font-display text-xl font-bold leading-tight text-ink/25 line-clamp-2">
                            {event.title}
                          </span>
                        </div>
                      )}

                      {/* Top Floating Badges */}
                      <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
                        {category ? (
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-xs backdrop-blur-md border ${style.badge}`}>
                            {category.name}
                          </span>
                        ) : <span />}

                        {isLive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            <span>Live</span>
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        {/* Date and Time */}
                        <div className="flex items-center gap-2 text-xs text-muted">
                          {dateStr ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-accent">
                              <Calendar size={12} />
                              <span>{dateStr}</span>
                            </span>
                          ) : (
                            <span>Dates Open</span>
                          )}
                          {event.startTime ? (
                            <span className="inline-flex items-center gap-1 text-muted/80">
                              <Clock size={11} /> {event.startTime}
                            </span>
                          ) : null}
                        </div>

                        {/* Title */}
                        <h3 className="font-display mt-2 line-clamp-2 text-xl font-medium leading-snug text-ink group-hover:text-accent transition duration-200">
                          {event.title}
                        </h3>

                        {/* Short Description */}
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
                          {event.shortDescription}
                        </p>
                      </div>

                      {/* Card Bottom Meta */}
                      <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs">
                        <span className="text-muted truncate max-w-[190px]">
                          {event.locationName || "Campus Stage"}
                        </span>

                        <span className="inline-flex items-center gap-1 font-semibold text-accent group-hover:translate-x-1 transition-transform">
                          <span>Preview</span>
                          <ArrowUpRight size={13} />
                        </span>
                      </div>
                    </div>
                  </PreviewTrigger>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
