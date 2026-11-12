"use client";

import { useState, useMemo } from "react";
import { Bell, ChevronDown, History, Newspaper, Search, Tag } from "lucide-react";
import { AnnouncementList } from "@/components/announcements/announcement-list";
import { filterAnnouncementsForTerm, hasActiveTerm } from "@/lib/terms";
import type { AcademicTermConfig, Announcement, CampusEvent, CustomProgram, WellnessItem } from "@/lib/types";

function noticeTag(item: Announcement): string {
  if (item.category && item.category !== "General") return item.category;
  const lower = (item.title + " " + item.body).toLowerCase();
  if (lower.includes("wellness") || lower.includes("wellbeing") || lower.includes("mental health")) return "Wellness";
  if (lower.includes("child") || lower.includes("protect") || lower.includes("safety")) return "Child Protection";
  if (lower.includes("mango") || lower.includes("awareness") || lower.includes("program")) return "Awareness Programs";
  if (lower.includes("exam") || lower.includes("academic") || lower.includes("study")) return "Academic";
  if (lower.includes("sport") || lower.includes("league") || lower.includes("match")) return "Athletics";
  if (lower.includes("council") || lower.includes("lead") || lower.includes("prefect")) return "Leadership";
  if (lower.includes("science") || lower.includes("stem") || lower.includes("robot")) return "Innovation";
  if (lower.includes("uniform") || lower.includes("protocol") || lower.includes("rule")) return "Campus Code";
  return "General";
}

const TAG_FILTERS = [
  "All",
  "Wellness",
  "Awareness Programs",
  "Child Protection",
  "Academic",
  "Leadership",
  "Athletics",
  "Campus Code",
] as const;

export function AnnouncementsPage({
  announcements,
  events,
  programs = [],
  wellnessItems = [],
  activeTerm,
  initialOpenId,
}: {
  announcements: Announcement[];
  events: CampusEvent[];
  programs?: CustomProgram[];
  wellnessItems?: WellnessItem[];
  activeTerm?: AcademicTermConfig;
  initialOpenId?: string | null;
}) {
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const termConfigured = hasActiveTerm(activeTerm);

  const filtered = useMemo(() => {
    return announcements.filter((item) => {
      const tag = noticeTag(item);
      const matchesTag = selectedTag === "All" || tag === selectedTag || item.category === selectedTag;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q));
      return matchesTag && matchesSearch;
    });
  }, [announcements, selectedTag, searchQuery]);

  const { currentItems, archivedItems } = useMemo(() => {
    if (!termConfigured) return { currentItems: filtered, archivedItems: [] as Announcement[] };
    const currentList = filterAnnouncementsForTerm(filtered, activeTerm);
    const currentIds = new Set(currentList.map((item) => item.id));
    return {
      currentItems: currentList,
      archivedItems: filtered.filter((item) => !currentIds.has(item.id)),
    };
  }, [filtered, termConfigured, activeTerm]);

  const openInArchive = Boolean(initialOpenId && archivedItems.some((item) => item.id === initialOpenId));
  const [archiveOpen, setArchiveOpen] = useState(openInArchive);

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-10 md:px-8 md:py-16">
      {/* Editorial Header */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Bell size={14} />
          </span>
          <p className="kicker text-accent font-semibold tracking-wider text-xs uppercase">
            Need to Know
          </p>
        </div>

        <h1 className="font-display mt-3 text-[clamp(2.8rem,6vw,5rem)] leading-[0.92] text-ink">
          Notices &amp; <span className="italic">Posts</span>
        </h1>

        <p className="mt-4 text-base md:text-lg leading-relaxed text-ink/80">
          Official circulars, student blog articles, examination schedules, directives, and dispatches from
          the boys&apos; student council. Direct from the campus administration.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-y border-line/80 py-4">
        {/* Topic Tag Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted">
            <Tag size={12} /> Filter:
          </span>
          {TAG_FILTERS.map((tag) => {
            const active = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  active
                    ? "bg-navy text-white shadow-xs"
                    : "bg-wash text-ink/75 hover:bg-line/40 hover:text-ink"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px] sm:min-w-[280px]">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dispatches & circulars..."
            className="w-full rounded-full border border-line bg-white/90 py-1.5 pl-9 pr-3 text-xs text-ink placeholder:text-muted/70 focus:border-accent focus:outline-hidden focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Blog & Dispatches Feed */}
      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <AnnouncementList
            announcements={currentItems}
            events={events}
            programs={programs}
            wellnessItems={wellnessItems}
            initialOpenId={initialOpenId}
          />

          {archivedItems.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
              <button
                type="button"
                onClick={() => setArchiveOpen((prev) => !prev)}
                aria-expanded={archiveOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-wash/35"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
                    <History size={14} />
                    <span>Previous Terms Archive</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    Earlier Circulars &amp; Notices ({archivedItems.length})
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink">
                  <span>{archiveOpen ? "Hide" : "Show"}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${archiveOpen ? "rotate-180" : ""}`}
                  />
                </span>
              </button>

              {archiveOpen ? (
                <div className="border-t border-line/80 p-4 sm:p-5">
                  <AnnouncementList
                    announcements={archivedItems}
                    events={events}
                    programs={programs}
                    wellnessItems={wellnessItems}
                    initialOpenId={initialOpenId}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Sidebar Bulletin Info */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-line/80 bg-white/90 p-6 shadow-xs">
            <h3 className="font-display text-lg font-medium text-ink flex items-center gap-2">
              <Newspaper size={16} className="text-accent" /> Bulletin Protocol
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Campus circulars posted here represent official directives sanctioned by school
              administration and the Student Council. Parents and students are encouraged to check
              regularly for schedules, venue updates, and competition rosters.
            </p>

            <div className="mt-4 pt-4 border-t border-line/60">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Direct Submissions
              </p>
              <p className="mt-1 text-xs text-ink/80">
                Council committees or club leads seeking notice clearance can reach the council
                via the{" "}
                <a href="/suggestions" className="text-accent underline font-medium">
                  Suggestions Box
                </a>
                .
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
