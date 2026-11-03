import Link from "next/link";
import { ArrowUpRight, Calendar, MapPin } from "lucide-react";
import { AmbientField } from "@/components/home/ambient-field";
import { PreviewTrigger } from "@/components/preview/preview-provider";
import { formatEventDate, getCampusTodayDate, isPastEvent, isUpcomingEvent } from "@/lib/data/catalog";
import type { CampusEvent } from "@/lib/types";

export function LiveNow({
  ongoing,
  upcoming,
}: {
  ongoing: CampusEvent[];
  upcoming: CampusEvent[];
}) {
  const today = getCampusTodayDate();
  const validLive = ongoing.filter((event) => !isPastEvent(event, today));
  const validUpcoming = upcoming.filter((event) => isUpcomingEvent(event, today));
  const live = validLive.length > 0;
  const next = validUpcoming[0] ?? null;

  return (
    <aside
      className={`live-panel relative overflow-hidden rounded-[2rem] border border-white/10 ${
        live ? "live-panel--active bg-[#0d1629]" : "live-panel--quiet bg-[#0d1424]"
      } p-6 sm:p-8 md:p-9 text-white shadow-2xl flex flex-col justify-between`}
    >
      {/* Background ambient lighting */}
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full ${
          live ? "bg-accent/25" : "bg-sky/15"
        } blur-[80px]`}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gold/15 blur-[80px]"
        aria-hidden="true"
      />

      <AmbientField live={live} />

      <div className="relative z-[1] flex flex-1 flex-col justify-between gap-6 min-h-[19rem] md:min-h-[24rem]">
        {/* Top Status Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span
                className={`inline-flex h-2 w-2 rounded-full ${
                  live ? "bg-accent animate-ping" : next ? "bg-gold" : "bg-white/40"
                }`}
              />
            </span>
            <span className="tracking-wider uppercase text-[11px] text-white/90">
              {live ? "Live Now" : next ? "Next on Stage" : "Campus Stage"}
            </span>
          </div>

          {next && formatEventDate(next.eventDate) ? (
            <span className="text-[11px] font-medium text-white/50 flex items-center gap-1">
              <Calendar size={12} className="text-gold" />
              {formatEventDate(next.eventDate)}
            </span>
          ) : (
            <span className="text-[11px] font-medium uppercase tracking-widest text-white/40">
              {live ? `${validLive.length} Active` : next ? "Upcoming" : "Standby"}
            </span>
          )}
        </div>

        {/* Center Content */}
        {live ? (
          <div className="space-y-4 my-auto">
            <ul className="space-y-4">
              {validLive.slice(0, 2).map((event) => (
                <li key={event.id}>
                  <PreviewTrigger event={event} className="group block w-full text-left">
                    <h3 className="font-display text-[clamp(2rem,3.8vw,3.2rem)] font-normal leading-[0.94] text-white transition-colors duration-300 group-hover:text-gold">
                      {event.title}
                    </h3>
                    {event.shortDescription ? (
                      <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-white/70 line-clamp-2">
                        {event.shortDescription}
                      </p>
                    ) : null}
                  </PreviewTrigger>
                </li>
              ))}
            </ul>
          </div>
        ) : next ? (
          <div className="space-y-4 my-auto">
            <PreviewTrigger event={next} className="group block text-left">
              <h3 className="font-display text-[clamp(1.8rem,3.4vw,2.8rem)] font-normal leading-tight text-white transition-colors duration-300 group-hover:text-gold">
                {next.title}
              </h3>

              {next.shortDescription ? (
                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-white/70 line-clamp-2">
                  {next.shortDescription}
                </p>
              ) : null}
            </PreviewTrigger>

            {/* Event Meta Badges & Action */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {next.locationName ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-white/80">
                    <MapPin size={11} className="text-gold" />
                    <span>{next.locationName}</span>
                  </span>
                ) : null}
              </div>

              <PreviewTrigger
                event={next}
                className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 border border-gold/30 px-3.5 py-1 text-xs font-semibold text-gold transition hover:bg-gold hover:text-navy"
              >
                <span>Event Brief</span>
                <ArrowUpRight size={12} />
              </PreviewTrigger>
            </div>
          </div>
        ) : (
          <div className="space-y-2 my-auto">
            <h3 className="font-display text-2xl text-white font-normal">
              Campus Stage
            </h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Fixtures and assemblies will appear here as they are scheduled by the department.
            </p>
          </div>
        )}

        {/* Footer Link */}
        <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs">
          <Link
            href="/events"
            className="group inline-flex items-center gap-1 text-white/70 transition hover:text-gold"
          >
            <span>Explore All Campus Activities</span>
            <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
