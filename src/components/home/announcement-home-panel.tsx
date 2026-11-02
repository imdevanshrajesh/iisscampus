import Link from "next/link";
import { ArrowUpRight, Bell, ChevronRight } from "lucide-react";
import { formatAnnouncementDate } from "@/lib/announcements";
import type { Announcement } from "@/lib/types";

const previewLimit = 4;

export function AnnouncementHomePanel({ announcements }: { announcements: Announcement[] }) {
  const preview = announcements.slice(0, previewLimit);

  return (
    <aside
      className="announcement-panel relative overflow-hidden rounded-[2rem] border border-line/80 bg-white/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col justify-between"
      aria-label="Announcements"
    >
      {/* Subtle Warm Gradient Accent */}
      <div
        className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-accent/8 blur-[50px]"
        aria-hidden="true"
      />

      <div className="flex flex-1 flex-col justify-between gap-6 min-h-[19rem] md:min-h-[24rem]">
        {/* Header with Priority Pill */}
        <div className="flex items-center justify-between border-b border-line/60 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Bell size={14} />
            </span>
            <div>
              <p className="kicker text-accent font-semibold tracking-wider text-[11px] uppercase">
                Need to know
              </p>
              <h3 className="font-display text-xl text-ink font-semibold">Campus Notices</h3>
            </div>
          </div>

          {preview.length > 0 ? (
            <span className="rounded-full bg-navy/5 px-2.5 py-1 text-[11px] font-bold text-navy">
              {announcements.length} {announcements.length === 1 ? "Notice" : "Notices"}
            </span>
          ) : null}
        </div>

        {/* Notices Stream */}
        {preview.length ? (
          <ul className="grid min-h-0 flex-1 gap-2.5 overflow-y-auto pr-1">
            {preview.map((item, idx) => {
              const date = formatAnnouncementDate(item.createdAt);
              return (
                <li key={item.id}>
                  <Link
                    href={`/announcements?open=${item.id}`}
                    className="group relative flex items-center justify-between gap-3 rounded-xl border border-line/70 bg-wash/30 p-3.5 transition duration-200 hover:border-accent/50 hover:bg-white hover:shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {idx === 0 ? (
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                            Latest
                          </span>
                        ) : null}
                        {date ? <span className="text-[11px] text-muted">{date}</span> : null}
                      </div>
                      <span className="mt-1 block font-medium tracking-tight text-ink text-sm group-hover:text-accent transition-colors line-clamp-2">
                        {item.title}
                      </span>
                    </div>

                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-muted/60 group-hover:text-accent group-hover:translate-x-0.5 transition shrink-0">
                      <ChevronRight size={16} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-line bg-wash/20">
            <p className="font-display text-2xl leading-tight text-ink/70">
              Nothing posted <span className="italic text-accent">yet.</span>
            </p>
            <p className="mt-1.5 text-xs text-muted max-w-xs">
              Important circulars, scheduling directives, and campus memos will appear here.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-line/60 pt-4 flex items-center justify-between text-xs">
          {announcements.length ? (
            <Link
              href="/announcements"
              className="group inline-flex items-center gap-1 font-semibold text-accent hover:text-accent-deep transition"
            >
              <span>View All Circulars & Bulletins</span>
              <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          ) : (
            <span className="text-muted text-[11px]">Notice Desk</span>
          )}

          <span className="text-[11px] text-muted">Council Broadcast</span>
        </div>
      </div>
    </aside>
  );
}
