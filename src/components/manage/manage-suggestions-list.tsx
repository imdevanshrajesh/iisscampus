"use client";

import { useState, useMemo } from "react";
import { ChevronDown, MessageSquare, Search, Trash2 } from "lucide-react";
import { DeleteRecord } from "@/components/manage/delete-record";
import { deleteSuggestion } from "@/lib/suggestions/actions";
import type { Suggestion } from "@/lib/suggestions";

const when = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Dubai",
});

export function ManageSuggestionsList({ items }: { items: Suggestion[] }) {
  const [search, setSearch] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) => item.email.toLowerCase().includes(q) || item.body.toLowerCase().includes(q),
    );
  }, [items, search]);

  const toggleOne = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setOpenIds(new Set(filtered.map((item) => item.id)));
  };

  const collapseAll = () => {
    setOpenIds(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Search and Expand/Collapse Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-line">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suggestions by email or text..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-line bg-background focus:outline-none focus:ring-1 focus:ring-navy"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="px-2.5 py-1 text-xs text-muted hover:text-ink font-medium transition cursor-pointer"
          >
            Expand All
          </button>
          <span className="text-line text-xs">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="px-2.5 py-1 text-xs text-muted hover:text-ink font-medium transition cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Suggestion List */}
      <ul className="grid gap-2.5">
        {filtered.map((item) => {
          const isOpen = openIds.has(item.id);
          const snippet = item.body.replace(/\s+/g, " ").trim();

          return (
            <li
              key={item.id}
              className="rounded-xl border border-line bg-white shadow-xs overflow-hidden transition-all duration-200"
            >
              {/* Collapsible Header */}
              <button
                type="button"
                onClick={() => toggleOne(item.id)}
                className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left hover:bg-wash/40 transition cursor-pointer select-none border-b border-transparent data-[open=true]:border-line/70"
                data-open={isOpen}
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-200/60 text-indigo-700">
                    <MessageSquare size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-semibold text-xs text-ink truncate max-w-xs">
                        {item.email}
                      </span>
                      <time className="text-[11px] text-muted">
                        {when.format(new Date(item.createdAt))}
                      </time>
                    </div>
                    {!isOpen && (
                      <p className="mt-0.5 text-xs text-muted truncate max-w-xl">
                        {snippet}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium text-navy/75 hover:text-navy hidden sm:inline">
                    {isOpen ? "Close" : "Read note"}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              {/* Expanded Note Body */}
              {isOpen && (
                <div className="p-4 sm:p-5 pt-3 bg-zinc-50/50">
                  <p className="text-sm leading-relaxed text-ink whitespace-pre-wrap bg-white p-4 rounded-lg border border-line shadow-2xs">
                    {item.body}
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-line/60">
                    <a
                      href={`mailto:${item.email}?subject=Regarding%20your%20campus%20suggestion`}
                      className="text-xs font-medium text-navy hover:underline"
                    >
                      Reply to {item.email} &rarr;
                    </a>
                    <DeleteRecord action={deleteSuggestion} id={item.id} label="Delete suggestion" />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
