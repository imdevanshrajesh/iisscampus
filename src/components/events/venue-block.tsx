import { mapEmbedSrc } from "@/lib/media/map";
import { classifyNavigationUrl } from "@/lib/media/url";
import type { CampusEvent } from "@/lib/types";

export function VenueBlock({ event, compact = false }: { event: CampusEvent; compact?: boolean }) {
  const map = classifyNavigationUrl(event.locationMapUrl);
  const embed = mapEmbedSrc(event.locationName, map.ok ? map.url : null);
  if (!event.locationName && !map.ok && !embed) return null;

  return (
    <div className={compact ? "mt-5" : "mt-8 max-w-xl"}>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Venue</p>
      {event.locationName ? <p className="mt-2 text-base text-ink">{event.locationName}</p> : null}
      {map.ok ? (
        <a href={map.url} className="mt-2 inline-flex text-sm text-accent" rel="noopener noreferrer" target="_blank">
          Open map
        </a>
      ) : null}
      {embed ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-line">
          <iframe
            title={event.locationName ? `Map of ${event.locationName}` : "Location map"}
            src={embed}
            className={compact ? "aspect-[16/10] w-full" : "aspect-[16/9] w-full"}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}
    </div>
  );
}
