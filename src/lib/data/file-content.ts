import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { canDelete, canEditPublication, canTransition, type Actor } from "@/lib/auth/permissions";
import { defaultNavGroups, isNavIncludeListing } from "@/lib/nav";
import { councilMemberSlugs } from "@/lib/data/catalog";
import { seedAchievements, seedCategories, seedCouncilYears, seedEvents } from "@/lib/data/seed";
import type {
  Achievement,
  Announcement,
  CustomProgram,
  MarqueeMessage,
  CampusEvent,
  Category,
  CouncilMember,
  CouncilYear,
  Faq,
  NavGroup,
  NavItem,
  Newsletter,
  PublicationStatus,
  SocialLinks,
  WellnessCategory,
  WellnessItem,
  WellnessPageSettings,
} from "@/lib/types";
import { suggestionWithinLimits, type StoredSuggestion } from "@/lib/suggestions";
import type { AchievementInput, CouncilInput, EventInput } from "@/lib/validation/content";

type Store = {
  events: CampusEvent[];
  achievements: Achievement[];
  categories: Category[];
  councilYears: CouncilYear[];
  newsletter?: Newsletter | null;
  social?: SocialLinks | null;
  councilLogoUrl?: string | null;
  contactEmail?: string | null;
  navLogoUrl?: string | null;
  navLogoHref?: string | null;
  navLabel?: string | null;
  announcements?: Announcement[];
  marquee?: MarqueeMessage[];
  navGroups?: NavGroup[];
  faqs?: Faq[];
  customPrograms?: CustomProgram[];
  wellnessCategories?: WellnessCategory[];
  wellnessItems?: WellnessItem[];
  wellnessPage?: WellnessPageSettings | null;
  suggestions?: StoredSuggestion[];
};

function contentFilePath() {
  return path.join(process.cwd(), "data", "campus.json");
}

function normalizeCouncilMembers(members: CouncilMember[]) {
  const normalized = members.map((member) => ({
    ...member,
    quote: member.quote ?? null,
    about: member.about ?? null,
    work: member.work ?? null,
    slug: member.slug ?? "",
    board: member.board === "junior" ? ("junior" as const) : ("main" as const),
  }));
  const slugs = councilMemberSlugs(normalized);
  return normalized.map((member, index) => ({ ...member, slug: slugs[index] ?? member.slug }));
}

function normalizeAnnouncement(item: Announcement & { message?: string }): Announcement {
  const legacy = String(item.message ?? "").trim();
  const title = String(item.title ?? "").trim() || legacy || "Announcement";
  return {
    id: item.id,
    title,
    body: String(item.body ?? ""),
    resources: Array.isArray(item.resources) ? item.resources : [],
    eventId: item.eventId ?? null,
    enabled: Boolean(item.enabled),
    sortOrder: Number(item.sortOrder ?? 0),
    createdAt: item.createdAt ?? new Date().toISOString(),
  };
}

function normalizeNavItem(item: NavItem, groupId: string): NavItem {
  return {
    id: item.id,
    groupId,
    title: String(item.title ?? ""),
    description: String(item.description ?? ""),
    href: item.href ? String(item.href) : null,
    eventId: item.eventId ?? null,
    enabled: Boolean(item.enabled),
    sortOrder: Number(item.sortOrder ?? 0),
  };
}

function normalizeNavGroup(group: NavGroup): NavGroup {
  const items = Array.isArray(group.items) ? group.items.map((entry) => normalizeNavItem(entry, group.id)) : [];
  return {
    id: group.id,
    label: String(group.label ?? ""),
    href: group.href ? String(group.href) : null,
    includeListing: isNavIncludeListing(group.includeListing) ? group.includeListing : null,
    enabled: Boolean(group.enabled),
    sortOrder: Number(group.sortOrder ?? 0),
    items,
  };
}

function normalizeMarquee(item: MarqueeMessage): MarqueeMessage {
  return {
    id: item.id,
    message: String(item.message ?? ""),
    eventId: item.eventId ?? null,
    enabled: Boolean(item.enabled),
    sortOrder: Number(item.sortOrder ?? 0),
  };
}

function normalizeEvent(event: CampusEvent): CampusEvent {
  const categoryIds = event.categoryIds?.length ? event.categoryIds : [event.categoryId];
  return {
    ...event,
    categoryIds,
    listing: event.listing === "competition" || event.listing === "external" ? event.listing : "event",
    hostName: event.hostName ?? null,
    startTime: event.startTime ?? null,
    endTime: event.endTime ?? null,
    locationName: event.locationName ?? null,
    locationMapUrl: event.locationMapUrl ?? null,
    gradeFrom: event.gradeFrom ?? null,
    gradeTo: event.gradeTo ?? null,
    feeAed: event.feeAed ?? null,
    capacity: event.capacity ?? null,
    packingList: event.packingList ?? null,
    registrationLimit: event.registrationLimit ?? null,
    registrationCount: Number.isFinite(event.registrationCount) ? event.registrationCount : 0,
    overflowRegistrationUrl: event.overflowRegistrationUrl ?? null,
    overflowRegistrationLabel: event.overflowRegistrationLabel ?? null,
    pushToArigo: Boolean(event.pushToArigo),
    registrationProvider:
      event.registrationProvider === "arigo" ||
      event.registrationProvider === "page" ||
      event.registrationProvider === "google_form"
        ? event.registrationProvider
        : null,
  };
}

function initialStore(): Store {
  return {
    events: seedEvents,
    achievements: seedAchievements,
    categories: seedCategories,
    councilYears: seedCouncilYears,
  };
}

export function readContentStore(): Store {
  try {
    const parsed = JSON.parse(readFileSync(contentFilePath(), "utf8")) as Partial<Store>;
    return {
      events: Array.isArray(parsed.events) ? parsed.events.map(normalizeEvent) : seedEvents,
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : seedAchievements,
      categories: Array.isArray(parsed.categories) ? parsed.categories : seedCategories,
      councilYears: Array.isArray(parsed.councilYears)
        ? parsed.councilYears.map((year) => ({
            ...year,
            juniorHeading: year.juniorHeading?.trim() || "Junior Student Council",
            members: normalizeCouncilMembers(year.members ?? []),
            photos: year.photos ?? [],
            posts: year.posts ?? [],
          }))
        : seedCouncilYears,
      newsletter: parsed.newsletter ?? null,
      social: parsed.social ?? null,
      councilLogoUrl: parsed.councilLogoUrl ?? null,
      contactEmail: parsed.contactEmail ?? null,
      navLogoUrl: parsed.navLogoUrl ?? null,
      navLogoHref: parsed.navLogoHref ?? null,
      navLabel: parsed.navLabel ?? null,
      announcements: Array.isArray(parsed.announcements)
        ? parsed.announcements.map((item) => normalizeAnnouncement(item as Announcement))
        : [],
      marquee: Array.isArray(parsed.marquee)
        ? parsed.marquee.map((item) => normalizeMarquee(item as MarqueeMessage))
        : [],
      navGroups: Array.isArray(parsed.navGroups)
        ? parsed.navGroups.map((group) => normalizeNavGroup(group as NavGroup))
        : undefined,
      faqs: Array.isArray(parsed.faqs) ? parsed.faqs : [],
      customPrograms: Array.isArray(parsed.customPrograms) ? parsed.customPrograms : [],
      wellnessCategories: Array.isArray(parsed.wellnessCategories)
        ? parsed.wellnessCategories
        : [],
      wellnessItems: Array.isArray(parsed.wellnessItems)
        ? parsed.wellnessItems.map((item) => ({
            ...item,
            categoryId: item.categoryId ?? null,
          }))
        : [],
      wellnessPage: parsed.wellnessPage ?? null,
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.flatMap((item) => {
            const row = item as StoredSuggestion;
            if (!row?.id || !row.email || !row.body) return [];
            return [
              {
                id: String(row.id),
                email: String(row.email),
                emailKey: String(row.emailKey || row.email),
                body: String(row.body),
                ip: String(row.ip ?? ""),
                createdAt: String(row.createdAt ?? new Date().toISOString()),
              },
            ];
          })
        : [],
    };
  } catch {
    return initialStore();
  }
}

function writeContentStore(store: Store) {
  try {
    const filePath = contentFilePath();
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(store, null, 2));
    return true;
  } catch {
    return false;
  }
}

export function saveEventToStore(
  actor: Actor,
  input: EventInput,
  intent: string,
  id: string,
) {
  const store = readContentStore();
  const now = new Date().toISOString();
  const existing = id ? store.events.find((event) => event.id === id) : undefined;
  if (id && !existing) return { error: "That event could not be found." };

  let status: PublicationStatus = existing?.publicationStatus ?? "draft";
  let publishedAt = existing?.publishedAt ?? null;
  const featured = actor?.role === "administrator" ? input.featured : (existing?.featured ?? false);

  if (existing) {
    if (!canEditPublication(actor, existing.publicationStatus) && intent === "save") {
      return { error: "You do not have permission to do that." };
    }
    if (intent === "submit") {
      if (!canTransition(actor, existing.publicationStatus, "in_review")) {
        return { error: "You do not have permission to do that." };
      }
      status = "in_review";
    } else if (intent === "publish") {
      if (!canTransition(actor, existing.publicationStatus, "published")) {
        return { error: "You do not have permission to do that." };
      }
      status = "published";
      publishedAt = publishedAt ?? now;
    } else if (intent === "unpublish" || intent === "restore") {
      if (!canTransition(actor, existing.publicationStatus, "draft")) {
        return { error: "You do not have permission to do that." };
      }
      status = "draft";
    } else if (intent === "archive") {
      if (!canTransition(actor, existing.publicationStatus, "archived")) {
        return { error: "You do not have permission to do that." };
      }
      status = "archived";
    }
  } else if (intent !== "save") {
    return { error: "Save the draft before changing its status." };
  }

  if (store.events.some((event) => event.slug === input.slug && event.id !== id)) {
    return { error: "That address is already in use." };
  }

  const nextId = existing?.id ?? crypto.randomUUID();
  const categoryIds = [...new Set([input.categoryId, ...(input.categoryIds ?? [])])];
  const record: CampusEvent = {
    id: nextId,
    title: input.title,
    slug: input.slug,
    shortDescription: input.shortDescription,
    fullDescription: input.fullDescription,
    categoryId: input.categoryId,
    categoryIds,
    listing: input.listing ?? "event",
    coverImageUrl: input.coverImageUrl,
    coverAlt: input.coverAlt,
    coverAttribution: input.coverAttribution,
    eventDate: input.eventDate,
    endDate: input.endDate,
    startTime: input.startTime,
    endTime: input.endTime,
    locationName: input.locationName,
    locationMapUrl: input.locationMapUrl,
    hostName: input.hostName,
    gradeFrom: input.gradeFrom,
    gradeTo: input.gradeTo,
    feeAed: input.feeAed,
    capacity: input.capacity,
    packingList: input.packingList,
    publicationStatus: status,
    eventStatus: input.eventStatus,
    featured,
    isSample: existing?.isSample ?? false,
    registrationEnabled: input.registrationEnabled,
    pushToArigo: Boolean(input.pushToArigo),
    registrationProvider: input.registrationProvider,
    registrationUrl: input.registrationEnabled ? input.registrationUrl : null,
    registrationLabel: input.registrationLabel,
    registrationDeadline: input.registrationDeadline,
    registrationLimit: input.registrationLimit,
    registrationCount: input.registrationCount,
    overflowRegistrationUrl: input.overflowRegistrationUrl,
    overflowRegistrationLabel: input.overflowRegistrationLabel,
    registrationInstructions: input.registrationInstructions,
    instagramUrl: input.instagramUrl,
    purpose: input.purpose,
    activities: input.activities,
    schedule: input.schedule,
    groups: input.groups,
    resources: input.resources,
    videoUrl: input.videoUrl,
    images: input.images.map((image, index) => ({
      id: image.id ?? crypto.randomUUID(),
      url: image.url,
      alt: image.alt,
      caption: image.caption,
      attribution: image.attribution,
      pinned: Boolean(image.pinned),
      sortOrder: index,
    })),
    relatedIds: input.relatedIds.filter((relatedId) => relatedId !== nextId),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    publishedAt,
  };

  store.events = existing
    ? store.events.map((event) => (event.id === existing.id ? record : event))
    : [record, ...store.events];
  if (!writeContentStore(store)) return { error: "The event could not be saved." };
  return {
    id: record.id,
    slug: record.slug,
    status,
    wasPushedToArigo: Boolean(existing?.pushToArigo),
  };
}

export function rememberEventRegistrationUrl(id: string, registrationUrl: string) {
  const store = readContentStore();
  const event = store.events.find((item) => item.id === id);
  if (!event) return false;
  event.registrationUrl = registrationUrl;
  if (!event.registrationProvider) event.registrationProvider = "arigo";
  return writeContentStore(store);
}

export function saveAchievementToStore(actor: Actor, input: AchievementInput, intent: string, id: string) {
  const store = readContentStore();
  const now = new Date().toISOString();
  const existing = id ? store.achievements.find((item) => item.id === id) : undefined;
  if (id && !existing) return { error: "That achievement could not be found." };

  let status: PublicationStatus = existing?.publicationStatus ?? "draft";
  let publishedAt = existing?.publishedAt ?? null;
  if (existing) {
    const nextStatus =
      intent === "submit"
        ? "in_review"
        : intent === "publish"
          ? "published"
          : intent === "unpublish"
            ? "draft"
            : intent === "archive"
              ? "archived"
              : existing.publicationStatus;
    if (intent === "save" && !canEditPublication(actor, existing.publicationStatus)) {
      return { error: "You do not have permission to do that." };
    }
    if (intent !== "save" && !canTransition(actor, existing.publicationStatus, nextStatus)) {
      return { error: "You do not have permission to do that." };
    }
    status = nextStatus;
    if (status === "published") publishedAt = publishedAt ?? now;
  }

  const record: Achievement = {
    id: existing?.id ?? crypto.randomUUID(),
    title: input.title,
    competitionName: input.competitionName,
    winnerName: input.winnerName,
    award: input.award,
    eventDate: input.eventDate,
    academicYear: input.academicYear,
    categoryId: input.categoryId,
    eventId: input.eventId,
    imageUrl: input.imageUrl,
    imageAlt: input.imageAlt,
    resources: input.resources,
    publicationStatus: status,
    isSample: existing?.isSample ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    publishedAt,
  };
  store.achievements = existing
    ? store.achievements.map((item) => (item.id === existing.id ? record : item))
    : [record, ...store.achievements];
  if (!writeContentStore(store)) return { error: "The achievement could not be saved." };
  return { ok: true };
}

function nextPublication(
  actor: Actor,
  existing: { publicationStatus: PublicationStatus; publishedAt: string | null } | undefined,
  intent: string,
  now: string,
): { error: string } | { status: PublicationStatus; publishedAt: string | null } {
  let status: PublicationStatus = existing?.publicationStatus ?? "draft";
  let publishedAt = existing?.publishedAt ?? null;

  if (!existing) {
    if (intent !== "save") return { error: "Save the draft before changing its status." };
    return { status, publishedAt };
  }

  if (intent === "save") {
    if (!canEditPublication(actor, existing.publicationStatus)) {
      return { error: "You do not have permission to do that." };
    }
    return { status, publishedAt };
  }

  const nextStatus: PublicationStatus | null =
    intent === "submit"
      ? "in_review"
      : intent === "publish"
        ? "published"
        : intent === "unpublish" || intent === "restore"
          ? "draft"
          : intent === "archive"
            ? "archived"
            : null;
  if (!nextStatus || !canTransition(actor, existing.publicationStatus, nextStatus)) {
    return { error: "You do not have permission to do that." };
  }
  status = nextStatus;
  if (status === "published") publishedAt = publishedAt ?? now;
  return { status, publishedAt };
}

export function saveCouncilToStore(actor: Actor, input: CouncilInput, intent: string, id: string) {
  const store = readContentStore();
  const now = new Date().toISOString();
  const existing = id ? store.councilYears.find((year) => year.id === id) : undefined;
  if (id && !existing) return { error: "That council year could not be found." };

  const publication = nextPublication(actor, existing, intent, now);
  if ("error" in publication) return publication;

  if (store.councilYears.some((year) => year.slug === input.slug && year.id !== id)) {
    return { error: "That address is already in use." };
  }

  const record: CouncilYear = {
    id: existing?.id ?? crypto.randomUUID(),
    label: input.label,
    slug: input.slug,
    kind: input.kind,
    summary: input.summary,
    juniorHeading: input.juniorHeading?.trim() || "Junior Student Council",
    publicationStatus: publication.status,
    sortOrder: input.sortOrder,
    isSample: existing?.isSample ?? false,
    members: (() => {
      const slugs = councilMemberSlugs(input.members);
      return input.members.map((member, index) => ({
        id: member.id ?? crypto.randomUUID(),
        role: member.role,
        name: member.name,
        imageUrl: member.imageUrl,
        imageAlt: member.imageAlt,
        quote: member.quote,
        about: member.about,
        work: member.work,
        slug: slugs[index] ?? "",
        board: member.board === "junior" ? ("junior" as const) : ("main" as const),
        sortOrder: index,
      }));
    })(),
    photos: input.photos.map((photo, index) => ({
      id: photo.id ?? crypto.randomUUID(),
      url: photo.url,
      alt: photo.alt,
      caption: photo.caption,
      sortOrder: index,
    })),
    posts: input.posts.map((post, index) => ({
      id: post.id ?? crypto.randomUUID(),
      title: post.title,
      body: post.body,
      publishedOn: post.publishedOn,
      imageUrl: post.imageUrl,
      imageAlt: post.imageAlt,
      sortOrder: index,
    })),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    publishedAt: publication.publishedAt,
  };

  store.councilYears = existing
    ? store.councilYears.map((year) => (year.id === existing.id ? record : year))
    : [record, ...store.councilYears];
  if (!writeContentStore(store)) return { error: "The council year could not be saved." };
  return { id: record.id, slug: record.slug, status: record.publicationStatus };
}

export function deleteFromStore(actor: Actor, kind: "events" | "achievements" | "council", id: string) {
  const store = readContentStore();
  if (kind === "events") {
    const existing = store.events.find((event) => event.id === id);
    if (!existing || !canDelete(actor, existing.publicationStatus)) return false;
    store.events = store.events.filter((event) => event.id !== id);
    store.achievements = store.achievements.map((item) =>
      item.eventId === id ? { ...item, eventId: null } : item,
    );
  } else if (kind === "achievements") {
    const existing = store.achievements.find((item) => item.id === id);
    if (!existing || !canDelete(actor, existing.publicationStatus)) return false;
    store.achievements = store.achievements.filter((item) => item.id !== id);
  } else {
    const existing = store.councilYears.find((year) => year.id === id);
    if (!existing || !canDelete(actor, existing.publicationStatus)) return false;
    store.councilYears = store.councilYears.filter((year) => year.id !== id);
  }
  return writeContentStore(store);
}

export function saveCategoryToStore(input: {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  imageUrl: string | null;
  pdfUrl: string | null;
}) {
  const store = readContentStore();
  const existing = input.id ? store.categories.find((category) => category.id === input.id) : undefined;
  if (store.categories.some((category) => category.slug === input.slug && category.id !== existing?.id)) {
    return false;
  }
  const record = {
    id: existing?.id ?? crypto.randomUUID(),
    name: input.name,
    slug: input.slug,
    description: input.description ?? "",
    sortOrder: input.sortOrder || (existing?.sortOrder ?? store.categories.length + 1),
    imageUrl: input.imageUrl,
    pdfUrl: input.pdfUrl,
  };
  store.categories = existing
    ? store.categories.map((category) => (category.id === existing.id ? record : category))
    : [...store.categories, record];
  return writeContentStore(store);
}

export function addCategoryToStore(name: string, slug: string, description: string) {
  return saveCategoryToStore({
    name,
    slug,
    description,
    sortOrder: 0,
    imageUrl: null,
    pdfUrl: null,
  });
}

export function readNewsletter(): Newsletter | null {
  return readContentStore().newsletter ?? null;
}

export function saveNewsletterToStore(newsletter: Newsletter) {
  const store = readContentStore();
  store.newsletter = newsletter;
  return writeContentStore(store);
}

export function readSocial(): SocialLinks | null {
  return readContentStore().social ?? null;
}

export function saveSocialToStore(social: SocialLinks) {
  const store = readContentStore();
  store.social = social;
  return writeContentStore(store);
}

export function saveNavBrandToStore(input: { navLogoUrl: string | null; navLogoHref: string | null; navLabel: string }) {
  const store = readContentStore();
  store.navLogoUrl = input.navLogoUrl;
  store.navLogoHref = input.navLogoHref;
  store.navLabel = input.navLabel;
  return writeContentStore(store);
}

export function saveCouncilLogoToStore(councilLogoUrl: string | null) {
  const store = readContentStore();
  store.councilLogoUrl = councilLogoUrl;
  return writeContentStore(store);
}

export function saveContactEmailToStore(contactEmail: string | null) {
  const store = readContentStore();
  store.contactEmail = contactEmail;
  return writeContentStore(store);
}

export function saveAnnouncementToStore(input: {
  id?: string;
  title: string;
  body: string;
  resources: Announcement["resources"];
  eventId: string | null;
  enabled: boolean;
}) {
  const store = readContentStore();
  const list = store.announcements ?? [];
  const existing = input.id ? list.find((item) => item.id === input.id) : undefined;
  const record: Announcement = {
    id: existing?.id ?? crypto.randomUUID(),
    title: input.title,
    body: input.body,
    resources: input.resources,
    eventId: input.eventId,
    enabled: input.enabled,
    sortOrder: existing?.sortOrder ?? 0,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  store.announcements = existing
    ? list.map((item) => (item.id === existing.id ? record : item))
    : [...list, record];
  return writeContentStore(store);
}

export function deleteAnnouncementFromStore(id: string) {
  const store = readContentStore();
  store.announcements = (store.announcements ?? []).filter((item) => item.id !== id);
  return writeContentStore(store);
}

export function saveMarqueeToStore(input: {
  id?: string;
  message: string;
  eventId: string | null;
  enabled: boolean;
  sortOrder: number;
}) {
  const store = readContentStore();
  const list = store.marquee ?? [];
  const existing = input.id ? list.find((item) => item.id === input.id) : undefined;
  const record: MarqueeMessage = {
    id: existing?.id ?? crypto.randomUUID(),
    message: input.message,
    eventId: input.eventId,
    enabled: input.enabled,
    sortOrder: input.sortOrder,
  };
  store.marquee = existing
    ? list.map((item) => (item.id === existing.id ? record : item))
    : [...list, record];
  return writeContentStore(store);
}

export function deleteMarqueeFromStore(id: string) {
  const store = readContentStore();
  store.marquee = (store.marquee ?? []).filter((item) => item.id !== id);
  return writeContentStore(store);
}

function storedNavGroups() {
  const store = readContentStore();
  const source = store.navGroups ?? defaultNavGroups;
  return source.map((group) => ({ ...group, items: group.items.map((item) => ({ ...item })) }));
}

export function saveNavGroupToStore(input: {
  id?: string;
  label: string;
  href: string | null;
  includeListing: NavGroup["includeListing"];
  enabled: boolean;
  sortOrder: number;
}) {
  const store = readContentStore();
  const list = storedNavGroups();
  const existing = input.id ? list.find((group) => group.id === input.id) : undefined;
  const record: NavGroup = {
    id: existing?.id ?? crypto.randomUUID(),
    label: input.label,
    href: input.href,
    includeListing: input.includeListing,
    enabled: input.enabled,
    sortOrder: input.sortOrder,
    items: existing?.items ?? [],
  };
  store.navGroups = existing ? list.map((group) => (group.id === existing.id ? record : group)) : [...list, record];
  return writeContentStore(store);
}

export function deleteNavGroupFromStore(id: string) {
  const store = readContentStore();
  const list = storedNavGroups();
  store.navGroups = list.filter((group) => group.id !== id);
  return writeContentStore(store);
}

export function saveNavItemToStore(input: {
  id?: string;
  groupId: string;
  title: string;
  description: string;
  href: string | null;
  eventId: string | null;
  enabled: boolean;
  sortOrder: number;
}) {
  const store = readContentStore();
  const list = storedNavGroups();
  const group = list.find((entry) => entry.id === input.groupId);
  if (!group) return false;
  const existing = input.id ? group.items.find((item) => item.id === input.id) : undefined;
  const record: NavItem = {
    id: existing?.id ?? crypto.randomUUID(),
    groupId: group.id,
    title: input.title,
    description: input.description,
    href: input.href,
    eventId: input.eventId,
    enabled: input.enabled,
    sortOrder: input.sortOrder,
  };
  group.items = existing ? group.items.map((item) => (item.id === existing.id ? record : item)) : [...group.items, record];
  store.navGroups = list;
  return writeContentStore(store);
}

export function deleteNavItemFromStore(id: string) {
  const store = readContentStore();
  const list = storedNavGroups();
  store.navGroups = list.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.id !== id),
  }));
  return writeContentStore(store);
}

export function saveFaqToStore(input: {
  id?: string;
  question: string;
  answer: string;
  published: boolean;
  sortOrder: number;
}) {
  const store = readContentStore();
  const list = store.faqs ?? [];
  const existing = input.id ? list.find((item) => item.id === input.id) : undefined;
  const record: Faq = {
    id: existing?.id ?? crypto.randomUUID(),
    question: input.question,
    answer: input.answer,
    published: input.published,
    sortOrder: input.sortOrder,
  };
  store.faqs = existing ? list.map((item) => (item.id === existing.id ? record : item)) : [...list, record];
  return writeContentStore(store);
}

export function listSuggestionsFromStore() {
  return (readContentStore().suggestions ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveSuggestionToStore(input: { email: string; emailKey: string; body: string; ip: string }) {
  const store = readContentStore();
  const list = store.suggestions ?? [];
  const now = Date.now();
  if (!suggestionWithinLimits(list, input.emailKey, input.ip, now)) return "rate" as const;
  store.suggestions = [
    {
      id: crypto.randomUUID(),
      email: input.email,
      emailKey: input.emailKey,
      body: input.body,
      ip: input.ip,
      createdAt: new Date(now).toISOString(),
    },
    ...list,
  ].slice(0, 500);
  return writeContentStore(store) ? ("ok" as const) : ("error" as const);
}

export function deleteSuggestionFromStore(id: string) {
  const store = readContentStore();
  const list = store.suggestions ?? [];
  if (!list.some((item) => item.id === id)) return false;
  store.suggestions = list.filter((item) => item.id !== id);
  return writeContentStore(store);
}

export function deleteFaqFromStore(id: string) {
  const store = readContentStore();
  store.faqs = (store.faqs ?? []).filter((item) => item.id !== id);
  return writeContentStore(store);
}

export function saveCustomProgramToStore(input: {
  id?: string;
  title: string;
  summary: string;
  websiteLabel: string | null;
  websiteUrl: string | null;
  photos: CustomProgram["photos"];
  links: CustomProgram["links"];
  eventId: string | null;
  published: boolean;
  sortOrder: number;
}) {
  const store = readContentStore();
  const list = store.customPrograms ?? [];
  const existing = input.id ? list.find((item) => item.id === input.id) : undefined;
  const record: CustomProgram = {
    id: existing?.id ?? crypto.randomUUID(),
    title: input.title,
    summary: input.summary,
    websiteLabel: input.websiteLabel,
    websiteUrl: input.websiteUrl,
    photos: input.photos,
    links: input.links,
    eventId: input.eventId,
    event: null,
    published: input.published,
    sortOrder: input.sortOrder,
  };
  store.customPrograms = existing ? list.map((item) => (item.id === existing.id ? record : item)) : [...list, record];
  return writeContentStore(store);
}

export function deleteCustomProgramFromStore(id: string) {
  const store = readContentStore();
  store.customPrograms = (store.customPrograms ?? []).filter((item) => item.id !== id);
  return writeContentStore(store);
}

export function readWellnessPageSettings(): WellnessPageSettings {
  const stored = readContentStore().wellnessPage;
  return {
    pageTitle: stored?.pageTitle?.trim() || "Wellness Corner",
    navLabel: stored?.navLabel?.trim() || "Wellness",
  };
}

export function saveWellnessPageToStore(input: WellnessPageSettings) {
  const store = readContentStore();
  store.wellnessPage = {
    pageTitle: input.pageTitle,
    navLabel: input.navLabel,
  };
  return writeContentStore(store);
}

export function saveWellnessCategoryToStore(input: {
  id?: string;
  name: string;
  sortOrder: number;
}) {
  const store = readContentStore();
  const list = store.wellnessCategories ?? [];
  const existing = input.id ? list.find((item) => item.id === input.id) : undefined;
  const duplicate = list.find(
    (item) => item.id !== existing?.id && item.name.toLowerCase() === input.name.toLowerCase(),
  );
  if (duplicate) return false;
  const record: WellnessCategory = {
    id: existing?.id ?? crypto.randomUUID(),
    name: input.name,
    sortOrder: input.sortOrder,
  };
  store.wellnessCategories = existing
    ? list.map((item) => (item.id === existing.id ? record : item))
    : [...list, record];
  return writeContentStore(store);
}

export function deleteWellnessCategoryFromStore(id: string) {
  const store = readContentStore();
  store.wellnessCategories = (store.wellnessCategories ?? []).filter((item) => item.id !== id);
  store.wellnessItems = (store.wellnessItems ?? []).map((item) =>
    item.categoryId === id ? { ...item, categoryId: null } : item,
  );
  return writeContentStore(store);
}

export function saveWellnessItemToStore(input: {
  id?: string;
  title: string;
  body: string;
  categoryId: string | null;
  imageUrl: string | null;
  imageAlt: string;
  imageOrientation: WellnessItem["imageOrientation"];
  pdfUrl: string | null;
  sortOrder: number;
  published: boolean;
}) {
  const store = readContentStore();
  const list = store.wellnessItems ?? [];
  const existing = input.id ? list.find((item) => item.id === input.id) : undefined;
  if (input.categoryId && !(store.wellnessCategories ?? []).some((category) => category.id === input.categoryId)) {
    return false;
  }
  const record: WellnessItem = {
    id: existing?.id ?? crypto.randomUUID(),
    title: input.title,
    body: input.body,
    categoryId: input.categoryId,
    imageUrl: input.imageUrl,
    imageAlt: input.imageAlt,
    imageOrientation: input.imageOrientation,
    pdfUrl: input.pdfUrl,
    sortOrder: input.sortOrder,
    published: input.published,
  };
  store.wellnessItems = existing
    ? list.map((item) => (item.id === existing.id ? record : item))
    : [...list, record];
  return writeContentStore(store);
}

export function deleteWellnessItemFromStore(id: string) {
  const store = readContentStore();
  store.wellnessItems = (store.wellnessItems ?? []).filter((item) => item.id !== id);
  return writeContentStore(store);
}
