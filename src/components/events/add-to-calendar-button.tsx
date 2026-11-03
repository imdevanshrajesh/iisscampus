"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarPlus, Check, ChevronDown, Download, ExternalLink } from "lucide-react";
import { generateGoogleCalendarUrl, generateICSDataUri } from "@/lib/events/calendar-sync";
import type { CampusEvent } from "@/lib/types";

export function AddToCalendarButton({
  event,
  compact = false,
}: {
  event: CampusEvent;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const googleUrl = generateGoogleCalendarUrl(event);
  const icsUri = generateICSDataUri(event);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition duration-200 ${
          compact
            ? "border-line bg-white/80 px-2.5 py-1 text-xs text-ink hover:border-navy hover:bg-white shadow-2xs"
            : "border-line bg-white px-3 py-1.5 text-xs text-navy hover:border-accent hover:text-accent shadow-xs"
        }`}
        aria-label="Add to Calendar"
      >
        <CalendarPlus size={13} className="shrink-0 text-accent" />
        <span>Add to Cal</span>
        <ChevronDown size={11} className={`opacity-60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-1.5 w-48 origin-top-right rounded-xl border border-line bg-white dark:bg-black p-1.5 shadow-xl ring-1 ring-black/10 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            Sync with Calendar
          </div>

          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-ink dark:text-white hover:bg-wash/70 dark:hover:bg-zinc-900 hover:text-navy dark:hover:text-white transition"
          >
            <span className="font-medium">Google Calendar</span>
            <ExternalLink size={12} className="text-muted" />
          </a>

          <a
            href={icsUri}
            download={`${event.slug || "campus-event"}.ics`}
            onClick={() => {
              setCopied(true);
              setTimeout(() => {
                setCopied(false);
                setOpen(false);
              }, 1200);
            }}
            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-ink dark:text-white hover:bg-wash/70 dark:hover:bg-zinc-900 hover:text-navy dark:hover:text-white transition"
          >
            <span className="font-medium">Apple / iCal (.ics)</span>
            {copied ? <Check size={12} className="text-emerald-600" /> : <Download size={12} className="text-muted" />}
          </a>

          <a
            href={icsUri}
            download={`${event.slug || "campus-event"}.ics`}
            onClick={() => setOpen(false)}
            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-ink dark:text-white hover:bg-wash/70 dark:hover:bg-zinc-900 hover:text-navy dark:hover:text-white transition"
          >
            <span className="font-medium">Outlook (.ics)</span>
            <Download size={12} className="text-muted" />
          </a>
        </div>
      )}
    </div>
  );
}
