import Link from "next/link";
import { MediaFrame } from "@/components/media/media-frame";
import { categoryById, formatEventDate } from "@/lib/data/catalog";
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
  const category = categoryById(categories, event.categoryId);
  const date = formatEventDate(event.eventDate);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-background shadow-[0_1px_0_rgba(20,27,56,0.04)]">
      <Link href={`/events/${event.slug}`} className="block">
        <MediaFrame
          url={event.coverImageUrl}
          alt={event.coverAlt}
          hosts={hosts}
          title={event.title}
          kicker={category?.name}
          priority={priority}
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.14em] text-muted">
          {category ? <span>{category.name}</span> : null}
          {date ? <span>{date}</span> : null}
          {event.isSample ? <span>Sample</span> : null}
          {event.eventStatus && !event.isSample ? <span>{event.eventStatus}</span> : null}
        </div>
        <h3 className="text-xl font-medium tracking-tight">
          <Link href={`/events/${event.slug}`} className="transition-colors group-hover:text-accent">
            {event.title}
          </Link>
        </h3>
        <p className="text-sm leading-6 text-muted">{event.shortDescription}</p>
        <Link href={`/events/${event.slug}`} className="mt-auto pt-2 text-sm font-medium text-accent">
          View event
        </Link>
      </div>
    </article>
  );
}
