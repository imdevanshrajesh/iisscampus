import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { canDelete, canEditPublication, canTransition, type Actor } from "@/lib/auth/permissions";
import { defaultNavGroups, isNavIncludeListing } from "@/lib/nav";
import { councilMemberSlugs } from "@/lib/data/catalog";
import { seedAchievements, seedCategories, seedCouncilYears, seedEvents } from "@/lib/data/seed";
import type {
  AcademicTermConfig,
  Achievement,
  Announcement,
  CustomProgram,
  MarqueeMessage,
  CampusEvent,
  Category,
  CouncilMember,
  CouncilPhoto,
  CouncilPost,
  CouncilYear,
  FacultyMember,
  FacultyTier,
  Faq,
  HeadTier,
  House,
  NavGroup,
  NavItem,
  Newsletter,
  PublicationStatus,
  SchoolHead,
  SchoolIncharge,
  SocialLinks,
  SocialPost,
  WellnessCategory,
  WellnessItem,
  WellnessPageSettings,
} from "@/lib/types";
import { suggestionWithinLimits, type StoredSuggestion } from "@/lib/suggestions";
import type {
  AchievementInput,
  CouncilInput,
  CouncilMemberInput,
  CouncilPhotoInput,
  CouncilPostInput,
  CouncilYearMetaInput,
  EventInput,
} from "@/lib/validation/content";

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
  activeTerm?: AcademicTermConfig | null;
  announcements?: Announcement[];
  schoolIncharges?: SchoolIncharge[];
  faculty?: FacultyMember[];
  houses?: House[];
  marquee?: MarqueeMessage[];
  navGroups?: NavGroup[];
  faqs?: Faq[];
  customPrograms?: CustomProgram[];
  wellnessCategories?: WellnessCategory[];
  wellnessItems?: WellnessItem[];
  wellnessPage?: WellnessPageSettings | null;
  suggestions?: StoredSuggestion[];
  socialPosts?: SocialPost[];
  grokApiKey?: string | null;
  grokModel?: string | null;
  aiProvider?: "xai" | "openai" | "openrouter" | "gemini" | "custom";
  aiApiKey?: string | null;
  aiModel?: string | null;
  aiBaseUrl?: string | null;
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
    programId: item.programId ?? null,
    wellnessId: item.wellnessId ?? null,
    category: item.category || "General",
    academicYear: item.academicYear ?? null,
    coverImageUrl: item.coverImageUrl ?? null,
    enabled: Boolean(item.enabled),
    sortOrder: Number(item.sortOrder ?? 0),
    createdAt: item.createdAt ?? new Date().toISOString(),
  };
}

function normalizeCustomProgram(item: CustomProgram): CustomProgram {
  return {
    ...item,
    category: item.category || "Awareness",
    timing: item.timing ?? null,
    pdfUrl: item.pdfUrl ?? null,
  };
}

export const seedSchoolIncharges: SchoolHead[] = [
  {
    id: "head-principal",
    name: "Dr. Manzoor Ahmad",
    role: "Principal & Campus Director",
    tier: "executive",
    tierLabel: "Executive Leadership",
    department: "Campus Directorate",
    photoUrl: "/brand/student-council.png",
    message: "Education is not merely the accumulation of facts, but the training of the mind to think, lead with humility, and serve our society with unshakeable moral strength.",
    about: "Education is not merely the accumulation of facts, but the training of the mind to think, lead with humility, and serve our society with unshakeable moral strength.",
    email: "principal@iissboys.com",
    phone: null,
    sortOrder: 1,
    published: true,
    createdAt: "2026-10-01T08:00:00Z",
  },
  {
    id: "head-vice-principal",
    name: "Mrs. Shabana Parveen",
    role: "Vice Principal",
    tier: "executive",
    tierLabel: "Executive Leadership",
    department: "Academic Administration",
    photoUrl: null,
    message: "Every student who walks through these corridors carries boundless potential. Our mission is to guide you toward purposeful excellence with dedication and character.",
    about: "Every student who walks through these corridors carries boundless potential. Our mission is to guide you toward purposeful excellence with dedication and character.",
    email: "viceprincipal@iissboys.com",
    phone: null,
    sortOrder: 2,
    published: true,
    createdAt: "2026-10-01T08:00:00Z",
  },
  {
    id: "head-senior-boys",
    name: "Mr. Tariq Mansoor",
    role: "Senior Section Head",
    tier: "section",
    tierLabel: "Section Heads",
    department: "Senior Secondary (Grades 11-12)",
    photoUrl: null,
    message: "To our senior young men: Seize these formative years. Aim high in board examinations, uphold campus pride, and lead your junior peers by sterling example.",
    about: "To our senior young men: Seize these formative years. Aim high in board examinations, uphold campus pride, and lead your junior peers by sterling example.",
    email: "tariq.m@iissboys.com",
    phone: null,
    sortOrder: 3,
    published: true,
    createdAt: "2026-10-01T08:00:00Z",
  },
  {
    id: "head-middle-boys",
    name: "Mr. Suhail Hashim",
    role: "Middle Section Supervisor",
    tier: "section",
    tierLabel: "Section Heads",
    department: "Middle School (Grades 7-10)",
    photoUrl: null,
    message: "Middle school is where curiosity transforms into discipline. Stay inquisitive, respect your teachers, and build lasting friendships founded on honor.",
    about: "Middle school is where curiosity transforms into discipline. Stay inquisitive, respect your teachers, and build lasting friendships founded on honor.",
    email: "suhail.h@iissboys.com",
    phone: null,
    sortOrder: 4,
    published: true,
    createdAt: "2026-10-01T08:00:00Z",
  },
  {
    id: "head-activities",
    name: "Mr. Abdul Razak",
    role: "Activities & Co-Curricular Head",
    tier: "department",
    tierLabel: "Department Heads",
    department: "Student Affairs & CCA",
    photoUrl: null,
    message: "Co-curricular activities are where classroom knowledge meets character. Step onto the field, take the stage, and celebrate campus spirit.",
    about: "Co-curricular activities are where classroom knowledge meets character. Step onto the field, take the stage, and celebrate campus spirit.",
    email: "activities@iissboys.com",
    phone: null,
    sortOrder: 5,
    published: true,
    createdAt: "2026-10-01T08:00:00Z",
  },
  {
    id: "head-discipline",
    name: "Mr. Faisal Siddiqui",
    role: "Discipline & Campus Welfare Head",
    tier: "department",
    tierLabel: "Department Heads",
    department: "Campus Welfare & Student Life",
    photoUrl: null,
    message: "True discipline is not restraint; it is the freedom that comes from self-command, mutual respect, and upholding our campus ethos.",
    about: "True discipline is not restraint; it is the freedom that comes from self-command, mutual respect, and upholding our campus ethos.",
    email: "welfare@iissboys.com",
    phone: null,
    sortOrder: 6,
    published: true,
    createdAt: "2026-10-01T08:00:00Z",
  },
];

export const seedHouses: House[] = [
  {
    id: "house-ruby",
    name: "Ruby",
    slug: "ruby",
    color: "ruby",
    inchargeName: "Mr. Tariq Mansoor",
    inchargeTitle: "Faculty Incharge",
    inchargePhotoUrl: null,
    inchargeMessage: "Strive with courage, give your utmost on every sports field, and hold your head high in triumph or defeat.",
    captainName: "ZAYAN JASSEER",
    captainPhotoUrl: null,
    viceCaptainName: "DANIAL POULOSE",
    viceCaptainPhotoUrl: null,
    motto: "Courage, Passion & Strength",
    description: "United under the scarlet banner of courage, valor, and unwavering sportsmanship.",
    sortOrder: 1,
    published: true,
    updatedAt: "2026-11-03T12:00:00Z",
  },
  {
    id: "house-sapphire",
    name: "Sapphire",
    slug: "sapphire",
    color: "sapphire",
    inchargeName: "Mr. Suhail Hashim",
    inchargeTitle: "Faculty Incharge",
    inchargePhotoUrl: null,
    inchargeMessage: "Wisdom is our armor, truth our shield. Compete with dignity and excel through brotherhood.",
    captainName: "ZAYAN MUHAMMED RIZAM",
    captainPhotoUrl: null,
    viceCaptainName: "SALAH MAHARUS NISAN",
    viceCaptainPhotoUrl: null,
    motto: "Wisdom, Loyalty & Honor",
    description: "Soaring with the spirit of the ocean and sky, guided by integrity and sharp intellect.",
    sortOrder: 2,
    published: true,
    updatedAt: "2026-11-03T12:00:00Z",
  },
  {
    id: "house-topaz",
    name: "Topaz",
    slug: "topaz",
    color: "topaz",
    inchargeName: "Mr. Abdul Razak",
    inchargeTitle: "Faculty Incharge",
    inchargePhotoUrl: null,
    inchargeMessage: "Bring radiant enthusiasm, never surrender to doubt, and illuminate the campus with golden resolve.",
    captainName: "MOHAMMED IHSAN",
    captainPhotoUrl: null,
    viceCaptainName: "STEPHEN MASCARENHAS",
    viceCaptainPhotoUrl: null,
    motto: "Brilliance, Energy & Optimism",
    description: "Radiating warmth, unstoppable enthusiasm, creativity, and tireless perseverance.",
    sortOrder: 3,
    published: true,
    updatedAt: "2026-11-03T12:00:00Z",
  },
  {
    id: "house-emerald",
    name: "Emerald",
    slug: "emerald",
    color: "emerald",
    inchargeName: "Mr. Faisal Siddiqui",
    inchargeTitle: "Faculty Incharge",
    inchargePhotoUrl: null,
    inchargeMessage: "Rooted like mighty trees, we grow together in resilience, discipline, and quiet determination.",
    captainName: "MOHAMMED AAZIM",
    captainPhotoUrl: null,
    viceCaptainName: "SHAZ MOHAMMED",
    viceCaptainPhotoUrl: null,
    motto: "Growth, Harmony & Resilience",
    description: "Rooted in discipline and unity, flourishing through team spirit and quiet determination.",
    sortOrder: 4,
    published: true,
    updatedAt: "2026-11-03T12:00:00Z",
  },
];

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
    faculty: [],
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
      activeTerm: parsed.activeTerm ?? null,
      announcements: Array.isArray(parsed.announcements)
        ? parsed.announcements.map((item) => normalizeAnnouncement(item as Announcement))
        : [],
      schoolIncharges: Array.isArray(parsed.schoolIncharges)
        ? parsed.schoolIncharges
        : seedSchoolIncharges,
      faculty: Array.isArray(parsed.faculty) ? parsed.faculty : [],
      houses: Array.isArray(parsed.houses) ? parsed.houses : seedHouses,
      marquee: Array.isArray(parsed.marquee)
        ? parsed.marquee.map((item) => normalizeMarquee(item as MarqueeMessage))
        : [],
      navGroups: Array.isArray(parsed.navGroups)
        ? parsed.navGroups.map((group) => normalizeNavGroup(group as NavGroup))
        : undefined,
      faqs: Array.isArray(parsed.faqs) ? parsed.faqs : [],
      customPrograms: Array.isArray(parsed.customPrograms)
        ? parsed.customPrograms.map(normalizeCustomProgram)
        : [],
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
      grokApiKey: parsed.grokApiKey ?? null,
      grokModel: parsed.grokModel ?? null,
      aiProvider: parsed.aiProvider ?? undefined,
      aiApiKey: parsed.aiApiKey ?? null,
      aiModel: parsed.aiModel ?? null,
      aiBaseUrl: parsed.aiBaseUrl ?? null,
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
    academicYear: input.academicYear ?? store.activeTerm?.label ?? null,
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

export function appendEventGalleryImageInStore(
  actor: Actor,
  input: {
    eventId: string;
    url: string;
    alt: string;
    caption?: string | null;
    attribution?: string | null;
    pinned?: boolean;
  },
) {
  const store = readContentStore();
  const event = store.events.find((item) => item.id === input.eventId);
  if (!event) return { error: "That event could not be found." };
  if (!canEditPublication(actor, event.publicationStatus)) {
    return { error: "You do not have permission to edit images on that event." };
  }

  const maxSortOrder = event.images.reduce((max, item) => Math.max(max, item.sortOrder ?? 0), -1);
  const image = {
    id: crypto.randomUUID(),
    url: input.url,
    alt: input.alt.trim() || event.title || "Event photograph",
    caption: input.caption?.trim() || null,
    attribution: input.attribution?.trim() || null,
    pinned: Boolean(input.pinned),
    sortOrder: maxSortOrder + 1,
  };

  event.images = [...event.images, image];
  event.updatedAt = new Date().toISOString();
  if (!writeContentStore(store)) {
    return { error: "The image could not be saved to the event gallery." };
  }
  return { ok: true as const, image, slug: event.slug };
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
  return { ok: true, id: record.id };
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

function getEditableCouncilYearFromStore(
  actor: Actor,
  store: Store,
  yearId: string,
): { error: string } | { existing: CouncilYear } {
  const existing = store.councilYears.find((year) => year.id === yearId);
  if (!existing) return { error: "That council year could not be found." };
  if (!canEditPublication(actor, existing.publicationStatus)) {
    return { error: "You do not have permission to do that." };
  }
  return { existing };
}

export function saveCouncilYearMetaInStore(
  actor: Actor,
  meta: CouncilYearMetaInput,
  id?: string,
): { error: string } | { id: string; slug: string; status: PublicationStatus } {
  const store = readContentStore();
  const now = new Date().toISOString();
  const existing = id ? store.councilYears.find((year) => year.id === id) : undefined;
  if (id && !existing) return { error: "That council year could not be found." };

  if (existing && !canEditPublication(actor, existing.publicationStatus)) {
    return { error: "You do not have permission to do that." };
  }
  if (!existing && !canEditPublication(actor, "draft")) {
    return { error: "You do not have permission to do that." };
  }

  if (store.councilYears.some((year) => year.slug === meta.slug && year.id !== id)) {
    return { error: "That address is already in use." };
  }

  const record: CouncilYear = {
    id: existing?.id ?? crypto.randomUUID(),
    label: meta.label,
    slug: meta.slug,
    kind: meta.kind,
    summary: meta.summary,
    juniorHeading: meta.juniorHeading?.trim() || "Junior Student Council",
    publicationStatus: existing?.publicationStatus ?? "draft",
    sortOrder: meta.sortOrder,
    isSample: existing?.isSample ?? false,
    members: existing?.members ?? [],
    photos: existing?.photos ?? [],
    posts: existing?.posts ?? [],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    publishedAt: existing?.publishedAt ?? null,
  };

  store.councilYears = existing
    ? store.councilYears.map((year) => (year.id === existing.id ? record : year))
    : [record, ...store.councilYears];
  if (!writeContentStore(store)) return { error: "The council year could not be saved." };
  return { id: record.id, slug: record.slug, status: record.publicationStatus };
}

export function saveCouncilMemberInStore(
  actor: Actor,
  yearId: string,
  member: CouncilMemberInput,
  sortOrder: number,
): { error: string } | { id: string; slug: string; yearSlug: string } {
  const store = readContentStore();
  const found = getEditableCouncilYearFromStore(actor, store, yearId);
  if ("error" in found) return found;

  const targetId = member.id ?? crypto.randomUUID();
  const existingIndex = found.existing.members.findIndex((item) => item.id === targetId);
  const nextMembers: CouncilMember[] = found.existing.members.slice();
  const nextEntry: CouncilMember = {
    id: targetId,
    role: member.role,
    name: member.name,
    imageUrl: member.imageUrl,
    imageAlt: member.imageAlt,
    quote: member.quote,
    about: member.about,
    work: member.work,
    slug: existingIndex >= 0 ? nextMembers[existingIndex].slug : "",
    board: member.board === "junior" ? "junior" : "main",
    sortOrder,
  };

  if (existingIndex >= 0) {
    nextMembers[existingIndex] = nextEntry;
  } else {
    nextMembers.push(nextEntry);
  }
  nextMembers.sort((a, b) => a.sortOrder - b.sortOrder);
  const normalized = normalizeCouncilMembers(nextMembers).map((item, idx) => ({
    ...item,
    sortOrder: idx,
  }));
  const savedMember = normalized.find((item) => item.id === targetId);

  const updatedYear: CouncilYear = {
    ...found.existing,
    members: normalized,
    updatedAt: new Date().toISOString(),
  };
  store.councilYears = store.councilYears.map((y) => (y.id === yearId ? updatedYear : y));
  if (!writeContentStore(store)) return { error: "The council post could not be saved." };
  return {
    id: targetId,
    slug: savedMember?.slug ?? "",
    yearSlug: updatedYear.slug,
  };
}

export function deleteCouncilMemberInStore(
  actor: Actor,
  yearId: string,
  memberId: string,
): { error: string } | { ok: true; yearSlug: string } {
  const store = readContentStore();
  const found = getEditableCouncilYearFromStore(actor, store, yearId);
  if ("error" in found) return found;

  const updatedYear: CouncilYear = {
    ...found.existing,
    members: found.existing.members
      .filter((item) => item.id !== memberId)
      .map((item, idx) => ({ ...item, sortOrder: idx })),
    updatedAt: new Date().toISOString(),
  };
  store.councilYears = store.councilYears.map((y) => (y.id === yearId ? updatedYear : y));
  if (!writeContentStore(store)) return { error: "The council post could not be removed." };
  return { ok: true, yearSlug: updatedYear.slug };
}

export function saveCouncilPhotoInStore(
  actor: Actor,
  yearId: string,
  photo: CouncilPhotoInput,
  sortOrder: number,
): { error: string } | { id: string; yearSlug: string } {
  const store = readContentStore();
  const found = getEditableCouncilYearFromStore(actor, store, yearId);
  if ("error" in found) return found;

  const targetId = photo.id ?? crypto.randomUUID();
  const nextPhotos: CouncilPhoto[] = found.existing.photos.slice();
  const existingIndex = nextPhotos.findIndex((item) => item.id === targetId);
  const entry: CouncilPhoto = {
    id: targetId,
    url: photo.url,
    alt: photo.alt,
    caption: photo.caption,
    sortOrder,
  };
  if (existingIndex >= 0) nextPhotos[existingIndex] = entry;
  else nextPhotos.push(entry);
  nextPhotos.sort((a, b) => a.sortOrder - b.sortOrder);

  const updatedYear: CouncilYear = {
    ...found.existing,
    photos: nextPhotos.map((item, idx) => ({ ...item, sortOrder: idx })),
    updatedAt: new Date().toISOString(),
  };
  store.councilYears = store.councilYears.map((y) => (y.id === yearId ? updatedYear : y));
  if (!writeContentStore(store)) return { error: "The photograph could not be saved." };
  return { id: targetId, yearSlug: updatedYear.slug };
}

export function deleteCouncilPhotoInStore(
  actor: Actor,
  yearId: string,
  photoId: string,
): { error: string } | { ok: true; yearSlug: string } {
  const store = readContentStore();
  const found = getEditableCouncilYearFromStore(actor, store, yearId);
  if ("error" in found) return found;

  const updatedYear: CouncilYear = {
    ...found.existing,
    photos: found.existing.photos
      .filter((item) => item.id !== photoId)
      .map((item, idx) => ({ ...item, sortOrder: idx })),
    updatedAt: new Date().toISOString(),
  };
  store.councilYears = store.councilYears.map((y) => (y.id === yearId ? updatedYear : y));
  if (!writeContentStore(store)) return { error: "The photograph could not be removed." };
  return { ok: true, yearSlug: updatedYear.slug };
}

export function saveCouncilPostInStore(
  actor: Actor,
  yearId: string,
  post: CouncilPostInput,
  sortOrder: number,
): { error: string } | { id: string; yearSlug: string } {
  const store = readContentStore();
  const found = getEditableCouncilYearFromStore(actor, store, yearId);
  if ("error" in found) return found;

  const targetId = post.id ?? crypto.randomUUID();
  const nextPosts: CouncilPost[] = found.existing.posts.slice();
  const existingIndex = nextPosts.findIndex((item) => item.id === targetId);
  const entry: CouncilPost = {
    id: targetId,
    title: post.title,
    body: post.body,
    publishedOn: post.publishedOn,
    imageUrl: post.imageUrl,
    imageAlt: post.imageAlt,
    sortOrder,
  };
  if (existingIndex >= 0) nextPosts[existingIndex] = entry;
  else nextPosts.push(entry);
  nextPosts.sort((a, b) => a.sortOrder - b.sortOrder);

  const updatedYear: CouncilYear = {
    ...found.existing,
    posts: nextPosts.map((item, idx) => ({ ...item, sortOrder: idx })),
    updatedAt: new Date().toISOString(),
  };
  store.councilYears = store.councilYears.map((y) => (y.id === yearId ? updatedYear : y));
  if (!writeContentStore(store)) return { error: "The post could not be saved." };
  return { id: targetId, yearSlug: updatedYear.slug };
}

export function deleteCouncilPostInStore(
  actor: Actor,
  yearId: string,
  postId: string,
): { error: string } | { ok: true; yearSlug: string } {
  const store = readContentStore();
  const found = getEditableCouncilYearFromStore(actor, store, yearId);
  if ("error" in found) return found;

  const updatedYear: CouncilYear = {
    ...found.existing,
    posts: found.existing.posts
      .filter((item) => item.id !== postId)
      .map((item, idx) => ({ ...item, sortOrder: idx })),
    updatedAt: new Date().toISOString(),
  };
  store.councilYears = store.councilYears.map((y) => (y.id === yearId ? updatedYear : y));
  if (!writeContentStore(store)) return { error: "The post could not be removed." };
  return { ok: true, yearSlug: updatedYear.slug };
}

export function reorderCouncilChildrenInStore(
  actor: Actor,
  yearId: string,
  order: { memberIds?: string[]; photoIds?: string[]; postIds?: string[] },
): { error: string } | { ok: true; yearSlug: string } {
  const store = readContentStore();
  const found = getEditableCouncilYearFromStore(actor, store, yearId);
  if ("error" in found) return found;

  const applyOrder = <T extends { id: string; sortOrder: number }>(items: T[], orderedIds?: string[]) => {
    if (!orderedIds?.length) return items;
    const rank = new Map(orderedIds.map((id, idx) => [id, idx]));
    return items
      .slice()
      .sort((a, b) => (rank.get(a.id) ?? 9999) - (rank.get(b.id) ?? 9999) || a.sortOrder - b.sortOrder)
      .map((item, idx) => ({ ...item, sortOrder: idx }));
  };

  const updatedYear: CouncilYear = {
    ...found.existing,
    members: applyOrder(found.existing.members, order.memberIds),
    photos: applyOrder(found.existing.photos, order.photoIds),
    posts: applyOrder(found.existing.posts, order.postIds),
    updatedAt: new Date().toISOString(),
  };
  store.councilYears = store.councilYears.map((y) => (y.id === yearId ? updatedYear : y));
  if (!writeContentStore(store)) return { error: "The order could not be saved." };
  return { ok: true, yearSlug: updatedYear.slug };
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

export function readAcademicTerm(): AcademicTermConfig {
  const term = readContentStore().activeTerm;
  return {
    label: term?.label?.trim() || null,
    startDate: term?.startDate?.trim().slice(0, 10) || null,
  };
}

export function saveAcademicTermToStore(term: AcademicTermConfig) {
  const store = readContentStore();
  store.activeTerm = {
    label: term.label?.trim() || null,
    startDate: term.startDate?.trim().slice(0, 10) || null,
  };
  return writeContentStore(store);
}

export function demoteCurrentCouncilYearsInStore() {
  const store = readContentStore();
  store.councilYears = store.councilYears.map((year) =>
    year.kind === "current" ? { ...year, kind: "past", updatedAt: new Date().toISOString() } : year,
  );
  return writeContentStore(store);
}

export function saveAnnouncementToStore(input: {
  id?: string;
  title: string;
  body: string;
  resources: Announcement["resources"];
  eventId: string | null;
  programId?: string | null;
  wellnessId?: string | null;
  category?: string;
  academicYear?: string | null;
  coverImageUrl?: string | null;
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
    programId: input.programId ?? null,
    wellnessId: input.wellnessId ?? null,
    category: input.category || "General",
    academicYear:
      input.academicYear !== undefined
        ? input.academicYear
        : existing?.academicYear ?? store.activeTerm?.label ?? null,
    coverImageUrl: input.coverImageUrl ?? null,
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

export function saveSchoolInchargeToStore(input: {
  id?: string;
  name: string;
  role: string;
  tier?: HeadTier;
  tierLabel?: string | null;
  department?: string | null;
  photoUrl?: string | null;
  message?: string;
  about?: string;
  email?: string | null;
  phone?: string | null;
  sortOrder?: number;
  published?: boolean;
}) {
  const store = readContentStore();
  const list = store.schoolIncharges ?? seedSchoolIncharges;
  const existing = input.id ? list.find((item) => item.id === input.id) : undefined;
  const tier: HeadTier = input.tier ?? existing?.tier ?? "section";
  const defaultTierLabel =
    tier === "executive"
      ? "Executive Leadership"
      : tier === "department"
      ? "Department Heads"
      : "Section Heads";
  const message = input.message ?? input.about ?? existing?.message ?? existing?.about ?? "";

  const record: SchoolHead = {
    id: existing?.id ?? crypto.randomUUID(),
    name: input.name,
    role: input.role,
    tier,
    tierLabel: input.tierLabel ?? existing?.tierLabel ?? defaultTierLabel,
    department: input.department ?? null,
    photoUrl: input.photoUrl ?? null,
    message,
    about: message,
    email: input.email ?? null,
    phone: input.phone ?? null,
    sortOrder: input.sortOrder ?? existing?.sortOrder ?? 0,
    published: input.published ?? existing?.published ?? true,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  store.schoolIncharges = existing
    ? list.map((item) => (item.id === existing.id ? record : item))
    : [...list, record];
  return writeContentStore(store);
}

export function deleteSchoolInchargeFromStore(id: string) {
  const store = readContentStore();
  const list = store.schoolIncharges ?? seedSchoolIncharges;
  store.schoolIncharges = list.filter((item) => item.id !== id);
  return writeContentStore(store);
}

export function saveFacultyMemberToStore(input: {
  id?: string;
  name: string;
  role: string;
  tier?: FacultyTier;
  department?: string | null;
  photoUrl?: string | null;
  message?: string;
  email?: string | null;
  sortOrder?: number;
  published?: boolean;
}) {
  const store = readContentStore();
  const list = store.faculty ?? [];
  const existing = input.id ? list.find((item) => item.id === input.id) : undefined;
  const record: FacultyMember = {
    id: existing?.id ?? crypto.randomUUID(),
    name: input.name,
    role: input.role,
    tier: input.tier ?? existing?.tier ?? "supervisor",
    department: input.department ?? null,
    photoUrl: input.photoUrl ?? null,
    message: input.message ?? existing?.message ?? "",
    email: input.email ?? null,
    sortOrder: input.sortOrder ?? existing?.sortOrder ?? 0,
    published: input.published ?? existing?.published ?? true,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.faculty = existing
    ? list.map((item) => (item.id === existing.id ? record : item))
    : [...list, record];
  return writeContentStore(store);
}

export function deleteFacultyMemberFromStore(id: string) {
  const store = readContentStore();
  const list = store.faculty ?? [];
  store.faculty = list.filter((item) => item.id !== id);
  return writeContentStore(store);
}

export function saveHouseToStore(input: {
  id?: string;
  name: string;
  slug: string;
  color: House["color"];
  points?: number | null;
  inchargeName: string;
  inchargeTitle?: string | null;
  inchargePhotoUrl?: string | null;
  inchargeMessage?: string | null;
  captainName: string;
  captainPhotoUrl?: string | null;
  viceCaptainName: string;
  viceCaptainPhotoUrl?: string | null;
  motto?: string | null;
  description?: string | null;
  sortOrder?: number;
  published?: boolean;
}) {
  const store = readContentStore();
  const list = store.houses ?? seedHouses;
  const existing = input.id
    ? list.find((item) => item.id === input.id || item.slug === input.slug)
    : list.find((item) => item.slug === input.slug);

  const record: House = {
    id: existing?.id ?? crypto.randomUUID(),
    name: input.name,
    slug: input.slug,
    color: input.color,
    points: input.points !== undefined ? input.points : existing?.points,
    inchargeName: input.inchargeName,
    inchargeTitle: input.inchargeTitle ?? null,
    inchargePhotoUrl: input.inchargePhotoUrl ?? null,
    inchargeMessage: input.inchargeMessage ?? null,
    captainName: input.captainName,
    captainPhotoUrl: input.captainPhotoUrl ?? null,
    viceCaptainName: input.viceCaptainName,
    viceCaptainPhotoUrl: input.viceCaptainPhotoUrl ?? null,
    motto: input.motto ?? null,
    description: input.description ?? null,
    sortOrder: input.sortOrder ?? existing?.sortOrder ?? 0,
    published: input.published ?? existing?.published ?? true,
    updatedAt: new Date().toISOString(),
  };

  store.houses = existing
    ? list.map((item) => (item.id === existing.id ? record : item))
    : [...list, record];
  return writeContentStore(store);
}

export function updateHousePointsInStore(idOrSlug: string, points: number) {
  const store = readContentStore();
  const list = store.houses ?? seedHouses;
  const existing = list.find((item) => item.id === idOrSlug || item.slug === idOrSlug);
  if (!existing) return false;

  const updated: House = {
    ...existing,
    points: Math.max(0, points),
    updatedAt: new Date().toISOString(),
  };

  store.houses = list.map((item) => (item.id === existing.id ? updated : item));
  return writeContentStore(store);
}

export function deleteHouseFromStore(id: string) {
  const store = readContentStore();
  const list = store.houses ?? seedHouses;
  store.houses = list.filter((item) => item.id !== id && item.slug !== id);
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
  category?: string;
  timing?: string | null;
  pdfUrl?: string | null;
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
    category: input.category || "Awareness",
    timing: input.timing ?? null,
    pdfUrl: input.pdfUrl ?? null,
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

export function readSocialPostsFromStore(): SocialPost[] {
  return readContentStore().socialPosts ?? [];
}

export function saveSocialPostToStore(input: {
  id?: string;
  instagramUrl: string;
  caption: string | null;
  imageUrl: string | null;
  pinned: boolean;
  sortOrder: number;
  councilTag: string;
  academicYear?: string | null;
  publishedOn?: string;
}) {
  const store = readContentStore();
  const list = store.socialPosts ?? [];
  const existing = input.id ? list.find((item) => item.id === input.id) : undefined;
  const now = new Date().toISOString();
  const record: SocialPost = {
    id: existing?.id ?? crypto.randomUUID(),
    instagramUrl: input.instagramUrl,
    caption: input.caption,
    imageUrl: input.imageUrl,
    pinned: input.pinned,
    sortOrder: input.sortOrder,
    councilTag: input.councilTag,
    academicYear:
      input.academicYear !== undefined
        ? input.academicYear
        : existing?.academicYear ?? store.activeTerm?.label ?? null,
    publishedOn: existing?.publishedOn ?? input.publishedOn ?? now,
    createdAt: existing?.createdAt ?? now,
  };
  store.socialPosts = existing
    ? list.map((item) => (item.id === existing.id ? record : item))
    : [...list, record];
  return writeContentStore(store);
}

export function appendSocialPostsToStore(
  inputs: Array<{
    instagramUrl: string;
    caption: string | null;
    imageUrl: string | null;
    pinned: boolean;
    sortOrder: number;
    councilTag: string;
    academicYear?: string | null;
    publishedOn?: string;
  }>,
) {
  if (!inputs.length) return true;
  const store = readContentStore();
  const list = store.socialPosts ?? [];
  const now = new Date().toISOString();
  const created: SocialPost[] = inputs.map((input) => ({
    id: crypto.randomUUID(),
    instagramUrl: input.instagramUrl,
    caption: input.caption,
    imageUrl: input.imageUrl,
    pinned: input.pinned,
    sortOrder: input.sortOrder,
    councilTag: input.councilTag,
    academicYear: input.academicYear !== undefined ? input.academicYear : store.activeTerm?.label ?? null,
    publishedOn: input.publishedOn ?? now,
    createdAt: now,
  }));
  store.socialPosts = [...created, ...list];
  return writeContentStore(store);
}

export function deleteSocialPostFromStore(id: string) {
  const store = readContentStore();
  store.socialPosts = (store.socialPosts ?? []).filter((item) => item.id !== id);
  return writeContentStore(store);
}

export function readGrokConfig(): { apiKey: string | null; model: string } {
  try {
    const store = readContentStore();
    return {
      apiKey: store.aiApiKey || store.grokApiKey || process.env.GROK_API_KEY || process.env.XAI_API_KEY || null,
      model: store.aiModel || store.grokModel || "grok-2-latest",
    };
  } catch {
    return {
      apiKey: process.env.GROK_API_KEY || process.env.XAI_API_KEY || null,
      model: "grok-2-latest",
    };
  }
}

export function saveGrokConfigToStore(apiKey: string | null, model?: string | null): boolean {
  try {
    const store = readContentStore();
    store.grokApiKey = apiKey ? apiKey.trim() : null;
    store.aiApiKey = store.grokApiKey;
    if (model) {
      store.grokModel = model.trim();
      store.aiModel = store.grokModel;
    }
    return writeContentStore(store);
  } catch (error) {
    console.error(error);
    return false;
  }
}

export type StoredAiConfig = {
  provider: "xai" | "openai" | "openrouter" | "gemini" | "custom";
  apiKey: string | null;
  model: string;
  baseUrl: string | null;
};

export function readAiConfig(): StoredAiConfig {
  try {
    const store = readContentStore();
    const provider = (store.aiProvider || "xai") as StoredAiConfig["provider"];
    const apiKey =
      store.aiApiKey ||
      store.grokApiKey ||
      process.env.AI_API_KEY ||
      (provider === "xai"
        ? process.env.GROK_API_KEY || process.env.XAI_API_KEY
        : provider === "openai"
        ? process.env.OPENAI_API_KEY
        : provider === "openrouter"
        ? process.env.OPENROUTER_API_KEY
        : provider === "gemini"
        ? process.env.GEMINI_API_KEY
        : null);
    const model =
      store.aiModel ||
      store.grokModel ||
      (provider === "xai"
        ? "grok-2-latest"
        : provider === "openai"
        ? "gpt-4o"
        : provider === "gemini"
        ? "gemini-2.0-flash"
        : "x-ai/grok-2-1212");
    const baseUrl = store.aiBaseUrl || null;
    return { provider, apiKey: apiKey ?? null, model, baseUrl };
  } catch {
    return {
      provider: "xai",
      apiKey: process.env.GROK_API_KEY || process.env.XAI_API_KEY || null,
      model: "grok-2-latest",
      baseUrl: null,
    };
  }
}

export function saveAiConfigToStore(config: {
  provider?: "xai" | "openai" | "openrouter" | "gemini" | "custom";
  apiKey?: string | null;
  model?: string | null;
  baseUrl?: string | null;
}): boolean {
  try {
    const store = readContentStore();
    if (config.provider) store.aiProvider = config.provider;
    if (config.apiKey !== undefined) {
      store.aiApiKey = config.apiKey ? config.apiKey.trim() : null;
      if (store.aiProvider === "xai" || !store.aiProvider) {
        store.grokApiKey = store.aiApiKey;
      }
    }
    if (config.model) {
      store.aiModel = config.model.trim();
      if (store.aiProvider === "xai" || !store.aiProvider) {
        store.grokModel = store.aiModel;
      }
    }
    if (config.baseUrl !== undefined) {
      store.aiBaseUrl = config.baseUrl ? config.baseUrl.trim() : null;
    }
    return writeContentStore(store);
  } catch (error) {
    console.error(error);
    return false;
  }
}
