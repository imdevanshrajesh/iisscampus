import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { canDelete, canEditPublication, canTransition, type Actor } from "@/lib/auth/permissions";
import { seedAchievements, seedCategories, seedEvents } from "@/lib/data/seed";
import type { Achievement, CampusEvent, Category, PublicationStatus } from "@/lib/types";
import type { AchievementInput, EventInput } from "@/lib/validation/content";

type Store = {
  events: CampusEvent[];
  achievements: Achievement[];
  categories: Category[];
};

const filePath = path.join(process.cwd(), "data", "campus.json");

function initialStore(): Store {
  return {
    events: seedEvents,
    achievements: seedAchievements,
    categories: seedCategories,
  };
}

export function readContentStore(): Store {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as Store;
  } catch {
    return initialStore();
  }
}

function writeContentStore(store: Store) {
  try {
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(store, null, 2));
  } catch {
    // Vercel cannot write this file. The in-memory records still render.
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
  writeContentStore(store);
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
  writeContentStore(store);
  return { ok: true };
}

export function deleteFromStore(actor: Actor, kind: "events" | "achievements", id: string) {
  const store = readContentStore();
  if (kind === "events") {
    const existing = store.events.find((event) => event.id === id);
    if (!existing || !canDelete(actor, existing.publicationStatus)) return false;
    store.events = store.events.filter((event) => event.id !== id);
    store.achievements = store.achievements.map((item) =>
      item.eventId === id ? { ...item, eventId: null } : item,
    );
  } else {
    const existing = store.achievements.find((item) => item.id === id);
    if (!existing || !canDelete(actor, existing.publicationStatus)) return false;
    store.achievements = store.achievements.filter((item) => item.id !== id);
  }
  writeContentStore(store);
  return true;
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
  writeContentStore(store);
  return true;
}
