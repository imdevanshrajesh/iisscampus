import { ArrowUpRight, Calendar, Clock, MapPin, Sparkles } from "lucide-react";
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
  const isLive = event.eventStatus === "ongoing" && !event.isSample;

  const validCover = event.coverImageUrl ? classifyMediaUrl(event.coverImageUrl, hosts) : null;
  const hasCover = Boolean(validCover?.ok);

  const listingLabel =
    event.listing === "external" ? "Elsewhere" : event.listing === "competition" ? "Competition" : null;

  return (
    <article className="group flex h-full min-h-[440px] flex-col justify-between overflow-hidden rounded-2xl border border-line/80 bg-white shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-line">
      <PreviewTrigger event={event} className="flex h-full w-full flex-col justify-between text-left">
        {/* Uniform Aspect Ratio Cover Frame */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-wash/60 select-none">
          {hasCover && validCover?.ok ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={validCover.url}
              alt={event.coverAlt || event.title}
              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-108"
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div className="relative flex h-full w-full flex-col justify-between p-5 bg-gradient-to-br from-wash via-surface to-line/50">
              <div className="relative z-10 flex items-center justify-between">
                <span className="font-display text-xs italic tracking-widest text-accent uppercase">
                  {listingLabel || "IISS Campus"}
                </span>
                <div className="h-8 w-8 rounded-full border border-ink/10 bg-white/60 backdrop-blur-xs flex items-center justify-center text-ink/70">
                  <Sparkles size={14} />
                </div>
              </div>
              <div className="relative z-10">
                <span className="font-display text-xl font-bold leading-tight text-ink/25 line-clamp-2">
                  {event.title}
                </span>
              </div>
            </div>
          )}

          {/* Overlaid Badges */}
          <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
            {primary ? (
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-xs backdrop-blur-md">
                {primary.name}
              </span>
            ) : <span />}

            {isLive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-white shadow-xs animate-pulse">
                <span className="h-2 w-2 rounded-full bg-white" />
                <span>Live</span>
              </span>
            ) : status ? (
              <span className="rounded-full bg-navy/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-xs backdrop-blur-md">
                {status}
              </span>
            ) : null}
          </div>
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              {when ? (
                <span className="inline-flex items-center gap-1 font-medium text-accent">
                  <Calendar size={13} />
                  <span>{when}</span>
                </span>
              ) : (
                <span>Date to be announced</span>
              )}
              {event.startTime ? (
                <span className="inline-flex items-center gap-1 text-muted">
                  <Clock size={12} />
                  <span>{event.startTime}</span>
                </span>
              ) : null}
              {categoryNames.length > 1 ? (
                <span className="text-muted/70">· {categoryNames.slice(1).join(", ")}</span>
              ) : null}
            </div>

            {/* Title */}
            <h3 className="font-display mt-2.5 line-clamp-2 text-xl font-medium leading-snug text-ink group-hover:text-accent transition duration-200">
              {event.title}
            </h3>

            {/* Description */}
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
              {event.shortDescription}
            </p>
          </div>

          {/* Location / Host & Action */}
          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs">
            {event.locationName || event.hostName ? (
              <span className="inline-flex items-center gap-1 text-ink/80 truncate max-w-[200px]">
                <MapPin size={12} className="text-muted shrink-0" />
                <span className="truncate">
                  {[event.hostName ? `Hosted by ${event.hostName}` : null, event.locationName]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            ) : (
              <span className="text-muted">Campus Event</span>
            )}

            <span className="inline-flex items-center gap-1 font-semibold text-accent group-hover:translate-x-0.5 transition-transform shrink-0">
              <span>Preview</span>
              <ArrowUpRight size={14} />
            </span>
          </div>
        </div>
      </PreviewTrigger>
    </article>
  );
}
