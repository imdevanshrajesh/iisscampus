import type { Achievement, CampusEvent, Category, CouncilKind, CouncilMember, CouncilYear, EventStatus } from "@/lib/types";

export type EventQuery = {
  query?: string;
  category?: string;
  year?: string;
  status?: string;
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
  const live = published.filter((event) => event.eventStatus === "ongoing");
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
    .filter((event) => event.eventStatus === "upcoming" && event.eventDate)
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

export function filterPublishedEvents(
  events: CampusEvent[],
  categories: Category[],
  filters: EventQuery,
) {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const year = filters.year?.trim() ?? "";
  const status = filters.status?.trim() ?? "";
  const category = categoryBySlug(categories, filters.category?.trim() ?? "");

  return selectPublicEvents(events).filter((event) => {
    if (category && event.categoryId !== category.id) return false;
    if (status && event.eventStatus !== status) return false;
    if (year) {
      if (!event.eventDate?.startsWith(`${year}-`)) return false;
    }
    if (!query) return true;
    const haystack = `${event.title} ${event.shortDescription} ${event.fullDescription}`.toLowerCase();
    return haystack.includes(query);
  });
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
