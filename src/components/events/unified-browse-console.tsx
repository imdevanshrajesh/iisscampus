"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  Filter,
  LayoutGrid,
  List,
  RotateCcw,
  Rows3,
  Search,
  X,
} from "lucide-react";
import { ActivityCalendar } from "@/components/events/activity-calendar";
import { EventCard } from "@/components/events/event-card";
import { EventRowTimeline } from "@/components/events/event-row-timeline";
import type { CampusEvent, Category } from "@/lib/types";

type ViewMode = "postcard" | "timeline" | "calendar" | "agenda";

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

export function UnifiedBrowseConsole({
  basePath,
  categories,
  years,
  filters,
  events,
  allEvents,
  hosts,
}: {
  basePath: "/events" | "/competitions";
  categories: Category[];
  years: string[];
  filters: Filters;
  events: CampusEvent[];
  allEvents: CampusEvent[];
  hosts: readonly string[];
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("postcard");

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

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(activeCount > 1);

  const calendarEvents = allEvents.filter((event) => !event.isSample);

  return (
    <div className="mt-8 space-y-8">
      {/* Unified Search, Filter, View Mode & Category Tab Console */}
      <div className="rounded-2xl border border-line/80 bg-white p-4 sm:p-5 shadow-xs">
        <form method="get" action={basePath}>
          {/* Row 1: Search Input + Filters Toggle + Search Button + View Mode Switches */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xl">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                name="q"
                defaultValue={filters.query}
                placeholder="Search fixtures, assemblies, competitions, or venues..."
                className="w-full rounded-xl border border-line bg-wash/30 pl-9 pr-9 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-navy focus:bg-white focus:outline-none transition"
              />
              {filters.query ? (
                <Link
                  href={basePath}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </Link>
              ) : null}
            </div>

            {/* Controls: Filters + Search + View Modes */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Drawer Toggle */}
              <button
                type="button"
                onClick={() => setFilterDrawerOpen((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
                  filterDrawerOpen || activeCount > 0
                    ? "border-navy bg-navy text-white shadow-xs"
                    : "border-line bg-wash/40 text-ink hover:bg-wash"
                }`}
              >
                <Filter size={14} />
                <span>{filterDrawerOpen ? "Hide Filters" : "Filters"}</span>
                {activeCount > 0 ? (
                  <span className="flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] text-white font-bold">
                    {activeCount}
                  </span>
                ) : null}
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${filterDrawerOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Submit Search Button */}
              <button
                type="submit"
                className="rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-accent-deep"
              >
                Search
              </button>

              {/* View Mode Switches */}
              <div className="inline-flex items-center rounded-xl border border-line bg-wash/40 p-1 shadow-2xs ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={() => setViewMode("postcard")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    viewMode === "postcard"
                      ? "bg-navy text-white shadow-xs"
                      : "text-muted hover:text-ink"
                  }`}
                  title="Visual Postcard Layout"
                  aria-label="Postcard Grid View"
                >
                  <LayoutGrid size={14} />
                  <span className="hidden sm:inline">Postcards</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("timeline")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    viewMode === "timeline"
                      ? "bg-navy text-white shadow-xs"
                      : "text-muted hover:text-ink"
                  }`}
                  title="Structured Date Timeline"
                  aria-label="Row Timeline View"
                >
                  <Rows3 size={14} />
                  <span className="hidden sm:inline">Timeline</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("calendar")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    viewMode === "calendar"
                      ? "bg-navy text-white shadow-xs"
                      : "text-muted hover:text-ink"
                  }`}
                  title="Monthly Calendar Grid"
                  aria-label="Monthly Calendar View"
                >
                  <CalendarDays size={14} />
                  <span className="hidden sm:inline">Calendar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("agenda")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    viewMode === "agenda"
                      ? "bg-navy text-white shadow-xs"
                      : "text-muted hover:text-ink"
                  }`}
                  title="Agenda List View"
                  aria-label="Agenda View"
                >
                  <List size={14} />
                  <span className="hidden sm:inline">Agenda</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Category Tabs Strip */}
          <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs border-t border-line/60 pt-3">
            <Link
              href={basePath}
              className={`shrink-0 rounded-full px-3.5 py-1.5 font-medium transition ${
                !filters.category
                  ? "bg-navy text-white shadow-2xs"
                  : "border border-line/80 bg-wash/30 text-muted hover:border-navy hover:text-ink"
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
                  className={`shrink-0 rounded-full px-3.5 py-1.5 font-medium transition duration-150 ${
                    isSelected
                      ? "bg-navy text-white shadow-2xs"
                      : "border border-line/70 bg-wash/30 text-ink/80 hover:border-navy hover:bg-white"
                  }`}
                >
                  {category.name}
                </Link>
              );
            })}
          </div>

          {/* Expandable Advanced Options Drawer */}
          {filterDrawerOpen ? (
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

                <label className="grid gap-1 text-xs font-medium text-ink">
                  Academic Year
                  <select
                    name="year"
                    defaultValue={filters.year}
                    className="rounded-lg border border-line bg-wash/30 px-3 py-2 text-sm text-ink focus:bg-white"
                  >
                    <option value="">Any Year</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs font-medium text-ink">
                  Status
                  <select
                    name="status"
                    defaultValue={filters.status}
                    className="rounded-lg border border-line bg-wash/30 px-3 py-2 text-sm text-ink focus:bg-white"
                  >
                    <option value="">Any Status</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">On Now</option>
                    <option value="completed">Finished</option>
                  </select>
                </label>

                <label className="grid gap-1 text-xs font-medium text-ink">
                  Target Grade
                  <select
                    name="grade"
                    defaultValue={filters.grade}
                    className="rounded-lg border border-line bg-wash/30 px-3 py-2 text-sm text-ink focus:bg-white"
                  >
                    <option value="">All Grades</option>
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={String(g)}>
                        Grade {g}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/40 pt-3 text-xs">
                <span className="text-muted">
                  {activeCount > 0 ? `${activeCount} filter criteria active` : "No extra filters applied"}
                </span>

                <div className="flex items-center gap-3">
                  {activeCount > 0 ? (
                    <Link
                      href={basePath}
                      className="inline-flex items-center gap-1 text-muted hover:text-accent transition"
                    >
                      <RotateCcw size={12} />
                      <span>Reset All</span>
                    </Link>
                  ) : null}

                  <button
                    type="submit"
                    className="rounded-lg bg-navy px-3.5 py-1.5 font-medium text-white hover:bg-navy/90 transition shadow-2xs"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </form>
      </div>

      {/* Render Selected View */}
      {viewMode === "calendar" ? (
        <div className="animate-in fade-in duration-300">
          <ActivityCalendar events={calendarEvents} />
        </div>
      ) : viewMode === "agenda" ? (
        <div className="animate-in fade-in duration-300 space-y-3">
          {events.length ? (
            events.map((event) => (
              <EventRowTimeline
                key={event.id}
                event={event}
                categories={categories}
                hosts={hosts}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-line p-10 text-center text-sm text-muted">
              {activeCount > 0 ? "Nothing matches those filters." : "Nothing published here yet."}
            </div>
          )}
        </div>
      ) : viewMode === "timeline" ? (
        <div className="space-y-3 animate-in fade-in duration-300">
          {events.length ? (
            events.map((event) => (
              <EventRowTimeline
                key={event.id}
                event={event}
                categories={categories}
                hosts={hosts}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-line p-12 text-center text-sm text-muted">
              {activeCount > 0 ? "Nothing matches those filters." : "Nothing published here yet."}
            </div>
          )}
        </div>
      ) : (
        /* Visual Postcard View (Default) */
        <div className="animate-in fade-in duration-300">
          {events.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  categories={categories}
                  hosts={hosts}
                  priority={index < 3}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-line p-12 text-center text-sm text-muted">
              {activeCount > 0 ? "Nothing matches those filters." : "Nothing published here yet."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
