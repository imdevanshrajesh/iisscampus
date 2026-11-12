"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronsDownUp,
  ChevronsUpDown,
  ExternalLink,
  Filter,
  GraduationCap,
  Search,
} from "lucide-react";
import { FacultyForm } from "@/components/manage/faculty-form";
import { FACULTY_TIER_META } from "@/lib/faculty";
import type { FacultyMember, FacultyTier } from "@/lib/types";

export function ManageFacultyList({
  faculty,
  tableMissing = false,
}: {
  faculty: FacultyMember[];
  tableMissing?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [tierFilter, setTierFilter] = useState<"all" | FacultyTier>("all");
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => ({ new: false }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faculty.filter((item) => {
      if (statusFilter === "published" && !item.published) return false;
      if (statusFilter === "draft" && item.published) return false;
      if (tierFilter !== "all" && item.tier !== tierFilter) return false;
      if (!q) return true;
      const haystack = `${item.name} ${item.role} ${item.department ?? ""} ${item.message}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [faculty, query, statusFilter, tierFilter]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const map: Record<string, boolean> = { new: true };
    for (const item of faculty) map[item.id] = true;
    setOpenIds(map);
  };

  const collapseAll = () => {
    setOpenIds({ new: false });
  };

  const allCollapsed = Object.values(openIds).every((value) => !value);

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_0_rgba(20,27,56,0.04)] sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
            <GraduationCap className="h-4 w-4" />
            <span>Database-Backed Directory</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-ink">
            Principal · Vice Principals · Headmistress &amp; Headmaster · Supervisors
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Updates appear immediately on the public Faculty page and can also be edited inline there.
          </p>
        </div>

        <Link
          href="/school/faculty"
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-navy transition hover:text-ink"
        >
          <span>Open &amp; edit on page</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {tableMissing ? (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p className="font-semibold">Faculty database table not found</p>
            <p className="mt-0.5 text-xs leading-relaxed">
              Run{" "}
              <code className="font-mono font-semibold">
                supabase/migrations/20261112120000_campus_faculty.sql
              </code>{" "}
              in the Supabase SQL Editor, then refresh this page.
            </p>
          </div>
        </div>
      ) : null}

      {/* Filter & Search Bar */}
      <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-[0_1px_0_rgba(20,27,56,0.04)] sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search faculty by name or role..."
            className="w-full rounded-lg border border-line bg-white py-1.5 pr-3 pl-9 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={tierFilter}
            onChange={(event) => setTierFilter(event.target.value as "all" | FacultyTier)}
            className="cursor-pointer rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-ink focus:outline-none"
          >
            <option value="all">All Tiers</option>
            {FACULTY_TIER_META.map((item) => (
              <option key={item.tier} value={item.tier}>
                {item.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-ink">
            <Filter className="h-3.5 w-3.5 shrink-0 text-muted" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | "published" | "draft")}
              className="cursor-pointer bg-transparent font-medium text-ink focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="published">Published only</option>
              <option value="draft">Drafts only</option>
            </select>
          </div>

          <button
            type="button"
            onClick={allCollapsed ? expandAll : collapseAll}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-ink transition hover:bg-zinc-50 hover:text-navy"
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

      {/* Faculty List */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <FacultyForm
            key={item.id}
            member={item}
            variant="accordion"
            isOpen={Boolean(openIds[item.id])}
            onToggle={() => toggleOpen(item.id)}
          />
        ))}

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white/50 py-12 text-center">
            <GraduationCap className="mx-auto mb-2 h-8 w-8 text-muted" />
            <p className="text-sm font-semibold text-ink">No faculty records found.</p>
            <p className="mt-1 text-xs text-muted">
              {faculty.length === 0
                ? "Add a faculty member below to store them in the database."
                : "Try clearing your search query or filters."}
            </p>
          </div>
        ) : null}
      </div>

      {/* Create New Faculty Card */}
      <div className="pt-2">
        <FacultyForm
          member={null}
          variant="accordion"
          isOpen={Boolean(openIds.new)}
          onToggle={() => toggleOpen("new")}
        />
      </div>
    </div>
  );
}
