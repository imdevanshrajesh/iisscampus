import Link from "next/link";
import { ArrowUpRight, Calendar, Newspaper, MapPin } from "lucide-react";
import { RevealOnScroll } from "@/components/home/reveal-on-scroll";
import { AddToCalendarButton } from "@/components/events/add-to-calendar-button";
import { PreviewTrigger } from "@/components/preview/preview-provider";
import { formatAnnouncementDate } from "@/lib/announcements";
import { formatEventDate, getCampusTodayDate, isUpcomingEvent } from "@/lib/data/catalog";
import type { Announcement, CampusEvent } from "@/lib/types";

function noticeTag(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("exam") || lower.includes("academic") || lower.includes("study")) return "Academic";
  if (lower.includes("sport") || lower.includes("league") || lower.includes("match")) return "Athletics";
  if (lower.includes("council") || lower.includes("lead") || lower.includes("prefect")) return "Leadership";
  if (lower.includes("science") || lower.includes("stem") || lower.includes("robot")) return "Innovation";
  if (lower.includes("uniform") || lower.includes("protocol") || lower.includes("rule")) return "Campus Code";
  return "Notice";
}

export function EmsHighlights({
  upcomingEvents = [],
  announcements = [],
}: {
  upcomingEvents: CampusEvent[];
  announcements?: Announcement[];
}) {
  const today = getCampusTodayDate();
  const validUpcoming = upcomingEvents.filter((event) => isUpcomingEvent(event, today));
  const topEvents = validUpcoming.slice(0, 3);
  const topNotices = announcements.slice(0, 3);

  return (
    <section className="mx-auto max-w-[90rem] px-5 py-16 md:px-8 md:py-24">
      {/* Section Header */}
      <RevealOnScroll>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ink/80 pb-5">
          <div>
            <p className="kicker text-muted text-xs uppercase tracking-widest font-semibold">
              Need to Know
            </p>
            <h2 className="font-display text-[clamp(2.4rem,4.8vw,4.2rem)] leading-none text-ink mt-1">
              Highlights &amp; <span className="italic text-accent">The Latest</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-ink shadow-xs transition hover:border-navy hover:bg-wash"
            >
              <Calendar size={14} className="text-accent" />
              <span>VIEW FULL CALENDAR</span>
              <ArrowUpRight size={13} />
            </Link>

            <Link
              href="/announcements"
              className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-navy/90"
            >
              <span>VIEW ALL NOTICES</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </RevealOnScroll>

      {/* Main Grid: Upcoming Events (Left) vs Campus Notices (Right) */}
      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left Column: UPCOMING EVENTS Fast Agenda with Add to Calendar */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-line/60 text-xs font-semibold uppercase tracking-wider text-muted">
              <span className="flex items-center gap-1.5 text-accent font-semibold">
                <Calendar size={14} /> UPCOMING EVENTS
              </span>
              <Link href="/events" className="text-accent hover:underline">
                VIEW FULL CALENDAR
              </Link>
            </div>

            {topEvents.length ? (
              <div className="mt-4 space-y-3">
                {topEvents.map((event, idx) => {
                  const dateStr = formatEventDate(event.eventDate);
                  return (
                    <RevealOnScroll key={event.id} delay={idx * 50}>
                      <div className="rounded-2xl border border-line/80 bg-white/95 p-4 shadow-xs transition hover:border-navy hover:shadow-md">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-accent flex items-center gap-1">
                            <Calendar size={12} />
                            {dateStr || "Upcoming Date"}
                          </span>

                          <AddToCalendarButton event={event} compact />
                        </div>

                        <PreviewTrigger event={event} className="block text-left mt-2 group">
                          <h4 className="font-display text-base font-medium text-ink group-hover:text-accent transition">
                            {event.title}
                          </h4>
                        </PreviewTrigger>

                        {event.locationName ? (
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                            <MapPin size={11} className="text-accent/80" />
                            <span>{event.locationName}</span>
                          </p>
                        ) : null}

                        {event.shortDescription ? (
                          <p className="mt-2 line-clamp-2 text-xs text-muted/90 leading-relaxed">
                            {event.shortDescription}
                          </p>
                        ) : null}
                      </div>
                    </RevealOnScroll>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-line bg-wash/30 p-8 text-center text-sm text-muted">
                No immediate upcoming events scheduled. View the full campus calendar for future terms.
              </div>
            )}
          </div>

          {/* Expand Button taking to Events page */}
          <div className="mt-4 pt-2">
            <Link
              href="/events"
              className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-line/80 bg-white/80 py-3 text-xs font-semibold text-ink shadow-xs transition hover:border-navy hover:bg-white hover:shadow-sm"
            >
              <span>
                {validUpcoming.length
                  ? `VIEW ALL UPCOMING EVENTS (${validUpcoming.length})`
                  : "EXPLORE ALL CAMPUS EVENTS"}
              </span>
              <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>

        {/* Right Column: Campus Notices Feed */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-line/60 text-xs font-semibold uppercase tracking-wider text-muted">
              <span className="flex items-center gap-1.5 text-navy font-semibold">
                <Newspaper size={14} /> Campus Notices &amp; Dispatches
              </span>
              <Link href="/announcements" className="text-accent hover:underline">
                All Notices
              </Link>
            </div>

            <div className="mt-4 space-y-3.5">
              {topNotices.length > 0 ? (
                topNotices.map((notice, index) => {
                  const date = formatAnnouncementDate(notice.createdAt);
                  const tag = noticeTag(notice.title);
                  return (
                    <RevealOnScroll key={notice.id} delay={index * 40}>
                      <Link
                        href={`/announcements?open=${notice.id}`}
                        className="group block rounded-2xl border border-line/80 bg-white/95 p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="rounded-full bg-navy/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
                            {tag}
                          </span>
                          {date ? <span className="text-muted text-[11px]">{date}</span> : null}
                        </div>

                        <h3 className="font-display mt-2.5 text-lg font-medium leading-snug text-ink transition-colors group-hover:text-accent">
                          {notice.title}
                        </h3>

                        {notice.body ? (
                          <p className="mt-2 text-xs leading-5 text-muted line-clamp-2">
                            {notice.body}
                          </p>
                        ) : null}

                        <div className="mt-3 pt-2.5 border-t border-line/50 flex items-center justify-between text-xs font-medium text-accent">
                          <span>Read Full Bulletin</span>
                          <ArrowUpRight
                            size={13}
                            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                          />
                        </div>
                      </Link>
                    </RevealOnScroll>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-line bg-wash/30 p-8 text-center text-sm text-muted">
                  No notices published yet. Visit the notices bulletin board for historical circulars.
                </div>
              )}
            </div>
          </div>

          {/* Expand Button taking to Notice page */}
          <div className="mt-4 pt-2">
            <Link
              href="/announcements"
              className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-line/80 bg-white/80 py-3 text-xs font-semibold text-ink shadow-xs transition hover:border-accent hover:bg-white hover:shadow-sm"
            >
              <span>VIEW ALL CAMPUS NOTICES ({announcements.length || "ALL"})</span>
              <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
