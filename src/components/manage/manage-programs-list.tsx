"use client";

import { useMemo, useState } from "react";
import { ChevronsDownUp, ChevronsUpDown, Filter, Search } from "lucide-react";
import { CustomProgramForm } from "@/components/manage/custom-program-form";
import type { CampusEvent, CustomProgram } from "@/lib/types";

export function ManageProgramsList({
  programs,
  events,
  mediaHosts,
}: {
  programs: CustomProgram[];
  events: CampusEvent[];
  mediaHosts: string[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => ({
    new: false,
  }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return programs.filter((item) => {
      if (statusFilter === "published" && !item.published) return false;
      if (statusFilter === "draft" && item.published) return false;
      if (!q) return true;
      const haystack = `${item.title} ${item.summary}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [programs, query, statusFilter]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const map: Record<string, boolean> = { new: true };
    for (const item of programs) {
      map[item.id] = true;
    }
    setOpenIds(map);
  };

  const collapseAll = () => {
    setOpenIds({ new: false });
  };

  const allCollapsed = Object.values(openIds).every((v) => !v);

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search custom programs..."
              aria-label="Search custom programs"
              className="w-full rounded-lg border border-line bg-[#fbfaf4] pl-9 pr-3 py-2 text-sm outline-none transition focus:border-navy focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              aria-label="Filter status"
              className="rounded-lg border border-line bg-[#fbfaf4] px-3 py-2 text-sm outline-none transition focus:border-navy focus:bg-white"
            >
              <option value="all">All Programs</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {allCollapsed ? (
            <button
              type="button"
              onClick={expandAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-[#fbfaf4] px-3 py-2 text-xs font-medium text-ink transition hover:border-navy hover:bg-white"
            >
              <ChevronsUpDown className="h-3.5 w-3.5 text-accent" />
              <span>Expand All</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={collapseAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-[#fbfaf4] px-3 py-2 text-xs font-medium text-ink transition hover:border-navy hover:bg-white"
            >
              <ChevronsDownUp className="h-3.5 w-3.5 text-accent" />
              <span>Collapse All</span>
            </button>
          )}
          <span className="text-xs text-muted pl-1">
            {filtered.length} program{filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* New Program Form (Collapsed by default) */}
      <CustomProgramForm
        program={null}
        events={events}
        mediaHosts={mediaHosts}
        isOpen={Boolean(openIds.new)}
        onToggle={() => toggleOpen("new")}
      />

      {/* Existing Programs (Collapsed by default) */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <CustomProgramForm
            key={item.id}
            program={item}
            events={events}
            mediaHosts={mediaHosts}
            isOpen={Boolean(openIds[item.id]) || (Boolean(query) && true)}
            onToggle={() => toggleOpen(item.id)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-muted">
            No programs match your filter.
          </div>
        )}
      </div>
    </div>
  );
}
