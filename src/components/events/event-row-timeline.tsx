"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Clock,
  Download,
  FileText,
  Info,
  MapPin,
  Package,
  Ticket,
  Users,
} from "lucide-react";
import { AddToCalendarButton } from "@/components/events/add-to-calendar-button";
import { PreviewTrigger } from "@/components/preview/preview-provider";
import { categoryById, getEffectiveEventStatus } from "@/lib/data/catalog";
import { categoryStyle } from "@/lib/home/category-style";
import type { CampusEvent, Category } from "@/lib/types";

function parseDateSegments(dateStr?: string | null) {
  if (!dateStr) return { month: "TBA", day: "--", weekday: "Dates Open" };
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return { month: "TBA", day: "--", weekday: "Dates Open" };
    const date = new Date(Date.UTC(y, m - 1, d));
    const month = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(date).toUpperCase();
    const day = String(d).padStart(2, "0");
    const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date);
    return { month, day, weekday };
  } catch {
    return { month: "TBA", day: "--", weekday: "Dates Open" };
  }
}

export function EventRowTimeline({
  event,
  categories,
}: {
  event: CampusEvent;
  categories: Category[];
  hosts?: readonly string[];
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const primary = categoryById(categories, event.categoryId);
  const theme = categoryStyle(primary?.slug);
  const dateParts = parseDateSegments(event.eventDate);
  const isLive = getEffectiveEventStatus(event) === "ongoing" && !event.isSample;

  const isRegistrationOpen = event.registrationEnabled && (!event.registrationDeadline || new Date(event.registrationDeadline) > new Date());
  const hasPdfResource = event.resources?.find((r) => r.kind === "pdf" || r.href?.endsWith(".pdf"));
  const hasLogistics = Boolean(event.packingList || (event.schedule && event.schedule.length > 0) || event.registrationInstructions);

  return (
    <article className="group rounded-2xl border border-line bg-white/95 p-4 sm:p-5 shadow-xs transition duration-200 hover:border-navy hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Chronological Date Spine / Pill */}
        <div className="flex items-center gap-4 shrink-0">
          <div
            className={`flex h-16 w-16 sm:h-20 sm:w-20 flex-col items-center justify-center rounded-2xl border ${theme.badge} shadow-xs text-center shrink-0`}
          >
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              {dateParts.month}
            </span>
            <span className="font-display text-xl sm:text-3xl font-bold leading-none">
              {dateParts.day}
            </span>
            <span className="text-[9px] sm:text-[10px] font-medium opacity-80">
              {dateParts.weekday}
            </span>
          </div>

          {/* Title & Core Details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {primary ? (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${theme.badge}`}>
                  {primary.name}
                </span>
              ) : null}

              {isLive ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  <span>Live Today</span>
                </span>
              ) : isRegistrationOpen ? (
                <span className="rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Registration Open
                </span>
              ) : null}

              {event.startTime ? (
                <span className="inline-flex items-center gap-1 text-muted">
                  <Clock size={11} /> {event.startTime}
                </span>
              ) : null}
            </div>

            <PreviewTrigger event={event} className="block text-left mt-1.5">
              <h3 className="font-display text-lg sm:text-xl font-medium text-ink group-hover:text-accent transition">
                {event.title}
              </h3>
            </PreviewTrigger>

            <p className="mt-1 line-clamp-2 text-xs text-muted max-w-2xl leading-relaxed">
              {event.shortDescription}
            </p>

            {event.locationName ? (
              <p className="mt-1.5 text-xs text-ink/75 flex items-center gap-1">
                <MapPin size={11} className="text-muted shrink-0" />
                <span className="truncate">{event.locationName}</span>
              </p>
            ) : null}
          </div>
        </div>

        {/* Right: Quick Action Callouts & Calendar Sync */}
        <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line/60">
          <div className="flex items-center gap-2">
            <AddToCalendarButton event={event} compact />

            {hasPdfResource ? (
              <a
                href={hasPdfResource.href ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent hover:bg-accent/20 transition"
                title="Download PDF Permission Slip"
              >
                <Download size={12} />
                <span>PDF Slip</span>
              </a>
            ) : null}

            {isRegistrationOpen && event.registrationUrl ? (
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-navy px-2.5 py-1 text-xs font-semibold text-white hover:bg-navy/90 transition shadow-2xs"
              >
                <Ticket size={12} />
                <span>RSVP</span>
              </a>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {hasLogistics ? (
              <button
                type="button"
                onClick={() => setDrawerOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-navy transition"
              >
                <Info size={12} />
                <span>{drawerOpen ? "Less" : "Logistics"}</span>
                <ChevronDown size={12} className={`transition-transform ${drawerOpen ? "rotate-180" : ""}`} />
              </button>
            ) : null}

            <PreviewTrigger
              event={event}
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
            >
              <span>Preview</span>
              <ArrowUpRight size={13} />
            </PreviewTrigger>
          </div>
        </div>
      </div>

      {/* Progressive Drawer Content in Row View */}
      {drawerOpen && hasLogistics && (
        <div className="mt-4 rounded-xl border border-line bg-wash/40 p-4 text-xs text-ink space-y-3 animate-in fade-in duration-200">
          {event.packingList ? (
            <div>
              <span className="font-semibold text-navy flex items-center gap-1 text-[11px] uppercase tracking-wider">
                <Package size={12} className="text-accent" /> Required Equipment &amp; Kit:
              </span>
              <p className="mt-1 text-muted leading-relaxed pl-3 border-l-2 border-accent/40">
                {event.packingList}
              </p>
            </div>
          ) : null}

          {event.schedule && event.schedule.length > 0 ? (
            <div>
              <span className="font-semibold text-navy flex items-center gap-1 text-[11px] uppercase tracking-wider">
                <Clock size={12} className="text-accent" /> Schedule &amp; Agenda:
              </span>
              <ul className="mt-1.5 space-y-1.5 pl-3 border-l-2 border-navy/30">
                {event.schedule.map((item, idx) => (
                  <li key={idx} className="flex items-baseline gap-2">
                    <span className="font-mono text-[11px] font-bold text-accent shrink-0">{item.time}</span>
                    <span className="text-ink font-medium">{item.title}</span>
                    {item.detail ? <span className="text-muted">({item.detail})</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {event.registrationInstructions ? (
            <div>
              <span className="font-semibold text-navy flex items-center gap-1 text-[11px] uppercase tracking-wider">
                <FileText size={12} className="text-accent" /> Instructions:
              </span>
              <p className="mt-1 text-muted leading-relaxed pl-3 border-l-2 border-emerald-500/40">
                {event.registrationInstructions}
              </p>
            </div>
          ) : null}

          {event.gradeFrom || event.gradeTo ? (
            <div className="flex items-center gap-2 pt-1 border-t border-line/60 text-muted">
              <Users size={12} />
              <span>Target Grades: {event.gradeFrom ? `Grade ${event.gradeFrom}` : ""}{event.gradeTo ? ` – Grade ${event.gradeTo}` : ""}</span>
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
}
