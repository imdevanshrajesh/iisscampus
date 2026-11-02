"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Plus, Search } from "lucide-react";
import { CategoryForm } from "@/components/manage/category-form";
import { classifyNavigationUrl } from "@/lib/media/url";
import type { Category } from "@/lib/types";

export function ManageCategoriesList({
  categories,
  mediaHosts,
}: {
  categories: Category[];
  mediaHosts: string[];
}) {
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => ({
    new: false,
  }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories.filter((cat) => {
      if (!q) return true;
      return `${cat.name} ${cat.description ?? ""}`.toLowerCase().includes(q);
    });
  }, [categories, query]);

  const toggle = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const map: Record<string, boolean> = { new: true };
    for (const cat of categories) map[cat.id] = true;
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
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories..."
            aria-label="Search categories"
            className="w-full rounded-lg border border-line bg-[#fbfaf4] pl-9 pr-3 py-2 text-sm outline-none transition focus:border-navy focus:bg-white"
          />
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
            {filtered.length} categor{filtered.length === 1 ? "y" : "ies"}
          </span>
        </div>
      </div>

      {/* New Category Box (Collapsed by default) */}
      <div className="rounded-2xl border border-line bg-white shadow-[0_1px_0_rgba(20,27,56,0.04)] overflow-hidden transition">
        <button
          type="button"
          onClick={() => toggle("new")}
          className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-white hover:bg-[#fbfaf4] transition cursor-pointer select-none border-b border-transparent data-[open=true]:border-line"
          data-open={Boolean(openIds.new)}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/5 text-navy">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Add New Category</h2>
              <p className="text-xs text-muted">Create a new activity category with custom briefing PDF</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted">
            <span className="text-xs font-medium">{openIds.new ? "Close" : "Open"}</span>
            {openIds.new ? (
              <ChevronDown className="h-4 w-4 text-accent transition-transform" />
            ) : (
              <ChevronRight className="h-4 w-4 transition-transform" />
            )}
          </div>
        </button>
        {openIds.new && (
          <div className="p-4 sm:p-5 pt-3 bg-[#faf9f5]/50 border-t border-line/40">
            <CategoryForm category={null} mediaHosts={mediaHosts} />
          </div>
        )}
      </div>

      {/* Existing Categories List (Collapsed by default) */}
      <div className="space-y-4">
        {filtered.map((cat) => {
          const isOpen = Boolean(openIds[cat.id]) || Boolean(query);
          const pdf = cat.pdfUrl ? classifyNavigationUrl(cat.pdfUrl) : null;

          return (
            <div
              key={cat.id}
              className="rounded-2xl border border-line bg-white shadow-[0_1px_0_rgba(20,27,56,0.04)] overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => toggle(cat.id)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-white hover:bg-[#fbfaf4] transition cursor-pointer select-none border-b border-transparent data-[open=true]:border-line"
                data-open={isOpen}
              >
                <div className="min-w-0 pr-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink">{cat.name}</h3>
                    <span className="rounded-full bg-navy/5 px-2 py-0.5 text-[10px] font-bold text-navy">
                      Order #{cat.sortOrder}
                    </span>
                    {pdf?.ok ? (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                        PDF attached
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-muted truncate max-w-xl">
                    {cat.description || "No description provided."}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-muted shrink-0">
                  <span className="text-xs font-medium">{isOpen ? "Close" : "Edit"}</span>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-accent transition-transform" />
                  ) : (
                    <ChevronRight className="h-4 w-4 transition-transform" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="p-4 sm:p-5 pt-3 bg-[#faf9f5]/50 border-t border-line/40 space-y-4">
                  {pdf?.ok ? (
                    <div className="text-xs">
                      <a
                        href={pdf.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-accent hover:underline"
                      >
                        ↗ Download Current PDF Brief
                      </a>
                    </div>
                  ) : null}
                  <CategoryForm category={cat} mediaHosts={mediaHosts} />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-muted">
            No categories match your search.
          </div>
        )}
      </div>
    </div>
  );
}
