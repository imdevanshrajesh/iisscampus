"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { RevealOnScroll } from "@/components/home/reveal-on-scroll";
import { UniformEventCard } from "@/components/home/uniform-event-card";
import type { CampusEvent, Category } from "@/lib/types";

export function ComingUp({
  events,
  categories,
  hosts,
  heading,
  accent,
  kicker,
  seeMoreHref,
  empty,
  id,
}: {
  events: CampusEvent[];
  categories: Category[];
  hosts: readonly string[];
  heading: string;
  accent: string;
  kicker: string;
  seeMoreHref: string;
  empty?: string;
  direction?: "normal" | "reverse";
  id?: string;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function checkScroll() {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }

  useEffect(() => {
    checkScroll();
    const el = rowRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [events]);

  function scroll(delta: number) {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: delta, behavior: "smooth" });
  }

  if (!events.length && !empty) return null;

  return (
    <section id={id} className="home-band py-12 md:py-16">
      <div className="mx-auto max-w-[90rem] px-5 md:px-8">
        <RevealOnScroll>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ink/80 pb-4">
            <div>
              <p className="kicker text-muted">{kicker}</p>
              <h2 className="font-display text-[clamp(2.4rem,5vw,4.2rem)] leading-none text-ink mt-1">
                {heading} <span className="italic text-accent">{accent}</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {events.length > 2 ? (
                <div className="flex items-center gap-1.5 mr-2">
                  <button
                    type="button"
                    onClick={() => scroll(-380)}
                    disabled={!canScrollLeft}
                    aria-label="Previous events"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-ink transition hover:bg-wash disabled:opacity-25 disabled:pointer-events-none shadow-xs"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scroll(380)}
                    disabled={!canScrollRight}
                    aria-label="Next events"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-ink transition hover:bg-wash disabled:opacity-25 disabled:pointer-events-none shadow-xs"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              ) : null}
              <Link
                href={seeMoreHref}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-accent transition group"
              >
                <span>View all</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </RevealOnScroll>

        {events.length ? (
          <div className="relative mt-8">
            <div
              ref={rowRef}
              className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar"
            >
              {events.map((event, index) => (
                <div key={event.id} className="snap-start shrink-0">
                  <UniformEventCard
                    event={event}
                    categories={categories}
                    hosts={hosts}
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <RevealOnScroll delay={120}>
            <p className="font-display mt-8 max-w-xl text-2xl italic leading-tight text-ink/65">
              {empty}
            </p>
          </RevealOnScroll>
        )}
      </div>
    </section>
  );
}
