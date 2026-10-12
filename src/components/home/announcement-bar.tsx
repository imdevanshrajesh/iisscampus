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
  copyKey,
}: {
  items: Announcement[];
  eventById: Map<string, CampusEvent>;
  copyKey: string;
}) {
  return (
    <>
      {items.map((item) => {
        const linked = item.eventId ? eventById.get(item.eventId) : null;
        const content = (
          <span className="announcement-bar__item text-sm whitespace-nowrap">
            {renderAnnouncementMessage(item.message)}
            {linked ? <span className="ml-2 text-white/60">· {linked.title}</span> : null}
          </span>
        );
        return (
          <span key={`${copyKey}-${item.id}`} className="inline-flex shrink-0 items-center gap-10 px-5 whitespace-nowrap">
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
  const unitRef = useRef<HTMLDivElement>(null);
  const [loop, setLoop] = useState({ repeat: 1, shift: 0, duration: 20 });

  const active = announcements.filter((item) => item.enabled && item.message.trim());
  const eventById = new Map(events.map((event) => [event.id, event]));
  const onCouncil = pathname === "/council" || pathname.startsWith("/council/");

  const measure = useEffectEvent(() => {
    const unit = unitRef.current;
    const bar = barRef.current;
    if (!unit || !bar) return;

    const unitWidth = Math.ceil(unit.getBoundingClientRect().width);
    const viewport = bar.clientWidth;
    if (unitWidth <= 0 || viewport <= 0) return;

    const repeat = Math.max(1, Math.ceil(viewport / unitWidth));
    const shift = unitWidth * repeat;
    const duration = Math.max(12, shift / SPEED_PX_PER_SEC);
    setLoop((current) =>
      current.repeat === repeat && current.shift === shift && current.duration === duration
        ? current
        : { repeat, shift, duration },
    );
  });

  useEffect(() => {
    if (onCouncil || !active.length) return;

    measure();
    const bar = barRef.current;
    const unit = unitRef.current;
    if (!bar || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => measure());
    observer.observe(bar);
    if (unit) observer.observe(unit);
    window.addEventListener("resize", measure);
    const fonts = document.fonts;
    fonts?.ready.then(() => measure()).catch(() => undefined);
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
      <div ref={unitRef} className="announcement-bar__measure" aria-hidden="true">
        <AnnouncementItems items={active} eventById={eventById} copyKey="measure" />
      </div>
      <div
        key={loop.shift}
        className="announcement-bar__track"
        style={
          {
            "--marquee-shift": `-${loop.shift}px`,
            animationDuration: `${loop.duration}s`,
            animationPlayState: loop.shift > 0 ? "running" : "paused",
          } as CSSProperties
        }
      >
        {[0, 1].map((half) => (
          <div key={half} className="announcement-bar__group" aria-hidden={half === 1 ? true : undefined}>
            {Array.from({ length: loop.repeat }, (_, index) => (
              <AnnouncementItems
                key={`${half}-${index}`}
                items={active}
                eventById={eventById}
                copyKey={`${half}-${index}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
