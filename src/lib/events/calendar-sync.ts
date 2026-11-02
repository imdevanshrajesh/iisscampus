import type { CampusEvent } from "@/lib/types";

function formatDateToICS(dateStr?: string | null, timeStr?: string | null): string {
  if (!dateStr) {
    const now = new Date();
    return now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }
  const cleanDate = dateStr.replace(/-/g, "");
  if (timeStr && timeStr.includes(":")) {
    const [hh, mm] = timeStr.split(":");
    return `${cleanDate}T${hh.padStart(2, "0")}${mm.padStart(2, "0")}00Z`;
  }
  return `${cleanDate}T090000Z`;
}

function formatEndDateToICS(startDateStr?: string | null, endDateStr?: string | null, endTimeStr?: string | null): string {
  const targetDate = endDateStr || startDateStr;
  if (!targetDate) return formatDateToICS();
  const cleanDate = targetDate.replace(/-/g, "");
  if (endTimeStr && endTimeStr.includes(":")) {
    const [hh, mm] = endTimeStr.split(":");
    return `${cleanDate}T${hh.padStart(2, "0")}${mm.padStart(2, "0")}00Z`;
  }
  return `${cleanDate}T170000Z`;
}

export function generateGoogleCalendarUrl(event: CampusEvent): string {
  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(
    `${event.shortDescription || ""}\n\nView on IISS Campus: https://iissboys.com/events/${event.slug}`.trim()
  );
  const location = encodeURIComponent(event.locationName || "IISS Boys Campus");
  const start = formatDateToICS(event.eventDate, event.startTime);
  const end = formatEndDateToICS(event.eventDate, event.endDate, event.endTime);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}

export function generateICSDataUri(event: CampusEvent): string {
  const start = formatDateToICS(event.eventDate, event.startTime);
  const end = formatEndDateToICS(event.eventDate, event.endDate, event.endTime);
  const summary = (event.title || "Campus Event").replace(/[,;\\]/g, " ");
  const description = (event.shortDescription || "").replace(/[\r\n]+/g, "\\n").replace(/[,;\\]/g, " ");
  const location = (event.locationName || "IISS Boys Campus").replace(/[,;\\]/g, " ");

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IISS Boys Campus//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id || Date.now()}@iissboys.com`,
    `DTSTAMP:${formatDateToICS()}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const icsString = icsLines.join("\r\n");
  return `data:text/calendar;charset=utf8,${encodeURIComponent(icsString)}`;
}
