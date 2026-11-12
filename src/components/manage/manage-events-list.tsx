"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Filter, Search } from "lucide-react";
import { DeleteRecord } from "@/components/manage/delete-record";
import { canDelete } from "@/lib/auth/permissions";
import { formatEventDate } from "@/lib/data/catalog";
import { formatEventDay } from "@/lib/events/display";
import { deleteEvent } from "@/lib/manage/actions";
import { registrationState } from "@/lib/registration";
import { hasActiveTerm, matchesAcademicTerm } from "@/lib/terms";
import type { AcademicTermConfig, CampusEvent, CampusRole, PublicationStatus } from "@/lib/types";

const statusTone: Record<PublicationStatus, string> = {
  draft: "bg-wash text-ink border-line",
  in_review: "bg-sky/15 text-navy border-sky/30",
  published: "bg-accent/10 text-accent-deep border-accent/20",
  archived: "bg-line/60 text-muted border-line",
};

const statusMeta: Record<PublicationStatus, { title: string; desc: string; dot: string }> = {
  published: {
    title: "Published Events",
    desc: "Live on the public website and visible in campus calendars.",
    dot: "bg-emerald-500",
  },
  in_review: {
    title: "In Review",
    desc: "Submitted by staff, awaiting final review and publication.",
    dot: "bg-amber-500",
  },
  draft: {
    title: "Drafts",
    desc: "Unpublished work in progress.",
    dot: "bg-muted",
  },
  archived: {
    title: "Archived",
    desc: "Concluded or hidden events preserved for records.",
    dot: "bg-gray-400",
  },
};

const STATUS_ORDER: PublicationStatus[] = ["published", "in_review", "draft", "archived"];

export function ManageEventsList({
  events,
  role,
  initialQuery = "",
  initialStatus = "",
  activeTerm = null,
}: {
  events: CampusEvent[];
  role: CampusRole;
  initialQuery?: string;
  initialStatus?: string;
  activeTerm?: AcademicTermConfig | null;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [termFilter, setTermFilter] = useState<"all" | "current">("all");
  const termEnabled = hasActiveTerm(activeTerm);

  // Filter events based on search query, status filter, and term filter
  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      if (selectedStatus && event.publicationStatus !== selectedStatus) return false;
      if (
        termFilter === "current" &&
        termEnabled &&
        !matchesAcademicTerm(
          {
            academicYear: event.academicYear,
            eventDate: event.eventDate,
            endDate: event.endDate,
            createdAt: event.createdAt,
          },
          activeTerm,
        )
      ) {
        return false;
      }
      if (!q) return true;
      const haystack = `${event.title} ${event.shortDescription ?? ""} ${event.locationName ?? ""} ${event.academicYear ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [events, query, selectedStatus, termFilter, termEnabled, activeTerm]);

  // Group filtered events by status
  const grouped = useMemo(() => {
    const map: Record<PublicationStatus, CampusEvent[]> = {
      published: [],
      in_review: [],
      draft: [],
      archived: [],
    };
    for (const ev of filteredEvents) {
      if (map[ev.publicationStatus]) {
        map[ev.publicationStatus].push(ev);
      }
    }
    return map;
  }, [filteredEvents]);

  // Sections open state: Collapsed by default (all false).
  // If a specific status is filtered or search query entered, expand sections with results.
  const [openSections, setOpenSections] = useState<Record<PublicationStatus, boolean>>(() => {
    const initial: Record<PublicationStatus, boolean> = {
      published: false,
      in_review: false,
      draft: false,
      archived: false,
    };
    if (initialStatus && (initial as any)[initialStatus] !== undefined) {
      initial[initialStatus as PublicationStatus] = true;
    }
    return initial;
  });

  const toggleSection = (status: PublicationStatus) => {
    setOpenSections((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const expandAll = () => {
    setOpenSections({
      published: true,
      in_review: true,
      draft: true,
      archived: true,
    });
  };

  const collapseAll = () => {
    setOpenSections({
      published: false,
      in_review: false,
      draft: false,
      archived: false,
    });
  };

  const allCollapsed = Object.values(openSections).every((v) => !v);

  return (
    <div className="space-y-6">
      {/* Search, Filter, and Expand/Collapse Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white dark:bg-black p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Quick search events..."
              aria-label="Search events"
              className="w-full rounded-lg border border-line bg-white dark:bg-black text-ink dark:text-white pl-9 pr-3 py-2 text-sm outline-none transition focus:border-navy"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedStatus(val);
                if (val) {
                  setOpenSections((prev) => ({ ...prev, [val]: true }));
                }
              }}
              aria-label="Filter status"
              className="rounded-lg border border-line bg-white dark:bg-black text-ink dark:text-white px-3 py-2 text-sm outline-none transition focus:border-navy"
            >
              <option value="" className="bg-white dark:bg-black text-ink dark:text-white">All Statuses</option>
              <option value="published" className="bg-white dark:bg-black text-ink dark:text-white">Published</option>
              <option value="in_review" className="bg-white dark:bg-black text-ink dark:text-white">In Review</option>
              <option value="draft" className="bg-white dark:bg-black text-ink dark:text-white">Drafts</option>
              <option value="archived" className="bg-white dark:bg-black text-ink dark:text-white">Archived</option>
            </select>
            {termEnabled && (
              <select
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value as "all" | "current")}
                aria-label="Filter academic term"
                className="rounded-lg border border-line bg-white dark:bg-black text-ink dark:text-white px-3 py-2 text-sm outline-none transition focus:border-navy"
              >
                <option value="all" className="bg-white dark:bg-black text-ink dark:text-white">All Terms</option>
                <option value="current" className="bg-white dark:bg-black text-ink dark:text-white">
                  Current Term ({activeTerm?.label || activeTerm?.startDate})
                </option>
              </select>
            )}
          </div>
        </div>

        {/* Global Expand/Collapse buttons */}
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
            {filteredEvents.length} event{filteredEvents.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Collapsible Status Sections */}
      <div className="space-y-4">
        {STATUS_ORDER.map((status) => {
          const list = grouped[status];
          if (selectedStatus && selectedStatus !== status) return null;
          const meta = statusMeta[status];
          // If searching and list has matches, auto-open unless user specifically closed it
          const isOpen = openSections[status] || (Boolean(query) && list.length > 0);

          return (
            <section
              key={status}
              className="rounded-2xl border border-line bg-white shadow-[0_1px_0_rgba(20,27,56,0.04)] overflow-hidden transition"
            >
              {/* Accordion Section Header */}
              <button
                type="button"
                onClick={() => toggleSection(status)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-white hover:bg-[#fbfaf4] transition cursor-pointer select-none border-b border-transparent data-[open=true]:border-line"
                data-open={isOpen}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${meta.dot} shrink-0`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-ink tracking-tight">{meta.title}</h2>
                      <span className="rounded-full bg-navy/5 px-2.5 py-0.5 text-xs font-bold text-navy">
                        {list.length}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted hidden sm:block">{meta.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-muted">
                  <span className="text-xs font-medium">{isOpen ? "Hide" : "Show"}</span>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 transition-transform text-accent" />
                  ) : (
                    <ChevronRight className="h-4 w-4 transition-transform" />
                  )}
                </div>
              </button>

              {/* Accordion Content */}
              {isOpen && (
                <div className="p-4 sm:p-5 pt-2 bg-[#faf9f5]/40">
                  {list.length > 0 ? (
                    <ul className="grid gap-3">
                      {list.map((event) => {
                        const start = formatEventDate(event.eventDate);
                        const end = formatEventDate(event.endDate);
                        const when = start && end && end !== start ? `${start} – ${end}` : start;
                        const registration = registrationState(event);
                        const due = formatEventDay(event.registrationDeadline);

                        return (
                          <li
                            key={event.id}
                            className="rounded-xl border border-line bg-white p-4 shadow-xs transition hover:border-navy hover:shadow-sm"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Link
                                    href={`/manage/events/${event.id}/edit`}
                                    className="font-medium text-ink hover:text-accent transition"
                                  >
                                    {event.title}
                                  </Link>
                                  <span
                                    className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.12em] ${statusTone[event.publicationStatus]}`}
                                  >
                                    {event.publicationStatus.replace("_", " ")}
                                  </span>
                                  {event.featured ? (
                                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[0.65rem] font-medium text-accent">
                                      Featured
                                    </span>
                                  ) : null}
                                  {event.academicYear ? (
                                    <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-[0.65rem] font-medium text-muted">
                                      {event.academicYear}
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-1 text-xs text-muted">
                                  {[when, event.locationName].filter(Boolean).join(" · ") || "Date not set"}
                                </p>
                                {event.registrationEnabled ? (
                                  <p className="mt-1 text-xs text-ink/80">
                                    {registration.state === "full"
                                      ? "Registration full"
                                      : registration.state === "closed"
                                        ? `Registration closed${due ? ` on ${due}` : ""}`
                                        : registration.state === "open" && registration.full
                                          ? `Full · other form${due ? ` · due ${due}` : ""}`
                                          : due
                                            ? `Register by ${due}`
                                            : "Registration open"}
                                    {event.registrationLimit != null
                                      ? ` · ${event.registrationCount} of ${event.registrationLimit}`
                                      : ""}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs">
                                <a
                                  href={`/events/${event.slug}?preview=1`}
                                  className="font-medium text-accent hover:underline"
                                  rel="noopener noreferrer"
                                  target="_blank"
                                >
                                  Preview
                                </a>
                                <Link
                                  href={`/manage/events/${event.id}/edit`}
                                  className="rounded-md border border-line bg-[#fbfaf4] px-2.5 py-1 font-medium text-ink transition hover:border-navy hover:bg-white"
                                >
                                  Edit
                                </Link>
                                {canDelete({ userId: "staff", role }, event.publicationStatus) ? (
                                  <DeleteRecord action={deleteEvent} id={event.id} label="Delete" />
                                ) : null}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="rounded-xl border border-dashed border-line bg-white/60 p-6 text-center text-xs text-muted">
                      No {meta.title.toLowerCase()} match your current filter.
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
