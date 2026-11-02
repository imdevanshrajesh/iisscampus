"use client";

import { useMemo, useState } from "react";
import { ChevronsDownUp, ChevronsUpDown, Filter, Search } from "lucide-react";
import { FaqForm } from "@/components/manage/faq-form";
import type { Faq } from "@/lib/types";

export function ManageFaqList({ faqs }: { faqs: Faq[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  // Track expanded state for each FAQ (collapsed by default)
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => ({
    new: false,
  }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter((item) => {
      if (statusFilter === "published" && !item.published) return false;
      if (statusFilter === "draft" && item.published) return false;
      if (!q) return true;
      const haystack = `${item.question} ${item.answer}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [faqs, query, statusFilter]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const map: Record<string, boolean> = { new: true };
    for (const item of faqs) {
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
              placeholder="Search questions or answers..."
              aria-label="Search FAQs"
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
              <option value="all">All FAQs</option>
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
            {filtered.length} question{filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* New FAQ Form (Collapsed by default) */}
      <FaqForm
        faq={null}
        isOpen={Boolean(openIds.new)}
        onToggle={() => toggleOpen("new")}
      />

      {/* Existing FAQs (Collapsed by default) */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <FaqForm
            key={item.id}
            faq={item}
            isOpen={Boolean(openIds[item.id]) || (Boolean(query) && true)}
            onToggle={() => toggleOpen(item.id)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-muted">
            No questions match your filter.
          </div>
        )}
      </div>
    </div>
  );
}
