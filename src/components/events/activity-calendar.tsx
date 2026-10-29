"use client";

import { useMemo, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, ListFilter, MapPin, Sparkles } from "lucide-react";
import { PreviewTrigger } from "@/components/preview/preview-provider";
import { formatEventDate } from "@/lib/data/catalog";
import type { CampusEvent } from "@/lib/types";

function tone(event: CampusEvent) {
  if (event.listing === "external") return "bg-sky/15 text-sky border-sky/30";
  if (event.listing === "competition") return "bg-navy/10 text-navy border-navy/20";
  return "bg-accent/10 text-accent border-accent/25";
}

function dotTone(event: CampusEvent) {
  if (event.listing === "external") return "bg-sky";
  if (event.listing === "competition") return "bg-navy";
  return "bg-accent";
}

function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(year, month, 1)),
  );
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function startWeekday(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1)).getUTCDay();
}

function formatFullDate(dateStr: string) {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return dateStr;
    const date = new Date(Date.UTC(y, m - 1, d));
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function ActivityCalendar({ events }: { events: CampusEvent[] }) {
  const dated = useMemo(() => events.filter((event) => event.eventDate), [events]);
  const today = useMemo(() => new Date(), []);
  const todayKey = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;

  const [cursor, setCursor] = useState({
    year: today.getUTCFullYear(),
    month: today.getUTCMonth(),
  });
  const [mode, setMode] = useState<"month" | "week" | "agenda">("month");
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);

  const byDate = useMemo(() => {
    const map = new Map<string, CampusEvent[]>();
    for (const event of dated) {
      const key = event.eventDate!;
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [dated]);

  // All events in the current month
  const monthEvents = useMemo(() => {
    const monthPrefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
    return dated
      .filter((e) => e.eventDate?.startsWith(monthPrefix))
      .sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""));
  }, [dated, cursor]);

  const cells = useMemo(() => {
    if (mode === "week") {
      const start = new Date(Date.UTC(cursor.year, cursor.month, today.getUTCDate()));
      const day = start.getUTCDay();
      start.setUTCDate(start.getUTCDate() - day);
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start);
        date.setUTCDate(start.getUTCDate() + index);
        const key = date.toISOString().slice(0, 10);
        return { key, day: date.getUTCDate(), inMonth: date.getUTCMonth() === cursor.month };
      });
    }

    const leading = startWeekday(cursor.year, cursor.month);
    const total = daysInMonth(cursor.year, cursor.month);
    const blanks = Array.from({ length: leading }, () => null);
    const days = Array.from({ length: total }, (_, index) => {
      const day = index + 1;
      const key = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return { key, day, inMonth: true };
    });
    return [...blanks, ...days];
  }, [cursor, mode, today]);

  function shift(delta: number) {
    setCursor((current) => {
      if (mode === "week") {
        const date = new Date(Date.UTC(current.year, current.month, today.getUTCDate()));
        date.setUTCDate(date.getUTCDate() + delta * 7);
        return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
      }
      const month = current.month + delta;
      const year = current.year + Math.floor(month / 12);
      return { year, month: ((month % 12) + 12) % 12 };
    });
  }

  const selectedEvents = byDate.get(selectedDate) ?? [];

  return (
    <section className="rounded-[1.5rem] border border-line bg-white p-3.5 sm:p-5 md:p-6 shadow-xs">
      {/* Calendar Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between border-b border-line/60 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
            <p className="text-xs uppercase tracking-[0.16em] text-muted font-medium">Interactive Calendar</p>
          </div>
          <h2 className="font-display mt-1 truncate text-2xl text-ink sm:text-3xl">
            {monthLabel(cursor.year, cursor.month)}
          </h2>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          {/* Tone Legend */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] uppercase tracking-[0.12em] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Event
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-navy" /> Ours
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky" /> Other school
            </span>
          </div>

          {/* Controls: Mode & Prev/Next */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex rounded-lg border border-line bg-wash/50 p-0.5 text-xs font-medium">
              <button
                type="button"
                className={`rounded-md px-2.5 py-1 transition ${
                  mode === "month" ? "bg-navy text-white shadow-xs" : "text-muted hover:text-ink"
                }`}
                onClick={() => setMode("month")}
              >
                Month
              </button>
              <button
                type="button"
                className={`rounded-md px-2.5 py-1 transition ${
                  mode === "agenda" ? "bg-navy text-white shadow-xs" : "text-muted hover:text-ink"
                }`}
                onClick={() => setMode("agenda")}
              >
                Agenda
              </button>
            </div>

            <div className="inline-flex rounded-lg border border-line bg-white">
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-l-md text-ink hover:bg-wash transition"
                onClick={() => shift(-1)}
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="w-px bg-line" />
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-r-md text-ink hover:bg-wash transition"
                onClick={() => shift(1)}
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {mode === "agenda" ? (
        /* Agenda / List View: Perfect for Mobile */
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-muted pb-2 border-b border-line/40">
            <span>All events in {monthLabel(cursor.year, cursor.month)}</span>
            <span>{monthEvents.length} events</span>
          </div>

          {monthEvents.length ? (
            <div className="space-y-3">
              {monthEvents.map((event) => (
                <article
                  key={event.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-line p-3.5 bg-background hover:border-accent/50 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-accent uppercase tracking-wider">
                        {formatFullDate(event.eventDate ?? "")}
                      </span>
                      {event.startTime ? (
                        <span className="inline-flex items-center gap-1 text-muted">
                          <Clock size={12} /> {event.startTime}
                        </span>
                      ) : null}
                    </div>
                    <PreviewTrigger event={event} className="block text-left mt-1">
                      <h3 className="font-display text-lg text-ink hover:text-accent transition">
                        {event.title}
                      </h3>
                    </PreviewTrigger>
                    {event.locationName || event.hostName ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                        <MapPin size={12} />
                        {[event.hostName ? `Hosted by ${event.hostName}` : null, event.locationName]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  <PreviewTrigger
                    event={event}
                    className="self-start sm:self-center shrink-0 rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy/90"
                  >
                    View details
                  </PreviewTrigger>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted rounded-xl border border-dashed border-line bg-wash/30">
              No events scheduled for {monthLabel(cursor.year, cursor.month)}.
            </div>
          )}
        </div>
      ) : (
        /* Month Grid View */
        <>
          <div className="mt-4 grid grid-cols-7 gap-1 sm:mt-5 sm:gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
              <div
                key={label}
                className="text-center text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.14em] text-muted py-1"
              >
                <span className="sm:hidden">{label.slice(0, 1)}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            ))}

            {cells.map((cell, index) => {
              if (!cell) return <div key={`blank-${index}`} className="min-h-12 rounded-lg bg-wash/30 sm:min-h-22 sm:rounded-xl" />;
              const items = byDate.get(cell.key) ?? [];
              const isSelected = selectedDate === cell.key;
              const isToday = cell.key === todayKey;

              return (
                <button
                  type="button"
                  key={cell.key}
                  onClick={() => setSelectedDate(cell.key)}
                  className={`min-h-12 sm:min-h-22 rounded-lg sm:rounded-xl p-1.5 sm:p-2 text-left transition relative flex flex-col justify-between border ${
                    isSelected
                      ? "ring-2 ring-navy border-navy bg-navy/5 shadow-xs"
                      : cell.inMonth
                        ? "bg-white border-line/80 hover:border-line hover:bg-wash/30"
                        : "bg-wash/40 border-transparent opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[0.7rem] sm:text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center ${
                        isToday
                          ? "bg-accent text-white font-bold"
                          : isSelected
                            ? "font-bold text-navy"
                            : "text-muted"
                      }`}
                    >
                      {cell.day}
                    </span>

                    {/* Mobile visible badge for events on this day */}
                    {items.length ? (
                      <span className="sm:hidden flex items-center justify-center h-4.5 min-w-[1.125rem] px-1 rounded-full text-[9px] font-bold text-white bg-accent shadow-xs">
                        {items.length}
                      </span>
                    ) : null}
                  </div>

                  {/* Desktop event names */}
                  <ul className="mt-1 hidden w-full space-y-1 sm:block">
                    {items.slice(0, 2).map((event) => (
                      <li key={event.id} className="truncate">
                        <span
                          className={`block truncate rounded px-1.5 py-0.5 text-[0.68rem] font-medium leading-snug border ${tone(event)}`}
                        >
                          {event.title}
                        </span>
                      </li>
                    ))}
                    {items.length > 2 ? (
                      <li className="text-[0.65rem] text-muted font-medium pl-1">
                        +{items.length - 2} more
                      </li>
                    ) : null}
                  </ul>

                  {/* Mobile indicator dots */}
                  {items.length ? (
                    <div className="flex items-center justify-center gap-1 sm:hidden mt-0.5">
                      {items.slice(0, 3).map((event) => (
                        <span key={event.id} className={`h-1.5 w-1.5 rounded-full ${dotTone(event)}`} />
                      ))}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Dedicated Selected Date Events Drawer (Visible on Mobile & Desktop) */}
          <div className="mt-6 border-t border-line/70 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-accent" />
                <h3 className="text-sm font-semibold text-ink">
                  {formatFullDate(selectedDate)}
                </h3>
              </div>
              <span className="text-xs text-muted">
                {selectedEvents.length} {selectedEvents.length === 1 ? "event" : "events"} on this day
              </span>
            </div>

            {selectedEvents.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {selectedEvents.map((event) => (
                  <article
                    key={event.id}
                    className="flex flex-col justify-between rounded-xl border border-line bg-wash/30 p-3.5 hover:border-accent/40 transition shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold border ${tone(event)}`}>
                          {event.listing === "external" ? "Other School" : event.listing === "competition" ? "Competition" : "Campus Event"}
                        </span>
                        {event.startTime ? (
                          <span className="text-xs text-muted flex items-center gap-1">
                            <Clock size={11} /> {event.startTime}
                          </span>
                        ) : null}
                      </div>

                      <PreviewTrigger event={event} className="block text-left mt-2">
                        <h4 className="font-display text-base text-ink hover:text-accent transition font-medium">
                          {event.title}
                        </h4>
                      </PreviewTrigger>

                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                        {event.shortDescription}
                      </p>

                      {event.locationName ? (
                        <p className="mt-2 text-xs text-ink/80 flex items-center gap-1">
                          <MapPin size={11} className="text-muted" /> {event.locationName}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-3 pt-2 border-t border-line/50 flex justify-end">
                      <PreviewTrigger
                        event={event}
                        className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1"
                      >
                        Preview event ↗
                      </PreviewTrigger>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-line/60 bg-wash/20 p-4 text-center">
                <p className="text-xs text-muted">
                  No events on this day. Tap any day on the calendar above with dots to see its events, or switch to <button type="button" onClick={() => setMode("agenda")} className="font-semibold text-accent underline">Agenda view</button> to see all events this month.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
