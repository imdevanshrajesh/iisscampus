import { AnnouncementList } from "@/components/announcements/announcement-list";
import type { Announcement, CampusEvent } from "@/lib/types";

export function AnnouncementsPage({
  announcements,
  events,
  initialOpenId,
}: {
  announcements: Announcement[];
  events: CampusEvent[];
  initialOpenId?: string | null;
}) {
  return (
    <div className="mx-auto max-w-[90rem] px-5 py-10 md:px-8 md:py-16">
      <p className="kicker text-accent">Campus</p>
      <h1 className="font-display mt-4 max-w-[14ch] text-[clamp(3rem,7vw,6rem)] leading-[0.88] text-ink">
        Announce<span className="italic">ments</span>
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-ink/80">
        Updates from the boys&apos; student council and school activities. Newest first.
      </p>
      <div className="mt-12 max-w-3xl">
        <AnnouncementList announcements={announcements} events={events} initialOpenId={initialOpenId} />
      </div>
    </div>
  );
}
