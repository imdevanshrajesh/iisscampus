import Link from "next/link";
import { renderAnnouncementMessage } from "@/lib/announcements";
import type { Announcement, CampusEvent } from "@/lib/types";

export function AnnouncementBar({
  announcements,
  events,
}: {
  announcements: Announcement[];
  events: CampusEvent[];
}) {
  const active = announcements.filter((item) => item.enabled && item.message.trim());
  if (!active.length) return null;

  const eventById = new Map(events.map((event) => [event.id, event]));

  return (
    <div className="announcement-bar border-b border-ink/15 bg-navy text-white" role="region" aria-label="Announcements">
      <div className="announcement-bar__track">
        {[...active, ...active].map((item, index) => {
          const linked = item.eventId ? eventById.get(item.eventId) : null;
          const content = (
            <span className="announcement-bar__item text-sm">
              {renderAnnouncementMessage(item.message)}
              {linked ? <span className="ml-2 text-white/60">· {linked.title}</span> : null}
            </span>
          );
          return (
            <span key={`${item.id}-${index}`} className="inline-flex items-center gap-6 px-6">
              {linked ? (
                <Link href={`/events/${linked.slug}`} className="hover:underline">
                  {content}
                </Link>
              ) : (
                content
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
