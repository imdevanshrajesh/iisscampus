import Link from "next/link";
import { AmbientField } from "@/components/home/ambient-field";
import { PreviewTrigger } from "@/components/preview/preview-provider";
import { formatEventDate } from "@/lib/data/catalog";
import type { CampusEvent } from "@/lib/types";

export function LiveNow({
  ongoing,
  upcoming,
}: {
  ongoing: CampusEvent[];
  upcoming: CampusEvent[];
}) {
  const live = ongoing.length > 0;
  const next = upcoming[0] ?? null;

  return (
    <aside className={`live-panel ${live ? "live-panel--active" : "live-panel--quiet"}`}>
      {live ? <AmbientField live /> : null}
      <div className="relative z-[1] flex min-h-[18rem] flex-col justify-between gap-10 md:min-h-[24rem]">
        <p className="kicker flex items-center gap-3 text-white/70">
          <span className={`status-dot ${live ? "status-dot--live" : ""}`} aria-hidden="true" />
          {live ? "Live now" : "All quiet"}
        </p>
        {live ? (
          <ul className="space-y-6">
            {ongoing.slice(0, 2).map((event) => (
              <li key={event.id}>
                <PreviewTrigger event={event} className="group block w-full text-left">
                  <span className="font-display text-[clamp(2.4rem,5vw,4.5rem)] leading-[0.9] text-white transition-colors duration-500 group-hover:text-gold">
                    {event.title}
                  </span>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">{event.shortDescription}</p>
                </PreviewTrigger>
              </li>
            ))}
          </ul>
        ) : (
          <div>
            <p className="font-display max-w-[13ch] text-[clamp(3rem,6.2vw,5.8rem)] leading-[0.86] text-white">
              Nothing on stage <span className="italic text-gold">right now.</span>
            </p>
            <div className="mt-6 max-w-md text-sm leading-6 text-white/65 md:text-base">
              {next ? (
                <>
                  Next up is{" "}
                  <PreviewTrigger event={next} className="text-link text-white">
                    {next.title}
                  </PreviewTrigger>
                  {formatEventDate(next.eventDate) ? ` · ${formatEventDate(next.eventDate)}` : ""}.
                </>
              ) : (
                <>When something is marked as ongoing, it shows up here first.</>
              )}
            </div>
          </div>
        )}
        <Link href="/events" className="text-link text-sm text-white/80">
          Events
        </Link>
      </div>
    </aside>
  );
}
