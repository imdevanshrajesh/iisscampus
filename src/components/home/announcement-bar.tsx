"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState, type CSSProperties } from "react";
import { renderAnnouncementMessage } from "@/lib/announcements";
import type { Announcement, CampusEvent } from "@/lib/types";

const SPEED_PX_PER_SEC = 32;

function AnnouncementItems({
  items,
  eventById,
}: {
  items: Announcement[];
  eventById: Map<string, CampusEvent>;
}) {
  return (
    <>
      {items.map((item) => {
        const linked = item.eventId ? eventById.get(item.eventId) : null;
        const content = (
          <span className="announcement-bar__item text-sm">
            {renderAnnouncementMessage(item.message)}
            {linked ? <span className="ml-2 text-white/60">· {linked.title}</span> : null}
          </span>
        );
        return (
          <span key={item.id} className="inline-flex shrink-0 items-center gap-10 px-5">
            {linked ? (
              <Link href={`/events/${linked.slug}`} className="hover:underline">
                {content}
              </Link>
            ) : (
              content
            )}
            <span aria-hidden="true" className="text-white/35">
              •
            </span>
          </span>
        );
      })}
    </>
  );
}

export function AnnouncementBar({
  announcements,
  events,
}: {
  announcements: Announcement[];
  events: CampusEvent[];
}) {
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);
  const [durationSec, setDurationSec] = useState(20);
  const [shiftPx, setShiftPx] = useState(0);

  const active = announcements.filter((item) => item.enabled && item.message.trim());
  const eventById = new Map(events.map((event) => [event.id, event]));
  const onCouncil = pathname === "/council" || pathname.startsWith("/council/");

  const measure = useEffectEvent(() => {
    const group = groupRef.current;
    const bar = barRef.current;
    if (!group || !bar) return;

    const groupWidth = group.scrollWidth;
    const viewport = bar.clientWidth;
    if (groupWidth <= 0 || viewport <= 0) return;

    const needed = Math.max(2, Math.ceil((viewport * 2) / groupWidth) + 1);
    setCopies(needed);
    setShiftPx(groupWidth);
    setDurationSec(Math.max(10, groupWidth / SPEED_PX_PER_SEC));
  });

  useEffect(() => {
    if (onCouncil || !active.length) return;

    measure();
    const bar = barRef.current;
    const group = groupRef.current;
    if (!bar || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => measure());
    observer.observe(bar);
    if (group) observer.observe(group);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [active.length, onCouncil, announcements]);

  if (onCouncil || !active.length) return null;

  return (
    <div
      ref={barRef}
      className="announcement-bar border-b border-ink/15 bg-navy text-white"
      role="region"
      aria-label="Announcements"
    >
      <div
        className="announcement-bar__track"
        style={
          {
            "--marquee-shift": `-${shiftPx}px`,
            animationDuration: `${durationSec}s`,
            animationPlayState: shiftPx > 0 ? "running" : "paused",
          } as CSSProperties
        }
      >
        {Array.from({ length: copies }, (_, copyIndex) => (
          <div
            key={copyIndex}
            ref={copyIndex === 0 ? groupRef : undefined}
            className="announcement-bar__group"
            aria-hidden={copyIndex > 0 ? true : undefined}
          >
            <AnnouncementItems items={active} eventById={eventById} />
          </div>
        ))}
      </div>
    </div>
  );
}
