"use client";

import { useMemo, useState } from "react";
import { ChevronsDownUp, ChevronsUpDown, Filter, Plus, Search } from "lucide-react";
import { AnnouncementForm } from "@/components/manage/announcement-form";
import type { Announcement, CampusEvent, CustomProgram, WellnessItem } from "@/lib/types";

export function ManageAnnouncementsList({
  announcements,
  events,
  programs = [],
  wellnessItems = [],
  defaultEventId = null,
  initialEditId = null,
  defaultAcademicYear = null,
}: {
  announcements: Announcement[];
  events: CampusEvent[];
  programs?: CustomProgram[];
  wellnessItems?: WellnessItem[];
  defaultEventId?: string | null;
  initialEditId?: string | null;
  defaultAcademicYear?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");

  // Track expanded state for each announcement (collapsed by default)
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {
      new: Boolean(defaultEventId), // Open new form if directed with an eventId
    };
    for (const item of announcements) {
      map[item.id] = initialEditId === item.id;
    }
    return map;
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return announcements.filter((item) => {
      if (statusFilter === "active" && !item.enabled) return false;
      if (statusFilter === "hidden" && item.enabled) return false;
      if (!q) return true;
      const haystack = `${item.title} ${item.body}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [announcements, query, statusFilter]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const map: Record<string, boolean> = { new: true };
    for (const item of announcements) {
      map[item.id] = true;
    }
    setOpenIds(map);
  };

  const collapseAll = () => {
    const map: Record<string, boolean> = { new: false };
    for (const item of announcements) {
      map[item.id] = false;
    }
    setOpenIds(map);
  };

  const allCollapsed = Object.values(openIds).every((v) => !v);

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search, Status filter, Expand/Collapse */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search announcements..."
              aria-label="Search announcements"
              className="w-full rounded-lg border border-line bg-white dark:bg-black text-ink dark:text-white pl-9 pr-3 py-2 text-sm outline-none transition focus:border-navy"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              aria-label="Filter status"
              className="rounded-lg border border-line bg-white dark:bg-black text-ink dark:text-white px-3 py-2 text-sm outline-none transition focus:border-navy"
            >
              <option value="all" className="bg-white dark:bg-black text-ink dark:text-white">All Bulletins</option>
              <option value="active" className="bg-white dark:bg-black text-ink dark:text-white">Active Only</option>
              <option value="hidden" className="bg-white dark:bg-black text-ink dark:text-white">Hidden Only</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {allCollapsed ? (
            <button
              type="button"
              onClick={expandAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white dark:bg-black px-3 py-2 text-xs font-medium text-ink dark:text-white transition hover:border-navy"
            >
              <ChevronsUpDown className="h-3.5 w-3.5 text-accent" />
              <span>Expand All</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={collapseAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white dark:bg-black px-3 py-2 text-xs font-medium text-ink dark:text-white transition hover:border-navy"
            >
              <ChevronsDownUp className="h-3.5 w-3.5 text-accent" />
              <span>Collapse All</span>
            </button>
          )}
          <span className="text-xs text-muted pl-1">
            {filtered.length} circular{filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* New Announcement Form (Collapsible, collapsed by default) */}
      <div className="rounded-2xl border border-line bg-white shadow-[0_1px_0_rgba(20,27,56,0.04)] overflow-hidden">
        <AnnouncementForm
          announcement={null}
          events={events}
          programs={programs}
          wellnessItems={wellnessItems}
          defaultEventId={defaultEventId}
          defaultAcademicYear={defaultAcademicYear}
          isOpen={openIds.new}
          onToggle={() => toggleOpen("new")}
        />
      </div>

      {/* Existing Announcements List (Each Collapsible, collapsed by default) */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-line bg-white shadow-[0_1px_0_rgba(20,27,56,0.04)] overflow-hidden"
          >
            <AnnouncementForm
              announcement={item}
              events={events}
              programs={programs}
              wellnessItems={wellnessItems}
              defaultAcademicYear={defaultAcademicYear}
              isOpen={openIds[item.id] || (Boolean(query) && true)}
              onToggle={() => toggleOpen(item.id)}
            />
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-muted">
            No announcements match your search or filter.
          </div>
        )}
      </div>
    </div>
  );
}
