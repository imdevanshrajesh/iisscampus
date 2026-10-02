"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { can, canDelete, canEditPublication, canTransition } from "@/lib/auth/permissions";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { getCampusActor } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/config";
import { contentMode } from "@/lib/data/content-mode";
import {
  addCategoryToStore,
  deleteFromStore,
  saveAchievementToStore,
  saveEventToStore,
} from "@/lib/data/file-content";
import { classifyMediaUrl, classifyNavigationUrl, parseMediaHostList } from "@/lib/media/url";
import { createStaffClient } from "@/lib/supabase/server";
import {
  achievementInputSchema,
  eventInputSchema,
  validateEventMedia,
  type AchievementInput,
  type EventInput,
} from "@/lib/validation/content";
import type { PublicationStatus } from "@/lib/types";

export type ActionState = {
  error?: string;
  ok?: string;
};

const genericDenial = "You do not have permission to do that.";
const unavailable = "Content management is not connected yet.";

async function clientAddress() {
  const headerStore = await headers();
  return headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

async function staffContext(): Promise<
  | { error: string }
  | {
      supabase: NonNullable<Awaited<ReturnType<typeof createStaffClient>>>;
      actor: NonNullable<Awaited<ReturnType<typeof getCampusActor>>>;
    }
> {
  if (!isSupabaseConfigured()) return { error: unavailable };
  const supabase = await createStaffClient();
  const actor = await getCampusActor();
  if (!supabase || !actor) return { error: "Sign in is required." };
  return { supabase, actor };
}

function issueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message || "Check the form and try again.";
}

function httpsOrNull(value: string | null) {
  if (!value) return null;
  const classified = classifyNavigationUrl(value);
  return classified.ok ? classified.url : null;
}

function eventRecord(input: EventInput, status: PublicationStatus, featured: boolean) {
  return {
    title: input.title,
    slug: input.slug,
    short_description: input.shortDescription,
    full_description: input.fullDescription,
    category_id: input.categoryId,
    cover_image_url: input.coverImageUrl,
    cover_alt: input.coverAlt,
    cover_attribution: input.coverAttribution,
    event_date: input.eventDate,
    end_date: input.endDate,
    event_status: input.eventStatus,
    featured,
    registration_enabled: input.registrationEnabled,
    registration_provider: input.registrationProvider,
    registration_url: input.registrationEnabled ? httpsOrNull(input.registrationUrl) : null,
    registration_label: input.registrationLabel,
    registration_deadline: input.registrationDeadline,
    registration_instructions: input.registrationInstructions,
    instagram_url: httpsOrNull(input.instagramUrl),
    purpose: input.purpose,
    activities: input.activities,
    video_url: httpsOrNull(input.videoUrl),
    schedule: input.schedule,
    groups: input.groups,
    publication_status: status,
  };
}

async function replaceChildren(
  supabase: NonNullable<Awaited<ReturnType<typeof createStaffClient>>>,
  eventId: string,
  input: EventInput,
  allowedHosts: readonly string[],
) {
  const images = input.images.map((image, index) => {
    const classified = classifyMediaUrl(image.url, allowedHosts);
    if (!classified.ok) throw new Error(classified.message);
    return {
      event_id: eventId,
      url: classified.url,
      alt: image.alt,
      caption: image.caption,
      attribution: image.attribution,
      sort_order: index,
    };
  });

  const removedImages = await supabase.from("campus_event_images").delete().eq("event_id", eventId);
  if (removedImages.error) throw new Error("The gallery could not be saved.");
  if (images.length) {
    const inserted = await supabase.from("campus_event_images").insert(images);
    if (inserted.error) throw new Error("The gallery could not be saved.");
  }

  const removedRelations = await supabase
    .from("campus_event_relations")
    .delete()
    .eq("event_id", eventId);
  if (removedRelations.error) throw new Error("Related events could not be saved.");
  const relations = input.relatedIds
    .filter((id) => id !== eventId)
    .map((relatedId) => ({ event_id: eventId, related_event_id: relatedId }));
  if (relations.length) {
    const inserted = await supabase.from("campus_event_relations").insert(relations);
    if (inserted.error) throw new Error("Related events could not be saved.");
  }
}

async function writeAudit(
  supabase: NonNullable<Awaited<ReturnType<typeof createStaffClient>>>,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string | null,
) {
  const result = await supabase.from("campus_audit_log").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
  });
  if (result.error) console.error("Audit record failed.");
}

function readList(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return [];
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function readEventInput(formData: FormData) {
  const images = readList(formData, "images");
  const schedule = readList(formData, "schedule");
  const groups = readList(formData, "groups");
  if (!images || !schedule || !groups) return { error: "A list field could not be read." };

  const parsed = eventInputSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    shortDescription: formData.get("shortDescription"),
    fullDescription: formData.get("fullDescription"),
    categoryId: formData.get("categoryId"),
    coverImageUrl: formData.get("coverImageUrl"),
    coverAlt: formData.get("coverAlt"),
    coverAttribution: formData.get("coverAttribution"),
    eventDate: formData.get("eventDate"),
    endDate: formData.get("endDate"),
    eventStatus: formData.get("eventStatus"),
    featured: formData.get("featured") === "on",
    registrationEnabled: formData.get("registrationEnabled") === "on",
    registrationProvider: formData.get("registrationProvider"),
    registrationUrl: formData.get("registrationUrl"),
    registrationLabel: formData.get("registrationLabel"),
    registrationDeadline: formData.get("registrationDeadline"),
    registrationInstructions: formData.get("registrationInstructions"),
    instagramUrl: formData.get("instagramUrl"),
    purpose: formData.get("purpose"),
    activities: formData.get("activities"),
    videoUrl: formData.get("videoUrl"),
    schedule,
    groups,
    images,
    relatedIds: formData.getAll("relatedIds").map(String).filter(Boolean),
  });

  if (!parsed.success) return { error: issueMessage(parsed.error) };
  return { input: parsed.data };
}

export async function signIn(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: unavailable };
  const address = await clientAddress();
  if (!consumeRateLimit(`login:${address}`, 8, 15 * 60 * 1000)) {
    return { error: "Too many attempts. Try again later." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter an email and password." };

  const supabase = await createStaffClient();
  if (!supabase) return { error: unavailable };

  const signedIn = await supabase.auth.signInWithPassword({ email, password });
  if (signedIn.error) {
    return { error: "Sign-in failed. Check the email and password, or confirm this account has access." };
  }

  const actor = await getCampusActor();
  if (!actor) {
    await supabase.auth.signOut();
    return { error: "Sign-in failed. Check the email and password, or confirm this account has access." };
  }

  redirect("/manage");
}

export async function signOut() {
  const supabase = await createStaffClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/manage/login");
}

export async function saveEvent(_state: ActionState, formData: FormData): Promise<ActionState> {
  if ((await contentMode()) === "file") {
    const actor = await getCampusActor();
    if (!actor) return { error: "Sign in is required." };
    if (!can(actor, "create_draft")) return { error: genericDenial };
    const parsed = readEventInput(formData);
    if ("error" in parsed) return parsed;
    const mediaErrors = validateEventMedia(parsed.input, []);
    const firstMediaError = Object.values(mediaErrors)[0];
    if (firstMediaError) return { error: firstMediaError };
    const saved = saveEventToStore(
      actor,
      parsed.input,
      String(formData.get("intent") ?? "save"),
      String(formData.get("id") ?? ""),
    );
    if ("error" in saved && saved.error) return { error: saved.error };
    if (!("id" in saved)) return { error: "The event could not be saved." };
    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath(`/events/${saved.slug}`);
    revalidatePath("/gallery");
    revalidatePath("/manage");
    revalidatePath("/manage/events");
    if (!formData.get("id")) redirect(`/manage/events/${saved.id}/edit`);
    return { ok: saved.status === "published" ? "Published." : "Draft saved." };
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "create_draft")) return { error: genericDenial };

  const settings = await context.supabase
    .from("campus_settings")
    .select("media_hosts")
    .eq("id", true)
    .maybeSingle();
  if (settings.error) return { error: "Image settings could not be loaded." };
  const allowedHosts = Array.isArray(settings.data?.media_hosts)
    ? settings.data.media_hosts.map(String)
    : [];

  const parsed = readEventInput(formData);
  if ("error" in parsed) return parsed;
  const mediaErrors = validateEventMedia(parsed.input, allowedHosts);
  const firstMediaError = Object.values(mediaErrors)[0];
  if (firstMediaError) return { error: firstMediaError };

  const intent = String(formData.get("intent") ?? "save");
  const id = String(formData.get("id") ?? "");
  let status: PublicationStatus = "draft";
  let featured = context.actor.role === "administrator" ? parsed.input.featured : false;
  let publishedAt: string | null = null;

  if (id) {
    const existing = await context.supabase
      .from("campus_events")
      .select("publication_status, featured, published_at")
      .eq("id", id)
      .maybeSingle();
    if (existing.error || !existing.data) return { error: "That event could not be found." };
    const current = existing.data.publication_status as PublicationStatus;
    if (!canEditPublication(context.actor, current) && intent === "save") {
      return { error: genericDenial };
    }
    featured = context.actor.role === "administrator" ? parsed.input.featured : Boolean(existing.data.featured);
    publishedAt = existing.data.published_at ? String(existing.data.published_at) : null;
    status = current;

    if (intent === "submit") {
      if (!canTransition(context.actor, current, "in_review")) return { error: genericDenial };
      status = "in_review";
    } else if (intent === "publish") {
      if (!canTransition(context.actor, current, "published")) return { error: genericDenial };
      status = "published";
      publishedAt = publishedAt ?? new Date().toISOString();
    } else if (intent === "unpublish") {
      if (!canTransition(context.actor, current, "draft")) return { error: genericDenial };
      status = "draft";
    } else if (intent === "archive") {
      if (formData.get("confirmArchive") !== "yes") {
        return { error: "Confirm archiving before continuing." };
      }
      if (!canTransition(context.actor, current, "archived")) return { error: genericDenial };
      status = "archived";
    } else if (intent === "restore") {
      if (!canTransition(context.actor, current, "draft")) return { error: genericDenial };
      status = "draft";
    } else if (!canEditPublication(context.actor, current)) {
      return { error: genericDenial };
    }
  } else if (intent !== "save") {
    return { error: "Save the draft before changing its status." };
  }

  const slugOwner = await context.supabase
    .from("campus_events")
    .select("id")
    .eq("slug", parsed.input.slug)
    .maybeSingle();
  if (slugOwner.error) return { error: "The event address could not be checked." };
  if (slugOwner.data && slugOwner.data.id !== id) {
    return { error: "That address is already in use." };
  }

  const record = {
    ...eventRecord(parsed.input, status, featured),
    published_at: publishedAt,
  };

  const saved = id
    ? await context.supabase.from("campus_events").update(record).eq("id", id).select("id").maybeSingle()
    : await context.supabase
        .from("campus_events")
        .insert({ ...record, created_by: context.actor.userId, is_sample: false })
        .select("id")
        .maybeSingle();

  if (saved.error || !saved.data) return { error: "The event could not be saved." };

  try {
    await replaceChildren(context.supabase, saved.data.id, parsed.input, allowedHosts);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The event details could not be saved." };
  }

  if (intent !== "save") {
    await writeAudit(context.supabase, context.actor.userId, intent, "campus_events", saved.data.id);
  }

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath(`/events/${parsed.input.slug}`);
  revalidatePath("/gallery");
  revalidatePath("/manage");
  revalidatePath("/manage/events");

  if (!id) redirect(`/manage/events/${saved.data.id}/edit`);
  return { ok: status === "published" ? "Published." : "Saved." };
}

export async function saveAchievement(_state: ActionState, formData: FormData): Promise<ActionState> {
  if ((await contentMode()) === "file") {
    const actor = await getCampusActor();
    if (!actor || !can(actor, "manage_achievements")) return { error: genericDenial };
    const parsed = achievementInputSchema.safeParse({
      title: formData.get("title"),
      competitionName: formData.get("competitionName"),
      winnerName: formData.get("winnerName"),
      award: formData.get("award"),
      eventDate: formData.get("eventDate"),
      academicYear: formData.get("academicYear"),
      categoryId: formData.get("categoryId"),
      eventId: formData.get("eventId"),
      imageUrl: formData.get("imageUrl"),
      imageAlt: formData.get("imageAlt"),
    });
    if (!parsed.success) return { error: issueMessage(parsed.error) };
    const saved = saveAchievementToStore(
      actor,
      parsed.data,
      String(formData.get("intent") ?? "save"),
      String(formData.get("id") ?? ""),
    );
    if ("error" in saved) return { error: saved.error };
    revalidatePath("/achievements");
    revalidatePath("/manage/achievements");
    return { ok: "Draft saved." };
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "manage_achievements")) return { error: genericDenial };

  const parsed = achievementInputSchema.safeParse({
    title: formData.get("title"),
    competitionName: formData.get("competitionName"),
    winnerName: formData.get("winnerName"),
    award: formData.get("award"),
    eventDate: formData.get("eventDate"),
    academicYear: formData.get("academicYear"),
    categoryId: formData.get("categoryId"),
    eventId: formData.get("eventId"),
    imageUrl: formData.get("imageUrl"),
    imageAlt: formData.get("imageAlt"),
  });
  if (!parsed.success) return { error: issueMessage(parsed.error) };

  const input: AchievementInput = parsed.data;
  const settings = await context.supabase
    .from("campus_settings")
    .select("media_hosts")
    .eq("id", true)
    .maybeSingle();
  const allowedHosts = Array.isArray(settings.data?.media_hosts)
    ? settings.data.media_hosts.map(String)
    : [];
  if (input.imageUrl) {
    const image = classifyMediaUrl(input.imageUrl, allowedHosts);
    if (!image.ok) return { error: image.message };
    if (!input.imageAlt) return { error: "Add alternative text for the photograph." };
    input.imageUrl = image.url;
  }

  const id = String(formData.get("id") ?? "");
  const intent = String(formData.get("intent") ?? "save");
  let status: PublicationStatus = "draft";
  let publishedAt: string | null = null;

  if (id) {
    const existing = await context.supabase
      .from("campus_achievements")
      .select("publication_status, published_at")
      .eq("id", id)
      .maybeSingle();
    if (existing.error || !existing.data) return { error: "That achievement could not be found." };
    const current = existing.data.publication_status as PublicationStatus;
    publishedAt = existing.data.published_at ? String(existing.data.published_at) : null;
    status = current;
    if (intent === "submit" && canTransition(context.actor, current, "in_review")) status = "in_review";
    else if (intent === "publish" && canTransition(context.actor, current, "published")) {
      status = "published";
      publishedAt = publishedAt ?? new Date().toISOString();
    } else if (intent === "unpublish" && canTransition(context.actor, current, "draft")) status = "draft";
    else if (intent === "archive") {
      if (formData.get("confirmArchive") !== "yes") return { error: "Confirm archiving before continuing." };
      if (!canTransition(context.actor, current, "archived")) return { error: genericDenial };
      status = "archived";
    } else if (intent === "save" && !canEditPublication(context.actor, current)) return { error: genericDenial };
    else if (intent !== "save") return { error: genericDenial };
  }

  const record = {
    title: input.title,
    competition_name: input.competitionName,
    winner_name: input.winnerName,
    award: input.award,
    event_date: input.eventDate,
    academic_year: input.academicYear,
    category_id: input.categoryId,
    event_id: input.eventId,
    image_url: input.imageUrl,
    image_alt: input.imageAlt,
    publication_status: status,
    published_at: publishedAt,
    is_sample: false,
  };

  const saved = id
    ? await context.supabase.from("campus_achievements").update(record).eq("id", id)
    : await context.supabase.from("campus_achievements").insert(record);
  if (saved.error) return { error: "The achievement could not be saved." };

  revalidatePath("/achievements");
  revalidatePath("/manage/achievements");
  return { ok: "Saved." };
}

export async function saveCategory(_state: ActionState, formData: FormData): Promise<ActionState> {
  if ((await contentMode()) === "file") {
    const actor = await getCampusActor();
    if (!actor || !can(actor, "manage_categories")) return { error: genericDenial };
    const name = String(formData.get("name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    if (name.length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return { error: "Enter a category name and a lowercase slug." };
    }
    if (!addCategoryToStore(name, slug, description)) return { error: "The category could not be saved." };
    revalidatePath("/events");
    revalidatePath("/manage/events");
    return { ok: "Category added." };
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "manage_categories")) return { error: genericDenial };

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (name.length < 2 || name.length > 60) return { error: "Enter a category name." };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { error: "Use a lowercase slug." };

  const saved = await context.supabase.from("campus_categories").insert({
    name,
    slug,
    description: description || null,
  });
  if (saved.error) return { error: "The category could not be saved." };
  revalidatePath("/events");
  revalidatePath("/manage/events");
  return { ok: "Category added." };
}

export async function saveSettings(_state: ActionState, formData: FormData): Promise<ActionState> {
  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "manage_settings")) return { error: genericDenial };

  const parsed = parseMediaHostList(String(formData.get("mediaHosts") ?? ""));
  if (parsed.errors.length) return { error: parsed.errors[0] };

  const saved = await context.supabase
    .from("campus_settings")
    .update({ media_hosts: parsed.hosts })
    .eq("id", true);
  if (saved.error) return { error: "Image hosts could not be saved." };

  await writeAudit(context.supabase, context.actor.userId, "update_media_hosts", "campus_settings", null);
  revalidatePath("/");
  revalidatePath("/manage/settings");
  return { ok: "Image hosts saved." };
}

export async function grantRole(_state: ActionState, formData: FormData): Promise<ActionState> {
  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "manage_roles")) return { error: genericDenial };

  const userId = String(formData.get("userId") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { error: "Enter the person’s account id." };
  if (role !== "editor" && role !== "administrator") return { error: "Choose a role." };

  const granted = await context.supabase.rpc("grant_campus_role", {
    target_user: userId,
    target_role: role,
    note: note || null,
  });
  if (granted.error) return { error: genericDenial };

  revalidatePath("/manage/settings");
  return { ok: "Role updated." };
}

const deleteFailed = "This record could not be deleted.";

export async function deleteEvent(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("confirm") !== "yes") return { error: "Confirm the delete, then try again." };

  if ((await contentMode()) === "file") {
    const actor = await getCampusActor();
    if (!actor) return { error: "Sign in is required." };
    if (!deleteFromStore(actor, "events", String(formData.get("id") ?? ""))) return { error: deleteFailed };
    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath("/gallery");
    revalidatePath("/manage/events");
    redirect("/manage/events");
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };

  const id = String(formData.get("id") ?? "");
  const existing = await context.supabase
    .from("campus_events")
    .select("publication_status, slug")
    .eq("id", id)
    .maybeSingle();
  if (existing.error || !existing.data) return { error: deleteFailed };
  const status = existing.data.publication_status as PublicationStatus;
  if (!canDelete(context.actor, status)) return { error: genericDenial };

  const removed = await context.supabase.from("campus_events").delete().eq("id", id).select("id");
  if (removed.error || !removed.data?.length) return { error: deleteFailed };

  await writeAudit(context.supabase, context.actor.userId, "delete", "campus_events", id);
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath(`/events/${existing.data.slug}`);
  revalidatePath("/gallery");
  revalidatePath("/manage/events");
  redirect("/manage/events");
}

export async function deleteAchievement(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("confirm") !== "yes") return { error: "Confirm the delete, then try again." };

  if ((await contentMode()) === "file") {
    const actor = await getCampusActor();
    if (!actor) return { error: "Sign in is required." };
    if (!deleteFromStore(actor, "achievements", String(formData.get("id") ?? ""))) return { error: deleteFailed };
    revalidatePath("/achievements");
    revalidatePath("/manage/achievements");
    return {};
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };

  const id = String(formData.get("id") ?? "");
  const existing = await context.supabase
    .from("campus_achievements")
    .select("publication_status")
    .eq("id", id)
    .maybeSingle();
  if (existing.error || !existing.data) return { error: deleteFailed };
  const status = existing.data.publication_status as PublicationStatus;
  if (!canDelete(context.actor, status)) return { error: genericDenial };

  const removed = await context.supabase.from("campus_achievements").delete().eq("id", id).select("id");
  if (removed.error || !removed.data?.length) return { error: deleteFailed };

  await writeAudit(context.supabase, context.actor.userId, "delete", "campus_achievements", id);
  revalidatePath("/achievements");
  revalidatePath("/manage/achievements");
  return {};
}
