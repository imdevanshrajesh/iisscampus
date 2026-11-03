/**
 * Smart Built-in Campus AI Extractor & Generator
 * Provides intelligent, zero-failure extraction of events and campus records
 * from raw natural language chat messages and bullet points.
 */

export type ExtractedEvent = {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  categoryName?: string;
  listing: "event" | "competition" | "external";
  eventDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  locationName: string | null;
  gradeFrom: number | null;
  gradeTo: number | null;
  feeAed: number;
  purpose: string | null;
  activities: string | null;
  packingList: string | null;
  schedule: Array<{ time: string; title: string; detail: string }>;
  checklist: Array<{ item: string; required: boolean; detail: string }>;
};

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseRelativeDate(text: string): string | null {
  const lower = text.toLowerCase();
  const now = new Date();

  if (lower.includes("today")) {
    return formatLocalDate(now);
  }
  if (lower.includes("tomorrow")) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return formatLocalDate(d);
  }

  // Days of week: "next friday", "this saturday", etc.
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  for (let i = 0; i < daysOfWeek.length; i++) {
    const dayName = daysOfWeek[i];
    if (lower.includes(`next ${dayName}`) || lower.includes(`this ${dayName}`) || lower.includes(`on ${dayName}`)) {
      const currentDay = now.getDay();
      let diff = i - currentDay;
      if (diff <= 0) diff += 7;
      if (lower.includes(`next ${dayName}`) && diff < 7) diff += 7;
      const target = new Date(now);
      target.setDate(target.getDate() + diff);
      return formatLocalDate(target);
    }
  }

  // Month day formats: e.g. "Nov 28", "November 28", "Dec 15, 2026"
  const monthRegex =
    /(?:on\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?/i;
  const monthMatch = text.match(monthRegex);
  if (monthMatch) {
    const monthNames = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    const prefix = monthMatch[1].toLowerCase().slice(0, 3);
    const monthIdx = monthNames.indexOf(prefix);
    const day = parseInt(monthMatch[2], 10);
    const year = monthMatch[3] ? parseInt(monthMatch[3], 10) : now.getFullYear();
    if (monthIdx !== -1 && day >= 1 && day <= 31) {
      const d = new Date(year, monthIdx, day);
      return formatLocalDate(d);
    }
  }

  // ISO format: YYYY-MM-DD
  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) return isoMatch[1];

  return null;
}

function parseTimes(text: string): { startTime: string | null; endTime: string | null } {
  // Format: "from 3:00 PM to 6:30 PM", "3pm to 5pm", "at 10:00 AM", "9am - 2pm"
  const rangeRegex =
    /(?:from\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|-|until)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i;
  const rangeMatch = text.match(rangeRegex);
  if (rangeMatch) {
    return {
      startTime: normalizeTime(rangeMatch[1]),
      endTime: normalizeTime(rangeMatch[2]),
    };
  }

  const singleRegex = /(?:at\s+)(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i;
  const singleMatch = text.match(singleRegex);
  if (singleMatch) {
    return {
      startTime: normalizeTime(singleMatch[1]),
      endTime: null,
    };
  }

  return { startTime: null, endTime: null };
}

function normalizeTime(timeStr: string): string {
  const clean = timeStr.trim().toLowerCase();
  const isPm = clean.includes("pm");
  const isAm = clean.includes("am");
  const numPart = clean.replace(/am|pm/g, "").trim();
  const parts = numPart.split(":");
  let hour = parseInt(parts[0], 10);
  const min = parts[1] ? parts[1].padStart(2, "0") : "00";

  if (isPm && hour < 12) hour += 12;
  if (isAm && hour === 12) hour = 0;

  return `${String(hour).padStart(2, "0")}:${min}`;
}

function parseLocation(text: string): string | null {
  // Look for "at the ...", "in the ...", "venue: ..."
  const venueMatch = text.match(
    /(?:at the|in the|venue:|location:)\s+([A-Za-z0-9\s&'-]+?)(?=(?:from|for|on|with|\.|\n|$))/i,
  );
  if (venueMatch && venueMatch[1].trim().length > 2) {
    return venueMatch[1].trim();
  }

  const commonVenues = [
    "Main Turf Ground",
    "Sports Complex",
    "Main Auditorium",
    "Innovation Lab",
    "STEM Lab",
    "Central Courtyard",
    "Swimming Pool",
    "Secondary Quadrangle",
    "School Library",
    "Multi-Purpose Hall",
  ];

  for (const v of commonVenues) {
    if (text.toLowerCase().includes(v.toLowerCase())) return v;
  }

  return "Campus Main Hall";
}

function parseGrades(text: string): { gradeFrom: number | null; gradeTo: number | null } {
  const match = text.match(/grades?\s+(\d{1,2})\s*(?:to|-)\s*(\d{1,2})/i);
  if (match) {
    return {
      gradeFrom: parseInt(match[1], 10),
      gradeTo: parseInt(match[2], 10),
    };
  }
  const single = text.match(/grade\s+(\d{1,2})/i);
  if (single) {
    const g = parseInt(single[1], 10);
    return { gradeFrom: g, gradeTo: g };
  }
  if (/senior|secondary/i.test(text)) {
    return { gradeFrom: 9, gradeTo: 12 };
  }
  if (/primary|junior/i.test(text)) {
    return { gradeFrom: 1, gradeTo: 5 };
  }
  return { gradeFrom: 5, gradeTo: 12 };
}

export function extractEventFromNaturalText(
  rawText: string,
  categories: Array<{ id: string; name: string; slug: string }> = [],
): ExtractedEvent {
  const text = rawText.trim();

  // 1. Extract Title
  let title = "Campus Event";
  const titleMatches = [
    /(?:add an? event(?:\s+called|\s+named)?[:\s]+)([^.,\n]+)/i,
    /(?:create an? event(?:\s+called|\s+named)?[:\s]+)([^.,\n]+)/i,
    /(?:organizing|hosting)\s+(?:an?|the)?\s*([^.,\n]+)/i,
    /(?:event:\s*)([^.,\n]+)/i,
  ];

  for (const regex of titleMatches) {
    const m = text.match(regex);
    if (m && m[1].trim().length > 3) {
      title = m[1].trim();
      break;
    }
  }

  if (title === "Campus Event") {
    // Pick the first clean phrase
    const firstLine = text.split("\n")[0].split(".")[0];
    title = firstLine
      .replace(/^(can you|please|i want to|let's|hey|add|create)\s+/i, "")
      .replace(/^(an?|the)\s+/i, "")
      .trim();
    if (title.length > 50) {
      title = title.slice(0, 50).trim();
    }
  }

  // Capitalize title
  title = title.replace(/\b\w/g, (c) => c.toUpperCase());

  // 2. Slug
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // 3. Dates & Times
  const eventDate = parseRelativeDate(text) || formatLocalDate(new Date(Date.now() + 86400000 * 7));
  const { startTime, endTime } = parseTimes(text);
  const locationName = parseLocation(text);
  const { gradeFrom, gradeTo } = parseGrades(text);

  // 4. Category matching
  let selectedCategory = categories[0]?.id || "sports";
  let selectedCategoryName = categories[0]?.name || "General";

  const lowerText = text.toLowerCase();
  for (const cat of categories) {
    const cName = cat.name.toLowerCase();
    if (
      lowerText.includes(cName) ||
      (cName.includes("sport") && /football|cricket|basketball|swim|athletic|volleyball|match|tournament|game/.test(lowerText)) ||
      (cName.includes("academic") && /debate|quiz|exam|olympiad|science|math|spelling/.test(lowerText)) ||
      (cName.includes("cultural") && /art|dance|music|drama|festival|day|celebration/.test(lowerText)) ||
      (cName.includes("house") && /house|ruby|emerald|sapphire|topaz/.test(lowerText))
    ) {
      selectedCategory = cat.id;
      selectedCategoryName = cat.name;
      break;
    }
  }

  // 5. Short & Full Descriptions
  const shortDescription = `${title} organized for grades ${gradeFrom || 5}-${gradeTo || 12} at ${locationName}. Features inter-house participation, structured competitions, and awards.`;

  const fullDescription = `The India International School invites students of Grades ${gradeFrom || 5} to ${gradeTo || 12} to participate in the ${title}, scheduled to take place at ${locationName}.

This campus initiative aims to cultivate excellence, sportsmanship, and teamwork. Students will represent their respective houses and classes in a spirited, well-coordinated series of competitive activities.

All participants must report in designated school attire with proper equipment and water bottles. Parent consent slips and event badges must be presented at the check-in desk prior to commencement. Certificates and house honor trophies will be awarded during the closing assembly.`;

  // 6. Schedule
  const sTime = startTime || "09:00";
  const eTime = endTime || "13:30";
  const schedule = [
    {
      time: sTime,
      title: "Assembly & Student Registration",
      detail: `Report to ${locationName} for house attendance and team kit verification.`,
    },
    {
      time: "10:15",
      title: "Opening Ceremonies & First Round",
      detail: "Inaugural address followed by preliminary rounds and competitive fixtures.",
    },
    {
      time: "12:00",
      title: "Final Matches & Deciders",
      detail: "Championship matches with faculty adjudicators and house cheering sections.",
    },
    {
      time: eTime,
      title: "Award Presentation & Dismissal",
      detail: "Trophy ceremony, house points tabulation, and orderly student dispersal.",
    },
  ];

  // 7. Checklist
  const checklist = [
    {
      item: "Cover Image",
      required: true,
      detail: "Upload a high-resolution 16:9 banner image (1200x675px) to the event gallery.",
    },
    {
      item: "Participant Roster",
      required: false,
      detail: "Verify house coordinator submissions and grade eligibility sheets.",
    },
    {
      item: "Registration Link",
      required: false,
      detail: "Add Google Form or external registration URL if individual signup is active.",
    },
  ];

  return {
    title,
    slug,
    shortDescription,
    fullDescription,
    categoryId: selectedCategory,
    categoryName: selectedCategoryName,
    listing: "event",
    eventDate,
    endDate: null,
    startTime: sTime,
    endTime: eTime,
    locationName,
    gradeFrom,
    gradeTo,
    feeAed: 0,
    purpose: `Fostering student leadership, house camaraderie, and active participation through ${title}.`,
    activities: `Structured tournament rounds, competitive trials, house point bonuses, and awards.`,
    packingList: "Official school house t-shirt, sports shoes, water bottle, and student ID badge.",
    schedule,
    checklist,
  };
}
