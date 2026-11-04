"use client";

import Link from "next/link";
import {
  ChevronDown,
  Calendar,
  FileText,
  ArrowRight,
  Paperclip,
  Share2,
  Check,
  Sparkles,
  HeartPulse,
  ExternalLink,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { ResourceCards } from "@/components/content/resource-cards";
import {
  formatAnnouncementDate,
  renderAnnouncementMessage,
  stripMarkdown,
} from "@/lib/announcements";
import type { Announcement, CampusEvent, CustomProgram, WellnessItem } from "@/lib/types";
import { cn } from "@/lib/utils";

function noticeTag(item: Announcement): string {
  if (item.category && item.category !== "General") return item.category;
  const lower = (item.title + " " + item.body).toLowerCase();
  if (lower.includes("wellness") || lower.includes("wellbeing") || lower.includes("mental health")) return "Wellness";
  if (lower.includes("child") || lower.includes("protect") || lower.includes("safety")) return "Child Protection";
  if (lower.includes("mango") || lower.includes("awareness") || lower.includes("program")) return "Awareness";
  if (lower.includes("exam") || lower.includes("academic") || lower.includes("study")) return "Academic";
  if (lower.includes("sport") || lower.includes("league") || lower.includes("match")) return "Athletics";
  if (lower.includes("council") || lower.includes("lead") || lower.includes("prefect")) return "Leadership";
  if (lower.includes("science") || lower.includes("stem") || lower.includes("robot")) return "Innovation";
  if (lower.includes("uniform") || lower.includes("protocol") || lower.includes("rule")) return "Campus Code";
  return "Directive";
}

export function AnnouncementList({
  announcements,
  events = [],
  programs = [],
  wellnessItems = [],
  initialOpenId,
  compact = false,
}: {
  announcements: Announcement[];
  events: CampusEvent[];
  programs?: CustomProgram[];
  wellnessItems?: WellnessItem[];
  initialOpenId?: string | null;
  compact?: boolean;
}) {
  const baseId = useId();
  const eventById = new Map(events.map((event) => [event.id, event]));
  const programById = new Map(programs.map((prog) => [prog.id, prog]));
  const wellnessById = new Map(wellnessItems.map((w) => [w.id, w]));

  const [openId, setOpenId] = useState<string | null>(initialOpenId ?? null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialOpenId) {
      setOpenId(initialOpenId);
      const el = document.getElementById(`announcement-${initialOpenId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [initialOpenId]);

  const handleShare = async (item: Announcement) => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/announcements/${item.id}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.body ? item.body.slice(0, 140) : item.title,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

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
        const linkedProg = item.programId ? programById.get(item.programId) : null;
        const linkedWell = item.wellnessId ? wellnessById.get(item.wellnessId) : null;
        const date = formatAnnouncementDate(item.createdAt);
        const panelId = `${baseId}-${item.id}`;
        const tag = noticeTag(item);
        const copied = copiedId === item.id;

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
              className="mt-3 flex w-full items-start justify-between gap-3 text-left focus:outline-hidden cursor-pointer"
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

            {/* Cover Banner if open */}
            {open && item.coverImageUrl ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-line aspect-[21/9] sm:aspect-[16/8] max-h-72 w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.coverImageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}

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
                  <p>{stripMarkdown(item.body)}</p>
                )}
              </div>
            ) : null}

            {/* Expanded Section Details */}
            {open ? (
              <div id={panelId} className="mt-4 pt-3 space-y-3">
                {/* Linked Program / Activity */}
                {linkedProg ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs flex items-center justify-between gap-2">
                    <span className="text-emerald-800 flex items-center gap-1.5 font-medium">
                      <Sparkles size={14} className="text-emerald-600" />
                      Associated Program / Fun Activity:
                    </span>
                    <Link
                      href="/school/programs"
                      className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                    >
                      <span>{linkedProg.title}</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                ) : null}

                {/* Linked Wellness */}
                {linkedWell ? (
                  <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3 text-xs flex items-center justify-between gap-2">
                    <span className="text-sky-800 flex items-center gap-1.5 font-medium">
                      <HeartPulse size={14} className="text-sky-600" />
                      Associated Wellness Resource:
                    </span>
                    <Link
                      href="/wellness"
                      className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:underline"
                    >
                      <span>{linkedWell.title}</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                ) : null}

                {/* Linked Campus Event */}
                {linked ? (
                  <div className="rounded-xl border border-line/60 bg-wash/30 p-3 text-xs flex items-center justify-between gap-2">
                    <span className="text-muted flex items-center gap-1.5">
                      <FileText size={14} className="text-accent" />
                      Associated Campus Event:
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

                {/* PDF Downloads & Resources */}
                {item.resources.length ? (
                  <div className="pt-2">
                    <ResourceCards resources={item.resources} title="Official Directives & PDF Downloads" />
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Action Bar */}
            <div className="mt-3.5 pt-3 border-t border-line/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
                  className="font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{open ? "Collapse Notice" : "Read Full Directive"}</span>
                  <ChevronDown size={13} className={cn("transition-transform", open && "rotate-180")} />
                </button>

                <Link
                  href={`/announcements/${item.id}`}
                  className="text-muted hover:text-ink font-medium flex items-center gap-1 transition-colors"
                  title="Open as dedicated article page"
                >
                  <span>Article Page</span>
                  <ExternalLink size={11} />
                </Link>
              </div>

              <div className="flex items-center gap-3">
                {item.resources.length > 0 && !open ? (
                  <span className="text-[11px] text-muted flex items-center gap-1">
                    <Paperclip className="h-3 w-3 shrink-0" />
                    <span>
                      {item.resources.length} {item.resources.length === 1 ? "Attachment" : "Attachments"}
                    </span>
                  </span>
                ) : null}

                {/* Share Notice Button */}
                <button
                  type="button"
                  onClick={() => handleShare(item)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-muted hover:text-navy hover:bg-wash transition cursor-pointer"
                  title="Share notice link"
                >
                  {copied ? <Check size={12} className="text-emerald-600" /> : <Share2 size={12} />}
                  <span className="text-[11px] font-medium">{copied ? "Copied Link!" : "Share"}</span>
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
