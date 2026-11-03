"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronsDownUp, ChevronsUpDown, ExternalLink, Filter, Search, GraduationCap } from "lucide-react";
import { SchoolInchargeForm } from "@/components/manage/school-incharge-form";
import type { SchoolHead } from "@/lib/types";

export function ManageHeadsList({ incharges }: { incharges: SchoolHead[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [tierFilter, setTierFilter] = useState<"all" | "executive" | "section" | "department">("all");

  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => ({
    new: false,
  }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return incharges.filter((item) => {
      if (statusFilter === "published" && !item.published) return false;
      if (statusFilter === "draft" && item.published) return false;
      if (tierFilter !== "all" && item.tier !== tierFilter) return false;
      if (!q) return true;
      const haystack = `${item.name} ${item.role} ${item.department ?? ""} ${item.message ?? item.about ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [incharges, query, statusFilter, tierFilter]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const map: Record<string, boolean> = { new: true };
    for (const item of incharges) {
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
      {/* Top Banner */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_0_rgba(20,27,56,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider">
            <GraduationCap className="h-4 w-4" />
            Leadership Hierarchy
          </div>
          <p className="mt-1 text-sm font-semibold text-ink">
            Executive Leadership (Principal &amp; VP) · Section Heads · Department Heads
          </p>
          <p className="text-xs text-muted mt-0.5">
            Add personal messages to students. Displayed with prominent quote typography on the public page.
          </p>
        </div>

        <Link
          href="/school/heads"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-ink transition shrink-0"
        >
          <span>View public page</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-line shadow-[0_1px_0_rgba(20,27,56,0.04)]">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search heads by name or role..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white dark:bg-black text-ink dark:text-white border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tier Filter */}
          <div className="flex items-center gap-1.5 text-xs text-ink bg-white dark:bg-black border border-line px-2.5 py-1.5 rounded-lg">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as any)}
              className="bg-transparent text-ink dark:text-white focus:outline-none cursor-pointer text-xs font-medium"
            >
              <option value="all" className="bg-white dark:bg-black text-ink dark:text-white">All Tiers</option>
              <option value="executive" className="bg-white dark:bg-black text-ink dark:text-white">Executive</option>
              <option value="section" className="bg-white dark:bg-black text-ink dark:text-white">Section Heads</option>
              <option value="department" className="bg-white dark:bg-black text-ink dark:text-white">Department Heads</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-ink bg-white dark:bg-black border border-line px-2.5 py-1.5 rounded-lg">
            <Filter className="h-3.5 w-3.5 text-muted shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "published" | "draft")}
              className="bg-transparent text-ink dark:text-white focus:outline-none cursor-pointer font-medium"
            >
              <option value="all" className="bg-white dark:bg-black text-ink dark:text-white">All statuses</option>
              <option value="published" className="bg-white dark:bg-black text-ink dark:text-white">Published only</option>
              <option value="draft" className="bg-white dark:bg-black text-ink dark:text-white">Drafts only</option>
            </select>
          </div>

          <button
            type="button"
            onClick={allCollapsed ? expandAll : collapseAll}
            className="flex items-center gap-1.5 text-xs text-ink hover:text-navy border border-line px-2.5 py-1.5 rounded-lg bg-white dark:bg-black hover:bg-zinc-50 dark:hover:bg-zinc-900 transition cursor-pointer"
          >
            {allCollapsed ? (
              <>
                <ChevronsUpDown className="h-3.5 w-3.5" />
                <span>Expand all</span>
              </>
            ) : (
              <>
                <ChevronsDownUp className="h-3.5 w-3.5" />
                <span>Collapse all</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Roster List */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <SchoolInchargeForm
            key={item.id}
            incharge={item}
            isOpen={Boolean(openIds[item.id])}
            onToggle={() => toggleOpen(item.id)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 rounded-2xl border border-dashed border-line bg-white/50">
            <GraduationCap className="h-8 w-8 text-muted mx-auto mb-2" />
            <p className="text-sm font-semibold text-ink">No leadership heads found.</p>
            <p className="text-xs text-muted mt-1">Try clearing your search query or filters.</p>
          </div>
        )}
      </div>

      {/* New Head Form Card */}
      <div className="pt-2">
        <SchoolInchargeForm
          incharge={null}
          isOpen={Boolean(openIds.new)}
          onToggle={() => toggleOpen("new")}
        />
      </div>
    </div>
  );
}

export const ManageInchargesList = ManageHeadsList;
