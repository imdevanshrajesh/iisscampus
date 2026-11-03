"use client";

import Link from "next/link";
import { ChevronDown, Calendar, FileText, ArrowRight, Paperclip } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { ResourceCards } from "@/components/content/resource-cards";
import {
  formatAnnouncementDate,
  renderAnnouncementMessage,
} from "@/lib/announcements";
import type { Announcement, CampusEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

function noticeTag(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("exam") || lower.includes("academic") || lower.includes("study")) return "Academic";
  if (lower.includes("sport") || lower.includes("league") || lower.includes("match")) return "Athletics";
  if (lower.includes("council") || lower.includes("lead") || lower.includes("prefect")) return "Leadership";
  if (lower.includes("science") || lower.includes("stem") || lower.includes("robot")) return "Innovation";
  if (lower.includes("uniform") || lower.includes("protocol") || lower.includes("rule")) return "Campus Code";
  return "Directive";
}

export function AnnouncementList({
  announcements,
  events,
  initialOpenId,
  compact = false,
}: {
  announcements: Announcement[];
  events: CampusEvent[];
  initialOpenId?: string | null;
  compact?: boolean;
}) {
  const baseId = useId();
  const eventById = new Map(events.map((event) => [event.id, event]));
  const [openId, setOpenId] = useState<string | null>(initialOpenId ?? null);

  useEffect(() => {
    if (initialOpenId) {
      setOpenId(initialOpenId);
      const el = document.getElementById(`announcement-${initialOpenId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [initialOpenId]);

  if (!announcements.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-wash/30 p-8 text-center text-sm text-muted">
        {compact ? "No announcements yet." : "No matching campus notices found."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((item, idx) => {
        const open = openId === item.id;
        const linked = item.eventId ? eventById.get(item.eventId) : null;
        const date = formatAnnouncementDate(item.createdAt);
        const panelId = `${baseId}-${item.id}`;
        const tag = noticeTag(item.title);

        return (
          <article
            key={item.id}
            id={`announcement-${item.id}`}
            className={cn(
              "group rounded-2xl border border-line/80 bg-white/95 p-5 sm:p-6 shadow-xs transition duration-200 hover:border-navy/40 hover:shadow-md",
              open && "border-accent ring-1 ring-accent/20 bg-white",
            )}
          >
            {/* Meta Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-navy/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
                  {tag}
                </span>
                {idx === 0 ? (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                    Newest
                  </span>
                ) : null}
              </div>

              {date ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-muted">
                  <Calendar size={12} />
                  {date}
                </span>
              ) : null}
            </div>

            {/* Title & Interactive Toggle */}
            <button
              type="button"
              className="mt-3 flex w-full items-start justify-between gap-3 text-left focus:outline-hidden"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
            >
              <h2 className="font-display text-lg sm:text-xl font-medium leading-snug text-ink group-hover:text-accent transition-colors">
                {item.title}
              </h2>

              <span
                className={cn(
                  "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-wash/50 text-muted transition duration-200 group-hover:border-accent group-hover:text-accent",
                  open && "rotate-180 border-accent bg-accent/10 text-accent",
                )}
                aria-hidden="true"
              >
                <ChevronDown size={15} />
              </span>
            </button>

            {/* Excerpt / Body */}
            {item.body.trim() ? (
              <div
                className={cn(
                  "mt-2 text-xs sm:text-sm leading-relaxed text-muted/90 transition-all",
                  !open && "line-clamp-2",
                )}
              >
                {open ? (
                  <div className="space-y-3 pt-2 text-ink/85 border-t border-line/60">
                    {renderAnnouncementMessage(item.body)}
                  </div>
                ) : (
                  <p>{item.body}</p>
                )}
              </div>
            ) : null}

            {/* Expanded Section Details */}
            {open ? (
              <div id={panelId} className="mt-4 pt-3 space-y-4">
                {linked ? (
                  <div className="rounded-xl border border-line/60 bg-wash/30 p-3 text-xs flex items-center justify-between gap-2">
                    <span className="text-muted flex items-center gap-1.5">
                      <FileText size={14} className="text-accent" />
                      Associated Campus Activity:
                    </span>
                    <Link
                      href={`/events/${linked.slug}`}
                      className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
                    >
                      <span>{linked.title}</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                ) : null}

                {item.resources.length ? (
                  <div className="pt-2">
                    <ResourceCards resources={item.resources} title="Official Directives & Downloads" />
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Action Bar */}
            <div className="mt-3.5 pt-3 border-t border-line/50 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
                className="font-semibold text-accent hover:underline flex items-center gap-1"
              >
                <span>{open ? "Collapse Directive" : "Read Full Directive"}</span>
                <ChevronDown size={13} className={cn("transition-transform", open && "rotate-180")} />
              </button>

              {item.resources.length > 0 && !open ? (
                <span className="text-[11px] text-muted flex items-center gap-1">
                  <Paperclip className="h-3 w-3 shrink-0" />
                  <span>
                    {item.resources.length} {item.resources.length === 1 ? "Attachment" : "Attachments"}
                  </span>
                </span>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
