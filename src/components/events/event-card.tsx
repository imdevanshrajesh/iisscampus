"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Calendar,
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
import { categoryById, eventStatusLabel, formatEventDate } from "@/lib/data/catalog";
import { categoryStyle } from "@/lib/home/category-style";
import { classifyMediaUrl } from "@/lib/media/url";
import type { CampusEvent, Category } from "@/lib/types";

export function EventCard({
  event,
  categories,
  hosts,
  priority = false,
}: {
  event: CampusEvent;
  categories: Category[];
  hosts: readonly string[];
  priority?: boolean;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const primary = categoryById(categories, event.categoryId);
  const theme = categoryStyle(primary?.slug);

  const date = formatEventDate(event.eventDate);
  const end = formatEventDate(event.endDate);
  const when = date && end && end !== date ? `${date} – ${end}` : date;
  const status = event.isSample ? null : eventStatusLabel(event.eventStatus);
  const isLive = event.eventStatus === "ongoing" && !event.isSample;

  const validCover = event.coverImageUrl ? classifyMediaUrl(event.coverImageUrl, hosts) : null;
  const hasCover = Boolean(validCover?.ok);

  const listingLabel =
    event.listing === "external" ? "Elsewhere" : event.listing === "competition" ? "Competition" : null;

  // Real-Time Contextual Badges
  const isRegistrationOpen = event.registrationEnabled && (!event.registrationDeadline || new Date(event.registrationDeadline) > new Date());
  const hasPdfResource = event.resources?.find((r) => r.kind === "pdf" || r.href?.endsWith(".pdf"));
  const hasLogistics = Boolean(event.packingList || (event.schedule && event.schedule.length > 0) || event.registrationInstructions);

  return (
    <article
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-line/80 bg-white shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-line"
      style={{
        boxShadow: drawerOpen ? `0 12px 36px -10px ${theme.glow}` : undefined,
      }}
    >
      <div className="flex h-full w-full flex-col justify-between text-left">
        {/* Postcard Aspect Ratio Cover Frame */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-wash/60 select-none">
          {hasCover && validCover?.ok ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={validCover.url}
              alt={event.coverAlt || event.title}
              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-108"
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div className="relative flex h-full w-full flex-col justify-between p-5 bg-gradient-to-br from-wash via-surface to-line/50">
              <div className="relative z-10 flex items-center justify-between">
                <span className="font-display text-xs italic tracking-widest text-accent uppercase">
                  {listingLabel || "IISS Campus"}
                </span>
                <span className="text-[10px] font-mono text-muted/70">
                  EVENT
                </span>
              </div>
              <div className="relative z-10">
                <span className="font-display text-xl font-bold leading-tight text-ink/25 line-clamp-2">
                  {event.title}
                </span>
              </div>
            </div>
          )}

          {/* Real-Time Contextual Status Badges Affixed to Card */}
          <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
            {primary ? (
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold shadow-xs backdrop-blur-md border ${theme.badge}`}>
                {primary.name}
              </span>
            ) : <span />}

            <div className="flex items-center gap-1.5">
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-white shadow-xs animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  <span>Live Today</span>
                </span>
              ) : isRegistrationOpen ? (
                <span className="rounded-full bg-emerald-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs backdrop-blur-md">
                  Registration Open
                </span>
              ) : status ? (
                <span className="rounded-full bg-navy/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-xs backdrop-blur-md">
                  {status}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            {/* Meta Row: Date & Time + Add to Calendar Sync */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
                {when ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-accent">
                    <Calendar size={13} />
                    <span>{when}</span>
                  </span>
                ) : (
                  <span>Date to be announced</span>
                )}
                {event.startTime ? (
                  <span className="inline-flex items-center gap-1 text-muted">
                    <Clock size={12} />
                    <span>{event.startTime}</span>
                  </span>
                ) : null}
              </div>

              {/* Add to Calendar Sync Button */}
              <AddToCalendarButton event={event} compact />
            </div>

            {/* Title with Preview Trigger */}
            <PreviewTrigger event={event} className="block text-left mt-2.5">
              <h3 className="font-display line-clamp-2 text-xl font-medium leading-snug text-ink group-hover:text-accent transition duration-200">
                {event.title}
              </h3>
            </PreviewTrigger>

            {/* Description */}
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
              {event.shortDescription}
            </p>

            {/* Integrated Action Callouts: Permission Slip & RSVP directly below event */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2 border-t border-line/50">
              {hasPdfResource ? (
                <a
                  href={hasPdfResource.href ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent hover:bg-accent/20 transition"
                  title="Download PDF Permission Slip"
                >
                  <Download size={12} />
                  <span>Download PDF Permission Slip</span>
                </a>
              ) : null}

              {isRegistrationOpen && event.registrationUrl ? (
                <a
                  href={event.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-2.5 py-1 text-xs font-semibold text-white hover:bg-navy/90 transition shadow-2xs"
                >
                  <Ticket size={12} />
                  <span>RSVP Form</span>
                </a>
              ) : null}

              {/* Progressive Information Drawer (Accordion) Toggle */}
              {hasLogistics ? (
                <button
                  type="button"
                  onClick={() => setDrawerOpen((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    drawerOpen
                      ? "border-navy bg-navy text-white shadow-2xs"
                      : "border-line bg-wash/50 text-ink hover:bg-wash"
                  }`}
                  aria-expanded={drawerOpen}
                >
                  <Info size={12} />
                  <span>{drawerOpen ? "Hide Logistics" : "Details & Logistics"}</span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 ${drawerOpen ? "rotate-180" : ""}`}
                  />
                </button>
              ) : null}
            </div>

            {/* Progressive Information Drawer (Accordion) Content */}
            {drawerOpen && hasLogistics && (
              <div className="mt-3.5 rounded-xl border border-line bg-wash/40 p-3.5 text-xs text-ink space-y-3 animate-in fade-in duration-200">
                {event.packingList ? (
                  <div>
                    <span className="font-semibold text-navy flex items-center gap-1 text-[11px] uppercase tracking-wider">
                      <Package size={12} className="text-accent" /> Supply Requirements &amp; Kit:
                    </span>
                    <p className="mt-1 text-muted leading-relaxed whitespace-pre-line pl-4 border-l-2 border-accent/40">
                      {event.packingList}
                    </p>
                  </div>
                ) : null}

                {event.schedule && event.schedule.length > 0 ? (
                  <div>
                    <span className="font-semibold text-navy flex items-center gap-1 text-[11px] uppercase tracking-wider">
                      <Clock size={12} className="text-accent" /> Detailed Agenda:
                    </span>
                    <ul className="mt-1.5 space-y-1.5 pl-4 border-l-2 border-navy/30">
                      {event.schedule.map((item, idx) => (
                        <li key={idx} className="flex items-baseline gap-2">
                          <span className="font-mono text-[11px] font-bold text-accent shrink-0">
                            {item.time}
                          </span>
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
                      <FileText size={12} className="text-accent" /> Registration &amp; Instructions:
                    </span>
                    <p className="mt-1 text-muted leading-relaxed pl-4 border-l-2 border-emerald-500/40">
                      {event.registrationInstructions}
                    </p>
                  </div>
                ) : null}

                {event.gradeFrom || event.gradeTo ? (
                  <div className="flex items-center gap-2 pt-1 border-t border-line/60 text-muted">
                    <Users size={12} />
                    <span>Eligible Grades: {event.gradeFrom ? `Grade ${event.gradeFrom}` : ""}{event.gradeTo ? ` – Grade ${event.gradeTo}` : ""}</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Location / Host & Preview Link */}
          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs">
            {event.locationName || event.hostName ? (
              <span className="inline-flex items-center gap-1 text-ink/80 truncate max-w-[200px]">
                <MapPin size={12} className="text-muted shrink-0" />
                <span className="truncate">
                  {[event.hostName ? `Hosted by ${event.hostName}` : null, event.locationName]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            ) : (
              <span className="text-muted">Campus Event</span>
            )}

            <PreviewTrigger
              event={event}
              className="inline-flex items-center gap-1 font-semibold text-accent group-hover:translate-x-0.5 transition-transform shrink-0"
            >
              <span>Preview</span>
              <ArrowUpRight size={14} />
            </PreviewTrigger>
          </div>
        </div>
      </div>
    </article>
  );
}
