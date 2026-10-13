import { MediaFrame } from "@/components/media/media-frame";
import { PreviewTrigger } from "@/components/preview/preview-provider";
import { categoryById, eventCategoryIds, eventStatusLabel, formatEventDate } from "@/lib/data/catalog";
import { classifyMediaUrl } from "@/lib/media/url";
import type { CampusEvent, Category } from "@/lib/types";

export function EventCard({
  event,
  categories,
  hosts,
  priority = false,
}: {
  event: CampusEvent;
  categories: Category[];
  hosts: readonly string[];
  priority?: boolean;
}) {
  const categoryNames = eventCategoryIds(event)
    .map((id) => categoryById(categories, id)?.name)
    .filter(Boolean);
  const primary = categoryById(categories, event.categoryId);
  const date = formatEventDate(event.eventDate);
  const end = formatEventDate(event.endDate);
  const when = date && end && end !== date ? `${date} – ${end}` : date;
  const status = event.isSample ? null : eventStatusLabel(event.eventStatus);
  const pictured = Boolean(event.coverImageUrl && classifyMediaUrl(event.coverImageUrl, hosts).ok);

  const listingLabel =
    event.listing === "external" ? "Elsewhere" : event.listing === "competition" ? "Competition" : null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-background shadow-[0_1px_0_rgba(20,27,56,0.04)]">
      <PreviewTrigger event={event} className="flex h-full w-full flex-col text-left">
        <MediaFrame
          url={event.coverImageUrl}
          alt={event.coverAlt}
          hosts={hosts}
          title={event.title}
          kicker={primary?.name}
          priority={priority}
        />
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.14em] text-muted">
            {listingLabel ? <span>{listingLabel}</span> : null}
            {categoryNames.length ? <span>{categoryNames.join(" · ")}</span> : null}
            {when ? <span>{when}</span> : null}
            {event.isSample ? <span>Sample</span> : null}
            {status ? <span className={event.eventStatus === "ongoing" ? "text-accent" : ""}>{status}</span> : null}
          </div>
          <h3 className={pictured ? "text-balance text-xl font-medium leading-snug" : "sr-only"}>{event.title}</h3>
          <p className="text-sm leading-6 text-muted">{event.shortDescription}</p>
          {event.listing === "external" && event.hostName ? (
            <p className="text-sm text-ink">Hosted by {event.hostName}</p>
          ) : null}
          {event.locationName ? <p className="text-sm text-ink">{event.locationName}</p> : null}
          <span className="mt-auto pt-2 text-sm font-medium text-accent">Preview</span>
        </div>
      </PreviewTrigger>
    </article>
  );
}
