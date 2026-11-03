import type {
  Achievement,
  CampusEvent,
  Category,
  CouncilBoard,
  CouncilKind,
  CouncilMember,
  CouncilYear,
  EventListing,
  EventStatus,
} from "@/lib/types";

export type EventQuery = {
  query?: string;
  category?: string;
  year?: string;
  status?: string;
  grade?: string;
  from?: string;
  to?: string;
  fee?: string;
  listing?: EventListing;
};

export function selectPublicEvents(events: CampusEvent[]) {
  return events.filter((event) => event.publicationStatus === "published");
}

export function selectPublicAchievements(achievements: Achievement[]) {
  return achievements.filter((item) => item.publicationStatus === "published");
}

export function selectPublicCouncil(years: CouncilYear[]) {
  return years
    .filter((year) => year.publicationStatus === "published")
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
}

export function councilYearsOfKind(years: CouncilYear[], kind: CouncilKind) {
  return selectPublicCouncil(years).filter((year) => year.kind === kind);
}

function councilPostKey(role: string) {
  return role
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(vice|deputy|captain)\b/g, "")
    .replace(/[^a-z]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isVicePost(role: string) {
  return /\b(vice|deputy)\b/i.test(role);
}

const memberSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function councilNameSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function councilMemberSlugs(members: { name: string; role: string; slug?: string | null }[]) {
  const taken = new Set<string>();
  return members.map((member) => {
    const fromName = councilNameSlug(member.name) || councilNameSlug(member.role) || "member";
    const current = member.slug && memberSlugPattern.test(member.slug) ? member.slug : "";
    const reusable = current === fromName || current.startsWith(`${fromName}-`);
    let slug = reusable && current && !taken.has(current) ? current : "";
    if (!slug && !taken.has(fromName)) slug = fromName;
    if (!slug) {
      const withRole = `${fromName}-${councilNameSlug(member.role) || "post"}`.replace(/-+/g, "-").slice(0, 80);
      if (!taken.has(withRole)) slug = withRole;
    }
    let n = 2;
    while (!slug || taken.has(slug)) {
      slug = `${fromName}-${n}`.slice(0, 80);
      n += 1;
    }
    taken.add(slug);
    return slug;
  });
}

export function findPublicCouncilMember(years: CouncilYear[], yearSlug: string, memberSlug: string) {
  const year = years.find((item) => item.slug === yearSlug);
  if (!year) return null;
  // Junior posts stay on the year page only; they have no profile route.
  const member = year.members.find((item) => item.slug === memberSlug && item.board !== "junior");
  if (!member) return null;
  return { year, member };
}

export function councilMembersOnBoard(members: CouncilMember[], board: CouncilBoard) {
  return members.filter((member) => (member.board ?? "main") === board);
}

export function isCouncilStaffRole(role: string) {
  const value = role.trim().toLowerCase();
  return (
    /^teacher\b/.test(value) ||
    /\bteacher in charge\b/.test(value) ||
    /\bcca\b/.test(value) ||
    /\bcoordinator\b/.test(value) ||
    /\bco-ordinator\b/.test(value)
  );
}

export function pairCouncilMembers(members: CouncilMember[]) {
  const ordered = members
    .filter((member) => !isCouncilStaffRole(member.role))
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const vices = new Map<string, CouncilMember>();
  for (const member of ordered) {
    if (isVicePost(member.role)) vices.set(councilPostKey(member.role), member);
  }

  const used = new Set<string>();
  const pairs: { lead: CouncilMember; deputy: CouncilMember | null }[] = [];
  for (const member of ordered) {
    if (isVicePost(member.role)) continue;
    const deputy = vices.get(councilPostKey(member.role)) ?? null;
    if (deputy) used.add(deputy.id);
    pairs.push({ lead: member, deputy });
  }
  for (const member of ordered) {
    if (isVicePost(member.role) && !used.has(member.id)) pairs.push({ lead: member, deputy: null });
  }
  return pairs;
}

function eventWhen(event: CampusEvent) {
  return event.endDate ?? event.eventDate ?? "";
}

function statusRank(status: EventStatus | null) {
  if (status === "ongoing") return 0;
  if (status === "upcoming") return 1;
  if (status === "completed") return 2;
  return 3;
}

export function compareCampusEvents(a: CampusEvent, b: CampusEvent) {
  const byStatus = statusRank(a.eventStatus) - statusRank(b.eventStatus);
  if (byStatus !== 0) return byStatus;
  if (a.eventStatus === "completed") {
    return eventWhen(b).localeCompare(eventWhen(a)) || a.title.localeCompare(b.title);
  }
  return (a.eventDate ?? "9999").localeCompare(b.eventDate ?? "9999") || a.title.localeCompare(b.title);
}

export function getCampusTodayDate(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Dubai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function isPastEvent(event: CampusEvent, today: string = getCampusTodayDate()): boolean {
  if (event.eventStatus === "completed") return true;
  const lastDate = event.endDate || event.eventDate;
  if (lastDate && lastDate < today) return true;
  return false;
}

export function isUpcomingEvent(event: CampusEvent, today: string = getCampusTodayDate()): boolean {
  if (isPastEvent(event, today)) return false;
  if (event.eventStatus === "ongoing") return false;
  if (event.eventStatus === "upcoming") {
    return true;
  }
  const targetDate = event.eventDate || event.endDate;
  return Boolean(targetDate && targetDate >= today);
}

export function getEffectiveEventStatus(
  event: CampusEvent,
  today: string = getCampusTodayDate(),
): EventStatus | null {
  if (isPastEvent(event, today)) {
    return "completed";
  }
  if (event.eventStatus === "ongoing") {
    return "ongoing";
  }
  if (isUpcomingEvent(event, today)) {
    return "upcoming";
  }
  return event.eventStatus;
}

export function eventStatusLabel(status: EventStatus | null) {
  if (status === "ongoing") return "On now";
  if (status === "upcoming") return "Coming up";
  if (status === "completed") return "Finished";
  return null;
}

export type CampusPulse = {
  tone: "live" | "next" | "quiet";
  label: string;
  href: string;
  detail: string;
};

export function campusPulse(events: CampusEvent[]): CampusPulse {
  const published = selectPublicEvents(events).filter((event) => !event.isSample);
  const today = getCampusTodayDate();
  const live = published.filter((event) => event.eventStatus === "ongoing" && !isPastEvent(event, today));
  if (live.length === 1) {
    return {
      tone: "live",
      label: live[0].title,
      href: `/events/${live[0].slug}`,
      detail: "Happening now",
    };
  }
  if (live.length > 1) {
    return {
      tone: "live",
      label: `${live.length} on now`,
      href: "/events?status=ongoing",
      detail: live.map((event) => event.title).join(", "),
    };
  }

  const next = published
    .filter((event) => isUpcomingEvent(event, today) && event.eventDate)
    .sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""));
  if (next[0]) {
    return {
      tone: "next",
      label: next[0].title,
      href: `/events/${next[0].slug}`,
      detail: formatEventDate(next[0].eventDate) ?? "Coming up",
    };
  }

  return {
    tone: "quiet",
    label: "Nothing live",
    href: "/events",
    detail: "No event is marked as happening now.",
  };
}

export function categoryById(categories: Category[], id: string) {
  return categories.find((category) => category.id === id) ?? null;
}

export function categoryBySlug(categories: Category[], slug: string) {
  return categories.find((category) => category.slug === slug) ?? null;
}

export function eventCategoryIds(event: CampusEvent) {
  const ids = event.categoryIds?.length ? event.categoryIds : [event.categoryId];
  return [...new Set(ids.filter(Boolean))];
}

export function filterPublishedEvents(
  events: CampusEvent[],
  categories: Category[],
  filters: EventQuery,
) {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const year = filters.year?.trim() ?? "";
  const status = filters.status?.trim() ?? "";
  const grade = Number(filters.grade?.trim() ?? "");
  const from = filters.from?.trim() ?? "";
  const to = filters.to?.trim() ?? "";
  const fee = filters.fee?.trim() ?? "";
  const listing = filters.listing;
  const category = categoryBySlug(categories, filters.category?.trim() ?? "");

  return selectPublicEvents(events)
    .filter((event) => {
      if (listing && (event.listing ?? "event") !== listing) return false;
      if (category && !eventCategoryIds(event).includes(category.id)) return false;
      if (status && event.eventStatus !== status) return false;
      if (year && !event.eventDate?.startsWith(`${year}-`)) return false;
      if (from && (event.eventDate ?? "") < from) return false;
      if (to && (event.eventDate ?? "9999-99-99") > to) return false;
      if (Number.isFinite(grade) && grade > 0) {
        if (event.gradeFrom == null || event.gradeTo == null) return false;
        if (grade < event.gradeFrom || grade > event.gradeTo) return false;
      }
      if (fee === "free" && !(event.feeAed == null || event.feeAed === 0)) return false;
      if (fee === "paid" && !(event.feeAed != null && event.feeAed > 0)) return false;
      if (!query) return true;
      const haystack = `${event.title} ${event.shortDescription} ${event.fullDescription}`.toLowerCase();
      return haystack.includes(query);
    })
    .sort(compareCampusEvents);
}

export function selectByListing(events: CampusEvent[], listing: EventListing) {
  return selectPublicEvents(events).filter((event) => (event.listing ?? "event") === listing);
}

export function publishedYears(events: CampusEvent[]) {
  const years = new Set<string>();
  for (const event of selectPublicEvents(events)) {
    const year = event.eventDate?.slice(0, 4);
    if (year && /^\d{4}$/.test(year)) years.add(year);
  }
  return [...years].sort((a, b) => Number(b) - Number(a));
}

export function relatedPublishedEvents(events: CampusEvent[], event: CampusEvent) {
  const visible = new Set(selectPublicEvents(events).map((item) => item.id));
  return event.relatedIds
    .filter((id) => visible.has(id) && id !== event.id)
    .map((id) => events.find((item) => item.id === id))
    .filter((item): item is CampusEvent => Boolean(item));
}

export function formatEventDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
