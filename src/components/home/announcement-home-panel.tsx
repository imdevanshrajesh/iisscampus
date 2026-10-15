import Link from "next/link";
import { formatAnnouncementDate } from "@/lib/announcements";
import type { Announcement } from "@/lib/types";

const previewLimit = 4;

export function AnnouncementHomePanel({ announcements }: { announcements: Announcement[] }) {
  const preview = announcements.slice(0, previewLimit);

  return (
    <aside className="announcement-panel" aria-label="Announcements">
      <div className="flex min-h-[18rem] flex-col gap-6 md:min-h-[24rem]">
        <p className="kicker text-accent">Need to know</p>

        {preview.length ? (
          <ul className="grid min-h-0 flex-1 gap-2 overflow-y-auto pr-1">
            {preview.map((item) => {
              const date = formatAnnouncementDate(item.createdAt);
              return (
                <li key={item.id}>
                  <Link
                    href={`/announcements?open=${item.id}`}
                    className="announcement-panel__row group block rounded-xl border border-line bg-background/80 px-4 py-3 transition-colors duration-300 hover:border-accent/50"
                  >
                    <span className="block font-medium tracking-tight text-ink group-hover:text-accent">
                      {item.title}
                    </span>
                    {date ? <span className="mt-1 block text-xs text-muted">{date}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="font-display max-w-[16ch] text-3xl leading-tight text-ink/70">
            Nothing posted <span className="italic text-accent">yet.</span>
          </p>
        )}

        {announcements.length ? (
          <Link href="/announcements" className="text-link text-sm text-ink/80">
            View more
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
