"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { can, canDelete, canEditPublication, canTransition } from "@/lib/auth/permissions";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { getCampusActor, getCampusSession, sessionActionError } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/config";
import { contentMode } from "@/lib/data/content-mode";
import {
  addCategoryToStore,
  deleteFromStore,
  saveAchievementToStore,
  saveCouncilToStore,
  saveEventToStore,
  saveNewsletterToStore,
} from "@/lib/data/file-content";
import { classifyMediaUrl, classifyNavigationUrl, parseMediaHostList } from "@/lib/media/url";
import { isMissingTableError, missingCouncilTablesMessage } from "@/lib/supabase/errors";
import { createStaffClient } from "@/lib/supabase/server";
import {
  achievementInputSchema,
  councilInputFromForm,
  eventInputSchema,
  validateCouncilMedia,
  validateEventMedia,
  type AchievementInput,
  type CouncilInput,
  type EventInput,
} from "@/lib/validation/content";
import type { PublicationStatus } from "@/lib/types";

export type ActionState = {
  error?: string;
  ok?: string;
};

const genericDenial = "You do not have permission to do that.";
const unavailable = "Content management is not connected yet.";
const writeDenied = "The signed-in account is not allowed to write that record.";

type DatabaseError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

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
  if (!supabase) return { error: "Sign in is required." };
  const session = await getCampusSession();
  const denied = sessionActionError(session);
  if (denied || session.status !== "ok") return { error: denied ?? "Sign in is required." };
  return { supabase, actor: session.actor };
}

function issueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message || "Check the form and try again.";
}

function httpsOrNull(value: string | null) {
  if (!value) return null;
  const classified = classifyNavigationUrl(value);
  return classified.ok ? classified.url : null;
}

function databaseError(error: DatabaseError | null | undefined, fallback: string) {
  if (!error) return fallback;
  console.error(error);

  const code = error.code ?? "";
  const message = (error.message ?? "").trim();
  const details = (error.details ?? "").trim();
  const combined = `${message} ${details}`.toLowerCase();

  if (code === "23505" || combined.includes("duplicate key") || combined.includes("unique constraint")) {
    return "That address is already in use.";
  }
  if (code === "23503") {
    if (combined.includes("category")) return "That category does not exist.";
    return "A related record is missing. Check the category and try again.";
  }
  if (code === "23502" || combined.includes("null value")) {
    return "A required field is missing. Check the form and try again.";
  }
  if (code === "22P02" || combined.includes("invalid input syntax")) {
    return "One of the fields has an invalid value. Check the form and try again.";
  }
  if (
    code === "23514" ||
    code === "P0001" ||
    combined.includes("image url is not allowed") ||
    combined.includes("check constraint")
  ) {
    if (combined.includes("image url is not allowed")) {
      return "This image URL is not allowed. An administrator can add the host in content settings.";
    }
    return "One of the fields failed a database check. Review the form and try again.";
  }
  if (combined.includes("has no field")) {
    return "A database media trigger is out of date. Run supabase/FIX_MEDIA_URL_TRIGGER.sql in the Supabase SQL editor, then try again.";
  }
  if (code === "42P01" || code === "PGRST205" || combined.includes("could not find the table")) {
    if (combined.includes("campus_council")) return missingCouncilTablesMessage();
    return "Campus tables are not in the database yet. Apply the latest campus migration, then try again.";
  }
  if (code === "PGRST204") {
    return "A required campus column is missing. Apply the latest campus migration, then try again.";
  }
  if (combined.includes("permission denied")) {
    return "Database privileges are missing for content writes. Run supabase/GRANTS_CAMPUS.sql in the Supabase SQL editor, then try again.";
  }
  if (
    code === "42501" ||
    combined.includes("row-level security") ||
    combined.includes("violates row-level security")
  ) {
    return writeDenied;
  }
  if (message) return `${fallback} ${message}`;
  return fallback;
}

async function fileActor(
  allowed: (actor: NonNullable<Awaited<ReturnType<typeof getCampusActor>>>) => boolean,
): Promise<{ error: string } | { actor: NonNullable<Awaited<ReturnType<typeof getCampusActor>>> }> {
  const session = await getCampusSession();
  const denied = sessionActionError(session);
  if (denied || session.status !== "ok") return { error: denied ?? "Sign in is required." };
  if (!allowed(session.actor)) return { error: genericDenial };
  return { actor: session.actor };
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
  if (removedImages.error) {
    throw new Error(databaseError(removedImages.error, "The gallery could not be saved."));
  }
  if (images.length) {
    const inserted = await supabase.from("campus_event_images").insert(images);
    if (inserted.error) {
      throw new Error(databaseError(inserted.error, "The gallery could not be saved."));
    }
  }

  const removedRelations = await supabase
    .from("campus_event_relations")
    .delete()
    .eq("event_id", eventId);
  if (removedRelations.error) {
    throw new Error(databaseError(removedRelations.error, "Related events could not be saved."));
  }
  const relations = input.relatedIds
    .filter((id) => id !== eventId)
    .map((relatedId) => ({ event_id: eventId, related_event_id: relatedId }));
  if (relations.length) {
    const inserted = await supabase.from("campus_event_relations").insert(relations);
    if (inserted.error) {
      throw new Error(databaseError(inserted.error, "Related events could not be saved."));
    }
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

  const session = await getCampusSession();
  if (session.status === "no_role") {
    await supabase.auth.signOut();
    return {
      error:
        "This account signed in, but it has no campus role yet. Run supabase/BOOTSTRAP_CAMPUS_ADMIN.sql with your auth user id, then try again.",
    };
  }
  const denied = sessionActionError(session);
  if (denied || session.status !== "ok") {
    await supabase.auth.signOut();
    return { error: denied ?? "Sign-in failed. Check the email and password, or confirm this account has access." };
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
    const session = await getCampusSession();
    const denied = sessionActionError(session);
    if (denied || session.status !== "ok") return { error: denied ?? "Sign in is required." };
    if (!can(session.actor, "create_draft")) return { error: genericDenial };
    const parsed = readEventInput(formData);
    if ("error" in parsed) return parsed;
    const mediaErrors = validateEventMedia(parsed.input, []);
    const firstMediaError = Object.values(mediaErrors)[0];
    if (firstMediaError) return { error: firstMediaError };
    const saved = saveEventToStore(
      session.actor,
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

  if (saved.error) {
    return { error: databaseError(saved.error, "The event could not be saved.") };
  }

  let eventId = saved.data?.id ?? null;
  if (!eventId) {
    const lookup = id
      ? await context.supabase.from("campus_events").select("id").eq("id", id).maybeSingle()
      : await context.supabase
          .from("campus_events")
          .select("id")
          .eq("slug", parsed.input.slug)
          .maybeSingle();
    if (lookup.error) {
      return { error: databaseError(lookup.error, "The event could not be saved.") };
    }
    eventId = lookup.data?.id ?? null;
  }
  if (!eventId) return { error: writeDenied };

  try {
    await replaceChildren(context.supabase, eventId, parsed.input, allowedHosts);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The event details could not be saved." };
  }

  if (intent !== "save") {
    await writeAudit(context.supabase, context.actor.userId, intent, "campus_events", eventId);
  }

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath(`/events/${parsed.input.slug}`);
  revalidatePath("/gallery");
  revalidatePath("/manage");
  revalidatePath("/manage/events");

  if (!id) redirect(`/manage/events/${eventId}/edit`);
  return { ok: status === "published" ? "Published." : "Saved." };
}

export async function saveAchievement(_state: ActionState, formData: FormData): Promise<ActionState> {
  if ((await contentMode()) === "file") {
    const access = await fileActor((actor) => can(actor, "manage_achievements"));
    if ("error" in access) return access;
    const actor = access.actor;
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
  if (saved.error) {
    return { error: databaseError(saved.error, "The achievement could not be saved.") };
  }

  revalidatePath("/achievements");
  revalidatePath("/manage/achievements");
  return { ok: "Saved." };
}

export async function saveCategory(_state: ActionState, formData: FormData): Promise<ActionState> {
  if ((await contentMode()) === "file") {
    const access = await fileActor((actor) => can(actor, "manage_categories"));
    if ("error" in access) return access;
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
  if (saved.error) {
    return { error: databaseError(saved.error, "The category could not be saved.") };
  }
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
  if (saved.error) {
    return { error: databaseError(saved.error, "Image hosts could not be saved.") };
  }

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
  if (granted.error) {
    return { error: databaseError(granted.error, genericDenial) };
  }

  revalidatePath("/manage/settings");
  return { ok: "Role updated." };
}

const deleteFailed = "This record could not be deleted.";

async function finishDelete(
  removed: { data: { id: string }[] | null; error: DatabaseError | null },
  lookup: () => PromiseLike<{ data: { id: string } | null; error: DatabaseError | null }>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (removed.error) {
    return { ok: false, error: databaseError(removed.error, deleteFailed) };
  }
  if (removed.data?.length) return { ok: true };
  const check = await lookup();
  if (check.error) {
    return { ok: false, error: databaseError(check.error, deleteFailed) };
  }
  if (check.data) return { ok: false, error: writeDenied };
  return { ok: true };
}

function manageDestination(formData: FormData, fallback: string) {
  const next = String(formData.get("next") ?? "");
  if (
    next === "/manage/events" ||
    next === "/manage/achievements" ||
    next === "/manage/gallery" ||
    next === "/manage/council"
  ) {
    return next;
  }
  return fallback;
}

export async function deleteEvent(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("confirm") !== "yes") return { error: "Confirm the delete, then try again." };

  if ((await contentMode()) === "file") {
    const access = await fileActor(() => true);
    if ("error" in access) return access;
    if (!deleteFromStore(access.actor, "events", String(formData.get("id") ?? ""))) return { error: deleteFailed };
    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath("/gallery");
    revalidatePath("/manage/events");
    revalidatePath("/manage/gallery");
    redirect(manageDestination(formData, "/manage/events"));
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };

  const id = String(formData.get("id") ?? "");
  const existing = await context.supabase
    .from("campus_events")
    .select("publication_status, slug")
    .eq("id", id)
    .maybeSingle();
  if (existing.error) return { error: databaseError(existing.error, deleteFailed) };
  if (!existing.data) return { error: deleteFailed };
  const status = existing.data.publication_status as PublicationStatus;
  if (!canDelete(context.actor, status)) return { error: genericDenial };

  const removed = await context.supabase.from("campus_events").delete().eq("id", id).select("id");
  const gone = await finishDelete(removed, () =>
    context.supabase.from("campus_events").select("id").eq("id", id).maybeSingle(),
  );
  if (!gone.ok) return { error: gone.error };

  await writeAudit(context.supabase, context.actor.userId, "delete", "campus_events", id);
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath(`/events/${existing.data.slug}`);
  revalidatePath("/gallery");
  revalidatePath("/manage/events");
  revalidatePath("/manage/gallery");
  redirect(manageDestination(formData, "/manage/events"));
}

export async function deleteAchievement(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("confirm") !== "yes") return { error: "Confirm the delete, then try again." };

  if ((await contentMode()) === "file") {
    const access = await fileActor(() => true);
    if ("error" in access) return access;
    if (!deleteFromStore(access.actor, "achievements", String(formData.get("id") ?? ""))) return { error: deleteFailed };
    revalidatePath("/achievements");
    revalidatePath("/manage/achievements");
    redirect(manageDestination(formData, "/manage/achievements"));
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };

  const id = String(formData.get("id") ?? "");
  const existing = await context.supabase
    .from("campus_achievements")
    .select("publication_status")
    .eq("id", id)
    .maybeSingle();
  if (existing.error) return { error: databaseError(existing.error, deleteFailed) };
  if (!existing.data) return { error: deleteFailed };
  const status = existing.data.publication_status as PublicationStatus;
  if (!canDelete(context.actor, status)) return { error: genericDenial };

  const removed = await context.supabase.from("campus_achievements").delete().eq("id", id).select("id");
  const gone = await finishDelete(removed, () =>
    context.supabase.from("campus_achievements").select("id").eq("id", id).maybeSingle(),
  );
  if (!gone.ok) return { error: gone.error };

  await writeAudit(context.supabase, context.actor.userId, "delete", "campus_achievements", id);
  revalidatePath("/achievements");
  revalidatePath("/manage/achievements");
  redirect(manageDestination(formData, "/manage/achievements"));
}

function revalidateCouncil(slug?: string) {
  revalidatePath("/");
  revalidatePath("/council");
  revalidatePath("/manage");
  revalidatePath("/manage/council");
  if (slug) revalidatePath(`/council/${slug}`);
}

async function replaceCouncilChildren(
  supabase: NonNullable<Awaited<ReturnType<typeof createStaffClient>>>,
  yearId: string,
  input: CouncilInput,
) {
  const removedMembers = await supabase.from("campus_council_members").delete().eq("year_id", yearId);
  if (removedMembers.error) {
    throw new Error(databaseError(removedMembers.error, "The council list could not be saved."));
  }
  if (input.members.length) {
    const inserted = await supabase.from("campus_council_members").insert(
      input.members.map((member, index) => ({
        year_id: yearId,
        role: member.role,
        name: member.name,
        image_url: member.imageUrl,
        image_alt: member.imageAlt,
        sort_order: index,
      })),
    );
    if (inserted.error) {
      throw new Error(databaseError(inserted.error, "The council list could not be saved."));
    }
  }

  const removedPhotos = await supabase.from("campus_council_photos").delete().eq("year_id", yearId);
  if (removedPhotos.error) {
    throw new Error(databaseError(removedPhotos.error, "The photographs could not be saved."));
  }
  if (input.photos.length) {
    const inserted = await supabase.from("campus_council_photos").insert(
      input.photos.map((photo, index) => ({
        year_id: yearId,
        url: photo.url,
        alt: photo.alt,
        caption: photo.caption,
        sort_order: index,
      })),
    );
    if (inserted.error) {
      throw new Error(databaseError(inserted.error, "The photographs could not be saved."));
    }
  }

  const removedPosts = await supabase.from("campus_council_posts").delete().eq("year_id", yearId);
  if (removedPosts.error) {
    throw new Error(databaseError(removedPosts.error, "The posts could not be saved."));
  }
  if (input.posts.length) {
    const inserted = await supabase.from("campus_council_posts").insert(
      input.posts.map((post, index) => ({
        year_id: yearId,
        title: post.title,
        body: post.body,
        published_on: post.publishedOn,
        image_url: post.imageUrl,
        image_alt: post.imageAlt,
        sort_order: index,
      })),
    );
    if (inserted.error) {
      throw new Error(databaseError(inserted.error, "The posts could not be saved."));
    }
  }
}

export async function saveCouncilYear(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = councilInputFromForm(formData);
  if (!parsed.success) return { error: issueMessage(parsed.error) };
  const intent = String(formData.get("intent") ?? "save");
  const id = String(formData.get("id") ?? "");

  if ((await contentMode()) === "file") {
    const access = await fileActor((actor) => can(actor, "manage_council"));
    if ("error" in access) return access;
    const saved = saveCouncilToStore(access.actor, parsed.data, intent, id);
    if ("error" in saved) return { error: saved.error };
    revalidateCouncil(saved.slug);
    if (!id) redirect(`/manage/council/${saved.id}/edit`);
    return { ok: saved.status === "published" ? "Published." : "Saved." };
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "manage_council")) return { error: genericDenial };

  const councilProbe = await context.supabase.from("campus_council_years").select("id").limit(1);
  if (councilProbe.error && isMissingTableError(councilProbe.error)) {
    return { error: missingCouncilTablesMessage() };
  }

  const settings = await context.supabase.from("campus_settings").select("media_hosts").eq("id", true).maybeSingle();
  const allowedHosts = Array.isArray(settings.data?.media_hosts) ? settings.data.media_hosts.map(String) : [];
  const mediaError = validateCouncilMedia(parsed.data, allowedHosts);
  if (mediaError) return { error: mediaError };

  let status: PublicationStatus = "draft";
  let publishedAt: string | null = null;
  if (id) {
    const existing = await context.supabase
      .from("campus_council_years")
      .select("publication_status, published_at")
      .eq("id", id)
      .maybeSingle();
    if (existing.error) {
      return { error: databaseError(existing.error, "That council year could not be found.") };
    }
    if (!existing.data) return { error: "That council year could not be found." };
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
  } else if (intent !== "save") {
    return { error: "Save the draft before changing its status." };
  }

  const record = {
    label: parsed.data.label,
    slug: parsed.data.slug,
    kind: parsed.data.kind,
    summary: parsed.data.summary,
    sort_order: parsed.data.sortOrder,
    publication_status: status,
    published_at: publishedAt,
    is_sample: false,
  };

  const saved = id
    ? await context.supabase.from("campus_council_years").update(record).eq("id", id).select("id").maybeSingle()
    : await context.supabase.from("campus_council_years").insert(record).select("id").maybeSingle();
  if (saved.error) {
    return { error: databaseError(saved.error, "The council year could not be saved.") };
  }

  let yearId = saved.data?.id ?? null;
  if (!yearId) {
    const lookup = id
      ? await context.supabase.from("campus_council_years").select("id").eq("id", id).maybeSingle()
      : await context.supabase
          .from("campus_council_years")
          .select("id")
          .eq("slug", parsed.data.slug)
          .maybeSingle();
    if (lookup.error) {
      return { error: databaseError(lookup.error, "The council year could not be saved.") };
    }
    yearId = lookup.data?.id ?? null;
  }
  if (!yearId) return { error: writeDenied };

  try {
    await replaceCouncilChildren(context.supabase, yearId, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The council year could not be saved." };
  }

  if (intent !== "save") {
    await writeAudit(context.supabase, context.actor.userId, intent, "campus_council_years", yearId);
  }

  revalidateCouncil(parsed.data.slug);
  if (!id) redirect(`/manage/council/${yearId}/edit`);
  return { ok: status === "published" ? "Published." : "Saved." };
}

export async function deleteCouncilYear(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("confirm") !== "yes") return { error: "Confirm the delete, then try again." };

  if ((await contentMode()) === "file") {
    const access = await fileActor(() => true);
    if ("error" in access) return access;
    if (!deleteFromStore(access.actor, "council", String(formData.get("id") ?? ""))) return { error: deleteFailed };
    revalidateCouncil();
    redirect("/manage/council");
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };

  const id = String(formData.get("id") ?? "");
  const existing = await context.supabase
    .from("campus_council_years")
    .select("publication_status, slug")
    .eq("id", id)
    .maybeSingle();
  if (existing.error) return { error: databaseError(existing.error, deleteFailed) };
  if (!existing.data) return { error: deleteFailed };
  const status = existing.data.publication_status as PublicationStatus;
  if (!canDelete(context.actor, status)) return { error: genericDenial };

  const removed = await context.supabase.from("campus_council_years").delete().eq("id", id).select("id");
  const gone = await finishDelete(removed, () =>
    context.supabase.from("campus_council_years").select("id").eq("id", id).maybeSingle(),
  );
  if (!gone.ok) return { error: gone.error };

  await writeAudit(context.supabase, context.actor.userId, "delete", "campus_council_years", id);
  revalidateCouncil(String(existing.data.slug));
  redirect("/manage/council");
}

export async function saveNewsletter(_state: ActionState, formData: FormData): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const imageRaw = String(formData.get("imageUrl") ?? "").trim();
  const hrefRaw = String(formData.get("href") ?? "").trim();
  const published = formData.get("published") === "on";

  if (title.length < 2 || title.length > 80) return { error: "Enter a title." };
  if (!imageRaw) return { error: "Enter an image URL." };
  const href = classifyNavigationUrl(hrefRaw);
  if (!href.ok) return { error: href.message };

  if ((await contentMode()) === "file") {
    const access = await fileActor(() => true);
    if ("error" in access) return access;
    const image = classifyNavigationUrl(imageRaw);
    if (!image.ok) return { error: image.message };
    if (!saveNewsletterToStore({ title, imageUrl: image.url, href: href.url, published })) {
      return { error: "The newsletter could not be saved." };
    }
    revalidatePath("/");
    revalidatePath("/newsletter");
    revalidatePath("/manage/newsletter");
    return { ok: "Newsletter saved." };
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "create_draft")) return { error: genericDenial };

  const hostsRow = await context.supabase.from("campus_settings").select("media_hosts").eq("id", true).maybeSingle();
  const hosts = Array.isArray(hostsRow.data?.media_hosts) ? hostsRow.data.media_hosts.map(String) : [];
  const image = classifyMediaUrl(imageRaw, hosts);
  if (!image.ok) return { error: image.message };

  const saved = await context.supabase
    .from("campus_settings")
    .update({
      newsletter_title: title,
      newsletter_image_url: image.url,
      newsletter_href: href.url,
      newsletter_published: published,
    })
    .eq("id", true);
  if (saved.error) {
    const missing = (saved.error.message ?? "").toLowerCase().includes("newsletter_");
    return {
      error: missing
        ? "Run supabase/NEWSLETTER.sql in the database, then save again."
        : databaseError(saved.error, "The newsletter could not be saved."),
    };
  }

  await writeAudit(context.supabase, context.actor.userId, "update_newsletter", "campus_settings", null);
  revalidatePath("/");
  revalidatePath("/newsletter");
  revalidatePath("/manage/newsletter");
  return { ok: "Newsletter saved." };
}
