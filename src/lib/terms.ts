import type {
  AcademicTermConfig,
  Achievement,
  Announcement,
  CampusEvent,
  CouncilYear,
  SocialPost,
} from "./types";

export const EMPTY_ACADEMIC_TERM: AcademicTermConfig = {
  label: null,
  startDate: null,
};

export function normalizeTermText(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .replace(/[\u2012-\u2015]/g, "-")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function cleanTermLabel(value?: string | null): string | null {
  const text = String(value ?? "")
    .trim()
    .replace(/[\u2012-\u2015]/g, "-")
    .replace(/\s+/g, " ");
  return text || null;
}

export function cleanTermStartDate(value?: string | null): string | null {
  const text = String(value ?? "").trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

export function hasActiveTerm(term?: AcademicTermConfig | null): boolean {
  return Boolean(cleanTermLabel(term?.label) || cleanTermStartDate(term?.startDate));
}

function inferredStartDateFromLabel(label?: string | null): string | null {
  const clean = cleanTermLabel(label);
  if (!clean) return null;
  const spanMatch = /^(\d{4})\s*-\s*(\d{2,4})$/.exec(clean);
  if (spanMatch?.[1]) return `${spanMatch[1]}-04-01`;
  const yearMatch = /^(\d{4})$/.exec(clean);
  if (yearMatch?.[1]) return `${yearMatch[1]}-01-01`;
  return null;
}

function effectiveTermCutoff(term?: AcademicTermConfig | null): string | null {
  return cleanTermStartDate(term?.startDate) ?? inferredStartDateFromLabel(term?.label);
}

export type TermMatchRecord = {
  academicYear?: string | null;
  eventDate?: string | null;
  endDate?: string | null;
  publishedOn?: string | null;
  createdAt?: string | null;
};

function recordBestDate(record: TermMatchRecord): string | null {
  const candidates = [record.endDate, record.eventDate, record.publishedOn, record.createdAt];
  for (const raw of candidates) {
    const day = String(raw ?? "").trim().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  }
  return null;
}

export function matchesAcademicTerm(
  record: TermMatchRecord,
  term?: AcademicTermConfig | null,
): boolean {
  if (!hasActiveTerm(term)) return true;

  const activeLabel = normalizeTermText(term?.label);
  const recordLabel = normalizeTermText(record.academicYear);

  if (recordLabel) {
    if (activeLabel) return recordLabel === activeLabel;
  }

  const cutoff = effectiveTermCutoff(term);
  const date = recordBestDate(record);

  if (cutoff && date) {
    return date >= cutoff;
  }

  if (recordLabel && !activeLabel) {
    const startMatch = /^(\d{4})/.exec(recordLabel);
    if (startMatch?.[1] && cutoff) {
      return `${startMatch[1]}-12-31` >= cutoff;
    }
  }

  return false;
}

export function filterEventsForTerm(
  events: CampusEvent[],
  term?: AcademicTermConfig | null,
): CampusEvent[] {
  if (!hasActiveTerm(term)) return events;
  return events.filter((event) =>
    matchesAcademicTerm(
      {
        academicYear: event.academicYear,
        eventDate: event.eventDate,
        endDate: event.endDate,
        createdAt: event.createdAt,
      },
      term,
    ),
  );
}

export function filterAchievementsForTerm(
  achievements: Achievement[],
  term?: AcademicTermConfig | null,
): Achievement[] {
  if (!hasActiveTerm(term)) return achievements;
  return achievements.filter((item) =>
    matchesAcademicTerm(
      {
        academicYear: item.academicYear,
        eventDate: item.eventDate,
        createdAt: item.createdAt,
      },
      term,
    ),
  );
}

export function filterAnnouncementsForTerm(
  announcements: Announcement[],
  term?: AcademicTermConfig | null,
): Announcement[] {
  if (!hasActiveTerm(term)) return announcements;
  return announcements.filter((item) =>
    matchesAcademicTerm(
      {
        academicYear: item.academicYear,
        createdAt: item.createdAt,
      },
      term,
    ),
  );
}

export function filterSocialPostsForTerm(
  posts: SocialPost[],
  term?: AcademicTermConfig | null,
): SocialPost[] {
  if (!hasActiveTerm(term)) return posts;
  return posts.filter((post) =>
    matchesAcademicTerm(
      {
        academicYear: post.academicYear,
        publishedOn: post.publishedOn,
        createdAt: post.createdAt,
      },
      term,
    ),
  );
}

export function councilKindOrderRank(kind: CouncilYear["kind"]): number {
  if (kind === "current") return 0;
  if (kind === "upcoming") return 1;
  return 2;
}

export function compareCouncilYears(a: CouncilYear, b: CouncilYear): number {
  const rankDiff = councilKindOrderRank(a.kind) - councilKindOrderRank(b.kind);
  if (rankDiff !== 0) return rankDiff;
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return b.label.localeCompare(a.label);
}

export function partitionCouncilYears(years: CouncilYear[]): {
  primary: CouncilYear | null;
  collapsed: CouncilYear[];
  ordered: CouncilYear[];
} {
  const ordered = years.slice().sort(compareCouncilYears);
  if (!ordered.length) {
    return { primary: null, collapsed: [], ordered: [] };
  }
  const explicitCurrent = ordered.find((year) => year.kind === "current");
  const primary = explicitCurrent ?? ordered[0];
  const collapsed = ordered.filter((year) => year.id !== primary.id);
  return { primary, collapsed, ordered };
}

export function suggestNextTermLabel(
  currentLabel?: string | null,
  referenceDate: Date = new Date(),
): string {
  const clean = cleanTermLabel(currentLabel);
  if (clean) {
    const span = /^(\d{4})-(\d{2,4})$/.exec(clean);
    if (span?.[1]) {
      const nextStart = Number(span[1]) + 1;
      if (span[2] && span[2].length === 2) {
        return `${nextStart}-${String((nextStart + 1) % 100).padStart(2, "0")}`;
      }
      return `${nextStart}-${nextStart + 1}`;
    }
    const single = /^(\d{4})$/.exec(clean);
    if (single?.[1]) {
      return String(Number(single[1]) + 1);
    }
  }
  const year = referenceDate.getUTCFullYear();
  return `${year}-${year + 1}`;
}
