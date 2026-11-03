import type { CSSProperties } from "react";
import { ArrowUpRight, Calendar, Clock, MapPin } from "lucide-react";
import { PreviewTrigger } from "@/components/preview/preview-provider";
import { TiltSurface } from "@/components/home/tilt-surface";
import { categoryById, eventStatusLabel, formatEventDate, getEffectiveEventStatus } from "@/lib/data/catalog";
import { categoryStyle } from "@/lib/home/category-style";
import { classifyMediaUrl } from "@/lib/media/url";
import type { CampusEvent, Category } from "@/lib/types";

export function BoardCard({
  event,
  categories,
  hosts,
  priority = false,
}: {
  event: CampusEvent;
  categories: Category[];
  hosts: readonly string[];
  tall?: boolean;
  priority?: boolean;
}) {
  const category = categoryById(categories, event.categoryId);
  const style = categoryStyle(category?.slug);
  const dateStr = formatEventDate(event.eventDate);
  const effectiveStatus = getEffectiveEventStatus(event);
  const status = event.isSample ? null : eventStatusLabel(effectiveStatus);
  const isLive = effectiveStatus === "ongoing" && !event.isSample;

  const validCover = event.coverImageUrl ? classifyMediaUrl(event.coverImageUrl, hosts) : null;
  const hasCover = Boolean(validCover?.ok);

  return (
    <div className="w-[300px] sm:w-[350px] md:w-[370px] shrink-0 h-[460px] flex flex-col">
      <TiltSurface
        className="h-full w-full"
        style={{ "--card-glow": style.glow } as CSSProperties}
      >
        <article className="group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border border-line/80 bg-white shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-line">
          <PreviewTrigger event={event} className="flex h-full w-full flex-col justify-between text-left">
            {/* Top Image Preview Frame */}
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
                      IISS Campus
                    </span>
                    <span className="text-[10px] font-mono text-muted/70">
                      ACTIVITY
                    </span>
                  </div>
                  <div className="relative z-10">
                    <span className="font-display text-2xl font-bold leading-tight text-ink/20 line-clamp-2">
                      {event.title}
                    </span>
                  </div>
                </div>
              )}

              {/* Overlaid Badges */}
              <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
                {category ? (
                  <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-xs backdrop-blur-md">
                    {category.name}
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

            {/* Body Content */}
            <div className="flex flex-1 flex-col justify-between p-5">
              <div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  {dateStr ? (
                    <span className="inline-flex items-center gap-1 font-medium text-accent">
                      <Calendar size={13} />
                      <span>{dateStr}</span>
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
                </div>

                <h3 className="font-display mt-2.5 line-clamp-2 text-xl font-medium leading-snug text-ink group-hover:text-accent transition duration-200">
                  {event.title}
                </h3>

                <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
                  {event.shortDescription}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs">
                {event.locationName ? (
                  <span className="inline-flex items-center gap-1 text-ink/80 truncate max-w-[200px]">
                    <MapPin size={12} className="text-muted shrink-0" />
                    <span className="truncate">{event.locationName}</span>
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
      </TiltSurface>
    </div>
  );
}
