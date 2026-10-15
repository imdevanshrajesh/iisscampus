"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { ResourceCards } from "@/components/content/resource-cards";
import {
  formatAnnouncementDate,
  renderAnnouncementMessage,
} from "@/lib/announcements";
import type { Announcement, CampusEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

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
    if (initialOpenId) setOpenId(initialOpenId);
  }, [initialOpenId]);

  if (!announcements.length) {
    return (
      <p className="text-sm leading-6 text-muted">
        {compact ? "No announcements yet." : "Published announcements will appear here."}
      </p>
    );
  }

  return (
    <ul className="grid gap-3">
      {announcements.map((item) => {
        const open = openId === item.id;
        const linked = item.eventId ? eventById.get(item.eventId) : null;
        const date = formatAnnouncementDate(item.createdAt);
        const panelId = `${baseId}-${item.id}`;

        return (
          <li key={item.id} className="announcement-card">
            <button
              type="button"
              className={cn(
                "announcement-card__trigger",
                open && "announcement-card__trigger--open",
                compact && "announcement-card__trigger--compact",
              )}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
            >
              <span className="min-w-0 flex-1 text-left">
                <span className="block font-medium tracking-tight text-ink">{item.title}</span>
                {date ? (
                  <span className="mt-1 block text-xs uppercase tracking-[0.12em] text-muted">{date}</span>
                ) : null}
              </span>
              <ChevronDown
                aria-hidden="true"
                size={18}
                className={cn("shrink-0 text-muted transition-transform duration-300", open && "rotate-180")}
              />
            </button>
            {open ? (
              <div id={panelId} className="announcement-card__panel announcement-card__panel--open">
                <div className="announcement-card__panel-inner">
                  {item.body.trim() ? (
                    <div className="text-sm leading-7 text-ink/85">{renderAnnouncementMessage(item.body)}</div>
                  ) : null}
                  {linked ? (
                    <p className="mt-4 text-sm text-muted">
                      Related activity:{" "}
                      <Link href={`/events/${linked.slug}`} className="text-link text-accent">
                        {linked.title}
                      </Link>
                    </p>
                  ) : null}
                  {item.resources.length ? (
                    <div className="mt-2 [&_section]:border-t-0 [&_section]:py-0 [&_h2]:text-base">
                      <ResourceCards resources={item.resources} title="Downloads and links" />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
