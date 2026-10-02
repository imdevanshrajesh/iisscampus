import type { Achievement, CampusEvent, Category } from "@/lib/types";

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
