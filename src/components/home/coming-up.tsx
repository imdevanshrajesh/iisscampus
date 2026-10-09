import Link from "next/link";
import type { CSSProperties } from "react";
import { RevealOnScroll } from "@/components/home/reveal-on-scroll";
import { TiltSurface } from "@/components/home/tilt-surface";
import { categoryById, formatEventDate } from "@/lib/data/catalog";
import { categoryStyle } from "@/lib/home/category-style";
import type { CampusEvent, Category } from "@/lib/types";

const visibleCount = 4;

export function ComingUp({
  events,
  categories,
  heading,
  accent,
  kicker,
  seeMoreHref,
  empty,
}: {
  events: CampusEvent[];
  categories: Category[];
  heading: string;
  accent: string;
  kicker: string;
  seeMoreHref: string;
  empty?: string;
}) {
  if (!events.length && !empty) return null;
  const visible = events.slice(0, visibleCount);
  const more = events.length > visibleCount;

  return (
    <section className="home-band">
      <div className="mx-auto max-w-[90rem] px-5 py-16 md:px-8 md:py-24">
        <RevealOnScroll>
          <div className="flex items-end justify-between gap-4 border-b border-ink pb-4">
            <h2 className="font-display text-[clamp(2.2rem,5vw,4.5rem)] leading-none text-ink">
              {heading} <span className="italic">{accent}</span>
            </h2>
            <div className="flex flex-col items-end gap-2 text-right">
              <p className="kicker hidden text-muted sm:block">{kicker}</p>
              {more ? (
                <Link href={seeMoreHref} className="text-link text-sm text-ink">
                  See more
                </Link>
              ) : null}
            </div>
          </div>
        </RevealOnScroll>
        {visible.length ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {visible.map((event, index) => {
              const category = categoryById(categories, event.categoryId);
              const style = categoryStyle(category?.slug);
              return (
                <RevealOnScroll key={event.id} delay={index * 60}>
                  <TiltSurface className="h-full">
                    <Link
                      href={`/events/${event.slug}`}
                      className="coming-card group flex h-full min-h-44 flex-col justify-between rounded-2xl border border-line bg-background p-5"
                      style={{ "--card-glow": style.glow } as CSSProperties}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          {category ? (
                            <span className={`rounded-md px-2 py-1 text-[11px] font-medium ring-1 ${style.tag}`}>
                              {category.name}
                            </span>
                          ) : null}
                          <span className="text-xs text-muted">
                            {formatEventDate(event.endDate ?? event.eventDate) ?? "Date to be set"}
                          </span>
                        </div>
                        <h3 className="font-display mt-4 text-2xl leading-tight transition group-hover:text-accent">
                          {event.title}
                        </h3>
                      </div>
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">{event.shortDescription}</p>
                    </Link>
                  </TiltSurface>
                </RevealOnScroll>
              );
            })}
          </div>
        ) : (
          <RevealOnScroll delay={120}>
            <p className="font-display mt-10 max-w-xl text-3xl italic leading-tight text-ink/70">{empty}</p>
          </RevealOnScroll>
        )}
      </div>
    </section>
  );
}
