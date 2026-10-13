import type { CampusEvent } from "@/lib/types";

export function formatEventDay(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatClock(value: string | null) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  const date = new Date(Date.UTC(2000, 0, 1, hours, minutes));
  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
}

export function eventHighlightRows(event: CampusEvent) {
  const startDay = formatEventDay(event.eventDate);
  const endDay = formatEventDay(event.endDate);
  const start = formatClock(event.startTime);
  const end = formatClock(event.endTime);
  const sameDay = Boolean(startDay) && (!endDay || endDay === startDay);
  const starts = startDay
    ? [startDay, sameDay ? [start, end].filter(Boolean).join(" – ") : start].filter(Boolean).join(" · ")
    : null;
  const ends = !sameDay && endDay ? [endDay, end].filter(Boolean).join(" · ") : null;
  const timeOnly = !startDay && (start || end) ? [start, end].filter(Boolean).join(" – ") : null;
  const grades =
    event.gradeFrom != null && event.gradeTo != null
      ? event.gradeFrom === event.gradeTo
        ? `Grade ${event.gradeFrom}`
        : `Grades ${event.gradeFrom}–${event.gradeTo}`
      : null;
  const fee =
    event.feeAed == null ? null : event.feeAed === 0 ? "Free" : `AED ${event.feeAed.toFixed(event.feeAed % 1 ? 2 : 0)}`;
  const limit = event.registrationLimit;
  const count = event.registrationCount ?? 0;
  const registration =
    event.registrationEnabled && limit != null
      ? count >= limit
        ? "Full"
        : `${Math.max(0, limit - count)} of ${limit} left`
      : null;

  return [
    starts ? { label: "Starts", value: starts } : null,
    ends ? { label: "Ends", value: ends } : null,
    timeOnly ? { label: "Time", value: timeOnly } : null,
    event.locationName ? { label: "Venue", value: event.locationName } : null,
    grades ? { label: "Grades", value: grades } : null,
    fee ? { label: "Fee", value: fee } : null,
    event.capacity != null ? { label: "Places", value: String(event.capacity) } : null,
    registration ? { label: "Registration", value: registration } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row));
}
