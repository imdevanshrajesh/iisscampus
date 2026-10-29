"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Filter, RotateCcw, Search, X } from "lucide-react";
import type { Category } from "@/lib/types";

type Filters = {
  query?: string;
  category?: string;
  year?: string;
  status?: string;
  grade?: string;
  from?: string;
  to?: string;
  fee?: string;
};

export function ExpandableFilters({
  basePath,
  categories,
  years,
  filters,
}: {
  basePath: "/events" | "/competitions";
  categories: Category[];
  years: string[];
  filters: Filters;
}) {
  const activeCount = [
    filters.query,
    filters.category,
    filters.year,
    filters.status,
    filters.grade,
    filters.from,
    filters.to,
    filters.fee,
  ].filter(Boolean).length;

  const [expanded, setExpanded] = useState(activeCount > 1);

  const selectedCategory = categories.find((c) => c.slug === filters.category);

  return (
    <div className="mt-10 rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-xs">
      <form method="get" action={basePath}>
        {/* Top Filter Bar: Search + Quick Pills + Expand Toggle */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              name="q"
              defaultValue={filters.query}
              placeholder="Search by name, venue, or keyword..."
              className="w-full rounded-xl border border-line bg-wash/30 pl-9 pr-4 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-navy focus:bg-white focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Expand / Collapse Button */}
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                expanded || activeCount > 0
                  ? "border-navy bg-navy text-white shadow-xs"
                  : "border-line bg-wash/40 text-ink hover:bg-wash"
              }`}
            >
              <Filter size={14} />
              <span>{expanded ? "Hide Filters" : "Filters"}</span>
              {activeCount > 0 ? (
                <span className="flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] text-white font-bold">
                  {activeCount}
                </span>
              ) : null}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              />
            </button>

            <button
              type="submit"
              className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-accent-deep"
            >
              Search
            </button>
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <Link
            href={basePath}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
              !filters.category
                ? "bg-navy text-white"
                : "border border-line/80 bg-wash/40 text-muted hover:bg-wash hover:text-ink"
            }`}
          >
            All Categories
          </Link>
          {categories.map((category) => {
            const isSelected = filters.category === category.slug;
            return (
              <Link
                key={category.id}
                href={`${basePath}?category=${category.slug}`}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                  isSelected
                    ? "bg-navy text-white shadow-xs"
                    : "border border-line/80 bg-wash/40 text-muted hover:bg-wash hover:text-ink"
                }`}
              >
                {category.name}
              </Link>
            );
          })}
        </div>

        {/* Expandable Advanced Options */}
        {expanded ? (
          <div className="mt-4 border-t border-line/60 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <label className="grid gap-1 text-xs font-medium text-ink">
                Category
                <select
                  name="category"
                  defaultValue={filters.category}
                  className="rounded-lg border border-line bg-wash/30 px-3 py-2 text-sm text-ink focus:bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              {years.length ? (
                <label className="grid gap-1 text-xs font-medium text-ink">
                  Year
                  <select
                    name="year"
                    defaultValue={filters.year}
                    className="rounded-lg border border-line bg-wash/30 px-3 py-2 text-sm text-ink focus:bg-white"
                  >
                    <option value="">All Years</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="grid gap-1 text-xs font-medium text-ink">
                Status
                <select
                  name="status"
                  defaultValue={filters.status}
                  className="rounded-lg border border-line bg-wash/30 px-3 py-2 text-sm text-ink focus:bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

              <label className="grid gap-1 text-xs font-medium text-ink">
                Grade
                <select
                  name="grade"
                  defaultValue={filters.grade}
                  className="rounded-lg border border-line bg-wash/30 px-3 py-2 text-sm text-ink focus:bg-white"
                >
                  <option value="">All Grades</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                    <option key={grade} value={String(grade)}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-xs font-medium text-ink">
                From Date
                <input
                  type="date"
                  name="from"
                  defaultValue={filters.from}
                  className="rounded-lg border border-line bg-wash/30 px-3 py-2 text-sm text-ink focus:bg-white"
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-ink">
                To Date
                <input
                  type="date"
                  name="to"
                  defaultValue={filters.to}
                  className="rounded-lg border border-line bg-wash/30 px-3 py-2 text-sm text-ink focus:bg-white"
                />
              </label>

              <label className="grid gap-1 text-xs font-medium text-ink">
                Fee
                <select
                  name="fee"
                  defaultValue={filters.fee}
                  className="rounded-lg border border-line bg-wash/30 px-3 py-2 text-sm text-ink focus:bg-white"
                >
                  <option value="">Any Fee</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/40 pt-3">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-navy/90 transition"
                >
                  Apply Filters
                </button>
                {activeCount > 0 ? (
                  <Link
                    href={basePath}
                    className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:bg-wash hover:text-ink transition"
                  >
                    <RotateCcw size={12} />
                    <span>Reset All</span>
                  </Link>
                ) : null}
              </div>

              {activeCount > 0 ? (
                <span className="text-xs text-accent font-medium">
                  {activeCount} {activeCount === 1 ? "filter active" : "filters active"}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
