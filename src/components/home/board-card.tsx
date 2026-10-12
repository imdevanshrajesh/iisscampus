import type { CSSProperties } from "react";
import { MediaFrame } from "@/components/media/media-frame";
import { PreviewTrigger } from "@/components/preview/preview-provider";
import { TiltSurface } from "@/components/home/tilt-surface";
import { categoryById, eventStatusLabel, formatEventDate } from "@/lib/data/catalog";
import { categoryStyle } from "@/lib/home/category-style";
import { classifyMediaUrl } from "@/lib/media/url";
import type { CampusEvent, Category } from "@/lib/types";

export function BoardCard({
  event,
  categories,
  hosts,
  tall = false,
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
  const date = formatEventDate(event.eventDate);
  const status = event.isSample ? null : eventStatusLabel(event.eventStatus);
  const pictured = Boolean(event.coverImageUrl && classifyMediaUrl(event.coverImageUrl, hosts).ok);
  const live = event.eventStatus === "ongoing" && !event.isSample;

  return (
    <TiltSurface
      className={`board-card ${tall ? "board-card--tall" : ""} ${live ? "board-card--live" : ""}`}
      style={{ "--card-glow": style.glow } as CSSProperties}
    >
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-line/80 bg-background">
        <PreviewTrigger event={event} className="flex h-full w-full flex-col overflow-hidden text-left">
          <div className={tall ? "min-h-[14rem]" : ""}>
            <MediaFrame
              url={event.coverImageUrl}
              alt={event.coverAlt}
              hosts={hosts}
              title={event.title}
              kicker={category?.name}
              priority={priority}
            />
          </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {category ? (
              <span className={`rounded-md px-2 py-1 text-[11px] font-medium tracking-wide ring-1 ${style.tag}`}>
                {category.name}
              </span>
            ) : null}
            {status ? (
              <span className={`text-[11px] uppercase tracking-[0.14em] ${live ? "text-accent" : "text-muted"}`}>
                {status}
              </span>
            ) : null}
            {date ? <span className="text-[11px] uppercase tracking-[0.14em] text-muted">{date}</span> : null}
          </div>
          <h3 className={pictured ? "text-balance font-display text-2xl leading-tight" : "sr-only"}>{event.title}</h3>
          <p className="text-sm leading-6 text-muted">{event.shortDescription}</p>
          {event.locationName ? <p className="text-sm text-ink">{event.locationName}</p> : null}
          <span className="mt-auto pt-1 text-sm font-medium text-accent">Preview</span>
        </div>
        </PreviewTrigger>
      </article>
    </TiltSurface>
  );
}
