import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { canDelete, canEditPublication, canTransition, type Actor } from "@/lib/auth/permissions";
import { councilMemberSlugs } from "@/lib/data/catalog";
import { seedAchievements, seedCategories, seedCouncilYears, seedEvents } from "@/lib/data/seed";
import type { Achievement, CampusEvent, Category, CouncilMember, CouncilYear, Newsletter, PublicationStatus, SocialLinks } from "@/lib/types";
import type { AchievementInput, CouncilInput, EventInput } from "@/lib/validation/content";

type Store = {
  events: CampusEvent[];
  achievements: Achievement[];
  categories: Category[];
  councilYears: CouncilYear[];
  newsletter?: Newsletter | null;
  social?: SocialLinks | null;
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
  }));
  const slugs = councilMemberSlugs(normalized);
  return normalized.map((member, index) => ({ ...member, slug: slugs[index] ?? member.slug }));
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
      events: Array.isArray(parsed.events) ? parsed.events : seedEvents,
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : seedAchievements,
      categories: Array.isArray(parsed.categories) ? parsed.categories : seedCategories,
      councilYears: Array.isArray(parsed.councilYears)
        ? parsed.councilYears.map((year) => ({
            ...year,
            members: normalizeCouncilMembers(year.members ?? []),
            photos: year.photos ?? [],
            posts: year.posts ?? [],
          }))
        : seedCouncilYears,
      newsletter: parsed.newsletter ?? null,
      social: parsed.social ?? null,
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
  const record: CampusEvent = {
    id: nextId,
    title: input.title,
    slug: input.slug,
    shortDescription: input.shortDescription,
    fullDescription: input.fullDescription,
    categoryId: input.categoryId,
    coverImageUrl: input.coverImageUrl,
    coverAlt: input.coverAlt,
    coverAttribution: input.coverAttribution,
    eventDate: input.eventDate,
    endDate: input.endDate,
    publicationStatus: status,
    eventStatus: input.eventStatus,
    featured,
    isSample: existing?.isSample ?? false,
    registrationEnabled: input.registrationEnabled,
    registrationProvider: input.registrationProvider,
    registrationUrl: input.registrationEnabled ? input.registrationUrl : null,
    registrationLabel: input.registrationLabel,
    registrationDeadline: input.registrationDeadline,
    registrationInstructions: input.registrationInstructions,
    instagramUrl: input.instagramUrl,
    purpose: input.purpose,
    activities: input.activities,
    schedule: input.schedule,
    groups: input.groups,
    videoUrl: input.videoUrl,
    images: input.images.map((image, index) => ({
      id: image.id ?? crypto.randomUUID(),
      url: image.url,
      alt: image.alt,
      caption: image.caption,
      attribution: image.attribution,
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
  return { id: record.id, slug: record.slug, status };
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

export function addCategoryToStore(name: string, slug: string, description: string) {
  const store = readContentStore();
  if (store.categories.some((category) => category.slug === slug)) return false;
  store.categories.push({
    id: crypto.randomUUID(),
    name,
    slug,
    description,
    sortOrder: store.categories.length + 1,
  });
  return writeContentStore(store);
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
