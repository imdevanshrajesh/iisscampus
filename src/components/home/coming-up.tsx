import Link from "next/link";
import type { CSSProperties } from "react";
import { RevealOnScroll } from "@/components/home/reveal-on-scroll";
import { TiltSurface } from "@/components/home/tilt-surface";
import { categoryById, formatEventDate } from "@/lib/data/catalog";
import { categoryStyle } from "@/lib/home/category-style";
import type { CampusEvent, Category } from "@/lib/types";

export function ComingUp({
  events,
  categories,
}: {
  events: CampusEvent[];
  categories: Category[];
}) {
  return (
    <section className="home-band">
      <div className="mx-auto max-w-[90rem] px-5 py-16 md:px-8 md:py-24">
        <RevealOnScroll>
          <div className="flex items-end justify-between gap-6 border-b border-ink pb-4">
            <h2 className="font-display text-[clamp(2.6rem,5vw,4.5rem)] leading-none text-ink">
              Coming <span className="italic">up</span>
            </h2>
            <p className="kicker hidden text-muted md:block">Next on the calendar</p>
          </div>
        </RevealOnScroll>
        {events.length ? (
          <div className="mt-8 grid gap-4 md:grid-cols-12">
            {events.slice(0, 5).map((event, index) => {
              const category = categoryById(categories, event.categoryId);
              const style = categoryStyle(category?.slug);
              const span =
                index === 0 ? "md:col-span-7 md:row-span-2" : index === 1 ? "md:col-span-5" : "md:col-span-4";
              return (
                <RevealOnScroll key={event.id} className={span} delay={index * 60}>
                  <TiltSurface className="h-full">
                    <Link
                      href={`/events/${event.slug}`}
                      className="coming-card group flex h-full flex-col justify-between rounded-2xl border border-line bg-background p-5"
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
                            {formatEventDate(event.eventDate) ?? "Date to be set"}
                          </span>
                        </div>
                        <h3 className="font-display mt-4 text-2xl leading-tight transition group-hover:text-accent md:text-3xl">
                          {event.title}
                        </h3>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-muted">{event.shortDescription}</p>
                    </Link>
                  </TiltSurface>
                </RevealOnScroll>
              );
            })}
          </div>
        ) : (
          <RevealOnScroll delay={120}>
            <p className="font-display mt-10 max-w-xl text-3xl italic leading-tight text-ink/70">
              Nothing dated yet. Upcoming activities land here the moment they are published.
            </p>
          </RevealOnScroll>
        )}
      </div>
    </section>
  );
}
