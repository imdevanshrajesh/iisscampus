"use client";

import { useMemo, useState } from "react";
import { PreviewTrigger } from "@/components/preview/preview-provider";
import { formatEventDate } from "@/lib/data/catalog";
import type { CampusEvent } from "@/lib/types";

function tone(event: CampusEvent) {
  if (event.listing === "external") return "bg-sky/15 text-sky";
  if (event.listing === "competition") return "bg-navy/10 text-navy";
  return "bg-accent/10 text-accent";
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

export function ActivityCalendar({ events }: { events: CampusEvent[] }) {
  const dated = events.filter((event) => event.eventDate);
  const today = new Date();
  const [cursor, setCursor] = useState({
    year: today.getUTCFullYear(),
    month: today.getUTCMonth(),
  });
  const [mode, setMode] = useState<"month" | "week">("month");

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

  return (
    <section className="rounded-[1.5rem] border border-line bg-white p-3 sm:p-5 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Calendar</p>
          <h2 className="font-display mt-1 truncate text-xl text-ink sm:text-2xl">
            {monthLabel(cursor.year, cursor.month)}
          </h2>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] uppercase tracking-[0.12em] text-muted">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-accent" /> Event
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-navy" /> Ours
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sky" /> Other school
            </span>
          </p>
          <div className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
            <button
              type="button"
              className={`rounded-md border px-2 py-1.5 text-xs sm:px-3 sm:text-sm ${
                mode === "month" ? "border-navy bg-navy text-white" : "border-line"
              }`}
              onClick={() => setMode("month")}
            >
              Month
            </button>
            <button
              type="button"
              className={`rounded-md border px-2 py-1.5 text-xs sm:px-3 sm:text-sm ${
                mode === "week" ? "border-navy bg-navy text-white" : "border-line"
              }`}
              onClick={() => setMode("week")}
            >
              Week
            </button>
            <button
              type="button"
              className="rounded-md border border-line px-2 py-1.5 text-xs sm:px-3 sm:text-sm"
              onClick={() => shift(-1)}
            >
              Prev
            </button>
            <button
              type="button"
              className="rounded-md border border-line px-2 py-1.5 text-xs sm:px-3 sm:text-sm"
              onClick={() => shift(1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 sm:mt-5 sm:gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
          <div
            key={label}
            className="text-center text-[0.65rem] uppercase tracking-[0.14em] text-muted"
          >
            <span className="sm:hidden">{label.slice(0, 1)}</span>
            <span className="hidden sm:inline">{label}</span>
          </div>
        ))}
        {cells.map((cell, index) => {
          if (!cell) return <div key={`blank-${index}`} className="min-h-11 rounded-lg bg-wash/40 sm:min-h-20 sm:rounded-xl" />;
          const items = byDate.get(cell.key) ?? [];
          return (
            <div
              key={cell.key}
              className={`min-h-11 rounded-lg border border-line/70 p-1 sm:min-h-20 sm:rounded-xl sm:p-2 ${
                cell.inMonth ? "bg-white" : "bg-wash/50 opacity-70"
              }`}
            >
              <p className="text-[0.65rem] text-muted sm:text-xs">{cell.day}</p>

              {/* Mobile: dots only so the 7-day grid stays readable */}
              {items.length ? (
                <div className="mt-1 flex flex-wrap justify-center gap-0.5 sm:hidden">
                  {items.slice(0, 4).map((event) => (
                    <PreviewTrigger
                      key={event.id}
                      event={event}
                      className={`block h-1.5 w-1.5 shrink-0 overflow-hidden rounded-full p-0 ${dotTone(event)}`}
                    >
                      <span className="sr-only">{event.title}</span>
                    </PreviewTrigger>
                  ))}
                  {items.length > 4 ? (
                    <span className="text-[0.55rem] leading-none text-muted">+</span>
                  ) : null}
                </div>
              ) : null}

              <ul className="mt-1 hidden space-y-1 sm:block">
                {items.slice(0, 3).map((event) => (
                  <li key={event.id} className="group relative z-10 hover:z-30 focus-within:z-30">
                    <PreviewTrigger
                      event={event}
                      className={`block w-full whitespace-normal break-words rounded px-1 py-0.5 text-left text-[0.7rem] leading-snug ${tone(event)}`}
                    >
                      {event.title}
                    </PreviewTrigger>
                    <div className="pointer-events-none absolute top-full left-0 z-30 mt-1 hidden w-44 rounded-md border border-line bg-white p-2 text-left shadow-[0_8px_24px_rgba(20,27,56,0.12)] group-hover:block group-focus-within:block">
                      <p className="text-xs font-medium leading-snug text-ink">{event.title}</p>
                      <p className="mt-1 text-[0.65rem] text-muted">
                        {[
                          event.listing === "external" ? event.hostName || "Another school" : null,
                          formatEventDate(event.eventDate),
                          event.locationName,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </li>
                ))}
                {items.length > 3 ? <li className="text-[0.65rem] text-muted">+{items.length - 3} more</li> : null}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
