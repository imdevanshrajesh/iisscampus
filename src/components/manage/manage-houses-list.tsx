"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  ExternalLink,
  Filter,
  Search,
  Shield,
} from "lucide-react";
import { HouseForm } from "@/components/manage/house-form";
import type { House } from "@/lib/types";

export function ManageHousesList({ houses }: { houses: House[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => ({}));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return houses.filter((item) => {
      if (statusFilter === "published" && !item.published) return false;
      if (statusFilter === "draft" && item.published) return false;
      if (!q) return true;
      const haystack = `${item.name} ${item.color} ${item.inchargeName} ${item.captainName} ${item.viceCaptainName} ${item.motto ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [houses, query, statusFilter]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const map: Record<string, boolean> = { new: true };
    for (const item of houses) {
      map[item.id] = true;
    }
    setOpenIds(map);
  };

  const collapseAll = () => {
    setOpenIds({});
  };

  const allCollapsed = Object.values(openIds).every((v) => !v);

  return (
    <div className="space-y-6">
      {/* Top Summary Card */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_0_rgba(20,27,56,0.04)]">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider">
            <Shield className="h-4 w-4 text-navy" />
            Official Campus Houses
          </div>
          <div className="mt-2 text-2xl font-bold text-ink">
            Ruby, Sapphire, Topaz &amp; Emerald
          </div>
          <p className="mt-1 text-xs text-muted">
            Each house is led by a Faculty Incharge, House Captain, and Vice Captain.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_0_rgba(20,27,56,0.04)] flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider">
              Public Live Page
            </div>
            <p className="mt-1 text-xs text-muted">
              Full-screen 4 vertical pillars (Red, Blue, Gold/Yellow, and Green).
            </p>
          </div>
          <div className="mt-3">
            <Link
              href="/school/houses"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-ink transition group"
            >
              <span>View live 4-pillar display</span>
              <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-line shadow-[0_1px_0_rgba(20,27,56,0.04)]">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search houses, incharge, captains..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-background/50 border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted bg-background/50 border border-line px-2.5 py-1.5 rounded-lg">
            <Filter className="h-3.5 w-3.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "published" | "draft")}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All statuses</option>
              <option value="published">Published only</option>
              <option value="draft">Drafts only</option>
            </select>
          </div>

          <button
            type="button"
            onClick={allCollapsed ? expandAll : collapseAll}
            className="flex items-center gap-1.5 text-xs text-ink hover:text-navy border border-line px-2.5 py-1.5 rounded-lg bg-white hover:bg-zinc-50 transition cursor-pointer"
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

      {/* Houses List */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <HouseForm
            key={item.id}
            house={item}
            isOpen={Boolean(openIds[item.id])}
            onToggle={() => toggleOpen(item.id)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 rounded-2xl border border-dashed border-line bg-white/50">
            <Shield className="h-8 w-8 text-muted mx-auto mb-2" />
            <p className="text-sm font-semibold text-ink">No houses matched your search.</p>
            <p className="text-xs text-muted mt-1">Try clearing filters or search terms.</p>
          </div>
        )}
      </div>

      {/* Option to Add New House */}
      <div className="pt-2">
        <HouseForm
          house={null}
          isOpen={Boolean(openIds.new)}
          onToggle={() => toggleOpen("new")}
        />
      </div>
    </div>
  );
}
