"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { can, canDelete, canEditPublication, canTransition } from "@/lib/auth/permissions";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { getCampusActor, getCampusSession, sessionActionError } from "@/lib/auth/session";
import { arigoSyncAction, toArigoCampusEvent } from "@/lib/arigo/event-payload";
import { removeCampusEventFromArigo, syncCampusEvent } from "@/lib/arigo/sync-event";
import { defaultSocialLinks, isSupabaseConfigured, normalizeContactEmail } from "@/lib/config";
import { councilMemberSlugs } from "@/lib/data/catalog";
import { contentMode } from "@/lib/data/content-mode";
import {
  deleteFromStore,
  saveAchievementToStore,
  saveCategoryToStore,
  saveCouncilToStore,
  rememberEventRegistrationUrl,
  saveEventToStore,
  saveNewsletterToStore,
  saveSocialToStore,
} from "@/lib/data/file-content";
import { expandMapUrl } from "@/lib/media/map";
import { googleFormUrl } from "@/lib/registration";
import { classifyMediaUrl, classifyNavigationUrl, parseMediaHostList } from "@/lib/media/url";
import { parseSocialInput } from "@/lib/social";
import { isMissingTableError, missingCouncilTablesMessage } from "@/lib/supabase/errors";
import { createStaffClient } from "@/lib/supabase/server";
import {
  achievementInputSchema,
  categoryInputSchema,
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
    if (
      combined.includes("registration_limit") ||
      combined.includes("registration_count") ||
      combined.includes("overflow_registration")
    ) {
      return "Registration limits are not in the database yet. Run supabase/REGISTRATION_LIMIT.sql in the Supabase SQL editor, then save again.";
    }
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

function registrationUrlForSave(input: EventInput) {
  if (!input.registrationEnabled) return null;
  const provider = input.registrationProvider ?? "arigo";
  if (!input.registrationUrl) return null;
  if (provider === "page" && input.registrationUrl.startsWith("/")) return input.registrationUrl;
  return httpsOrNull(input.registrationUrl);
}

function eventRecord(input: EventInput, status: PublicationStatus, featured: boolean) {
  return {
    title: input.title,
    slug: input.slug,
    short_description: input.shortDescription,
    full_description: input.fullDescription,
    category_id: input.categoryId,
    listing: input.listing ?? "event",
    cover_image_url: input.coverImageUrl,
    cover_alt: input.coverAlt,
    cover_attribution: input.coverAttribution,
    event_date: input.eventDate,
    end_date: input.endDate,
    start_time: input.startTime,
    end_time: input.endTime,
    location_name: input.locationName,
    location_map_url: httpsOrNull(input.locationMapUrl),
    host_name: input.hostName,
    grade_from: input.gradeFrom,
    grade_to: input.gradeTo,
    fee_aed: input.feeAed,
    capacity: input.capacity,
    packing_list: input.packingList,
    event_status: input.eventStatus,
    featured,
    registration_enabled: input.registrationEnabled,
    push_to_arigo: Boolean(input.pushToArigo),
    registration_provider: input.registrationEnabled ? (input.registrationProvider ?? "arigo") : null,
    registration_url: registrationUrlForSave(input),
    registration_label: input.registrationLabel,
    registration_deadline: input.registrationDeadline,
    registration_limit: input.registrationLimit,
    registration_count: input.registrationCount,
    overflow_registration_url: googleFormUrl(input.overflowRegistrationUrl),
    overflow_registration_label: input.overflowRegistrationLabel,
    registration_instructions: input.registrationInstructions,
    instagram_url: httpsOrNull(input.instagramUrl),
    purpose: input.purpose,
    activities: input.activities,
    video_url: httpsOrNull(input.videoUrl),
    schedule: input.schedule,
    groups: input.groups,
    resources: input.resources,
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
      pinned: Boolean(image.pinned),
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
      const missingPinned = (inserted.error.message ?? "").toLowerCase().includes("pinned");
      if (missingPinned) {
        const withoutPinned = await supabase.from("campus_event_images").insert(
          images.map(({ pinned: _pinned, ...image }) => image),
        );
        if (!withoutPinned.error) {
          throw new Error("Run supabase/GALLERY_PINNED.sql in the database, then save again to pin photographs.");
        }
      }
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

  const removedCategories = await supabase.from("campus_event_categories").delete().eq("event_id", eventId);
  if (removedCategories.error && !isMissingTableError(removedCategories.error)) {
    throw new Error(databaseError(removedCategories.error, "Categories could not be saved."));
  }
  if (!removedCategories.error) {
    const categoryIds = [...new Set([input.categoryId, ...(input.categoryIds ?? [])])];
    const categoryRows = categoryIds.map((categoryId) => ({ event_id: eventId, category_id: categoryId }));
    if (categoryRows.length) {
      const inserted = await supabase.from("campus_event_categories").insert(categoryRows);
      if (inserted.error) {
        throw new Error(databaseError(inserted.error, "Categories could not be saved."));
      }
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
  const resources = readList(formData, "resources");
  if (!images || !schedule || !groups || !resources) return { error: "A list field could not be read." };

  const parsed = eventInputSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    shortDescription: formData.get("shortDescription"),
    fullDescription: formData.get("fullDescription"),
    categoryId: formData.get("categoryId"),
    categoryIds: formData.getAll("categoryIds").map(String).filter(Boolean),
    listing: formData.get("listing") || "event",
    coverImageUrl: formData.get("coverImageUrl"),
    coverAlt: formData.get("coverAlt"),
    coverAttribution: formData.get("coverAttribution"),
    eventDate: formData.get("eventDate"),
    endDate: formData.get("endDate"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    locationName: formData.get("locationName"),
    locationMapUrl: formData.get("locationMapUrl"),
    hostName: formData.get("hostName"),
    gradeFrom: formData.get("gradeFrom"),
    gradeTo: formData.get("gradeTo"),
    feeAed: formData.get("feeAed"),
    capacity: formData.get("capacity"),
    packingList: formData.get("packingList"),
    eventStatus: formData.get("eventStatus"),
    featured: formData.get("featured") === "on",
    registrationEnabled: formData.get("registrationEnabled") === "on",
    pushToArigo: formData.get("pushToArigo") === "on",
    registrationProvider: formData.get("registrationProvider"),
    registrationUrl: formData.get("registrationUrl"),
    registrationLabel: formData.get("registrationLabel"),
    registrationDeadline: formData.get("registrationDeadline"),
    registrationLimit: formData.get("registrationLimit"),
    registrationCount: formData.get("registrationCount"),
    overflowRegistrationUrl: formData.get("overflowRegistrationUrl"),
    overflowRegistrationLabel: formData.get("overflowRegistrationLabel"),
    registrationInstructions: formData.get("registrationInstructions"),
    instagramUrl: formData.get("instagramUrl"),
    purpose: formData.get("purpose"),
    activities: formData.get("activities"),
    videoUrl: formData.get("videoUrl"),
    schedule,
    groups,
    resources,
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
    parsed.input.locationMapUrl = await expandMapUrl(parsed.input.locationMapUrl);
    const saved = saveEventToStore(
      session.actor,
      parsed.input,
      String(formData.get("intent") ?? "save"),
      String(formData.get("id") ?? ""),
    );
    if ("error" in saved && saved.error) return { error: saved.error };
    if (!("id" in saved) || !saved.id || !saved.status) {
      return { error: "The event could not be saved." };
    }
    const savedId = saved.id;
    const savedStatus = saved.status;
    const intentName = String(formData.get("intent") ?? "save");
    const arigoEvent = toArigoCampusEvent(savedId, savedStatus, parsed.input);
    const syncKind = arigoSyncAction(arigoEvent, intentName, {
      wasPushedToArigo: Boolean(saved.wasPushedToArigo),
    });
    let syncError: string | null = null;
    if (syncKind === "upsert") {
      syncError = await syncCampusEvent(arigoEvent, async (url) =>
        rememberEventRegistrationUrl(savedId, url),
      );
    } else if (syncKind === "remove") {
      const removed = await removeCampusEventFromArigo(savedId);
      if (!removed.ok) syncError = removed.error;
    }
    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath(`/events/${saved.slug}`);
    revalidatePath("/gallery");
    revalidatePath("/manage");
    revalidatePath("/manage/events");
    if (syncError) return { error: syncError };
    if (!formData.get("id")) redirect(`/manage/events/${savedId}/edit`);
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
  parsed.input.locationMapUrl = await expandMapUrl(parsed.input.locationMapUrl);
  const mediaErrors = validateEventMedia(parsed.input, allowedHosts);
  const firstMediaError = Object.values(mediaErrors)[0];
  if (firstMediaError) return { error: firstMediaError };

  const intent = String(formData.get("intent") ?? "save");
  const id = String(formData.get("id") ?? "");
  let status: PublicationStatus = "draft";
  let featured = context.actor.role === "administrator" ? parsed.input.featured : false;
  let publishedAt: string | null = null;

  let wasPushedToArigo = false;
  if (id) {
    const existing = await context.supabase
      .from("campus_events")
      .select("publication_status, featured, published_at, push_to_arigo")
      .eq("id", id)
      .maybeSingle();
    if (existing.error || !existing.data) return { error: "That event could not be found." };
    const current = existing.data.publication_status as PublicationStatus;
    if (!canEditPublication(context.actor, current) && intent === "save") {
      return { error: genericDenial };
    }
    featured = context.actor.role === "administrator" ? parsed.input.featured : Boolean(existing.data.featured);
    publishedAt = existing.data.published_at ? String(existing.data.published_at) : null;
    wasPushedToArigo = Boolean(
      (existing.data as { push_to_arigo?: boolean | null }).push_to_arigo,
    );
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

  const writeEvent = (payload: Record<string, unknown>) =>
    id
      ? context.supabase.from("campus_events").update(payload).eq("id", id).select("id").maybeSingle()
      : context.supabase
          .from("campus_events")
          .insert({ ...payload, created_by: context.actor.userId, is_sample: false })
          .select("id")
          .maybeSingle();

  let saved = await writeEvent(record);
  const firstMessage = (saved.error?.message ?? "").toLowerCase();
  if (saved.error && firstMessage.includes("push_to_arigo")) {
    if (parsed.input.pushToArigo) {
      return { error: "Run supabase/PUSH_TO_ARIGO.sql in the database, then save again." };
    }
    const { push_to_arigo: omittedPush, ...withoutPush } = record;
    void omittedPush;
    saved = await writeEvent(withoutPush);
  }
  const afterPushMessage = (saved.error?.message ?? "").toLowerCase();
  const needsExternalSql =
    afterPushMessage.includes("host_name") || afterPushMessage.includes("campus_event_listing");
  if (saved.error && needsExternalSql) {
    if (parsed.input.listing === "external" || parsed.input.hostName) {
      return { error: "Run supabase/EXTERNAL_COMPETITIONS.sql in the database, then save again." };
    }
    const { host_name: omittedHost, ...withoutHost } = record;
    void omittedHost;
    saved = await writeEvent(withoutHost);
  }

  if (saved.error) {
    const missing = (saved.error.message ?? "").toLowerCase().includes("resources");
    return {
      error: missing
        ? "Run supabase/RESOURCES_AND_NEWSLETTER_PDF.sql in the database, then save again."
        : databaseError(saved.error, "The event could not be saved."),
    };
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

  const arigoEvent = toArigoCampusEvent(eventId, status, parsed.input);
  const syncKind = arigoSyncAction(arigoEvent, intent, { wasPushedToArigo });
  let syncError: string | null = null;
  if (syncKind === "upsert") {
    syncError = await syncCampusEvent(arigoEvent, async (url) => {
      const updated = await context.supabase
        .from("campus_events")
        .update({ registration_url: url })
        .eq("id", eventId);
      return !updated.error;
    });
  } else if (syncKind === "remove") {
    const removed = await removeCampusEventFromArigo(eventId);
    if (!removed.ok) syncError = removed.error;
    else {
      await context.supabase
        .from("campus_events")
        .update({ registration_url: null })
        .eq("id", eventId)
        .like("registration_url", "%/hosted/register/%");
    }
  }

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/competitions");
  revalidatePath(`/events/${parsed.input.slug}`);
  revalidatePath("/gallery");
  revalidatePath("/manage");
  revalidatePath("/manage/events");

  if (syncError) return { error: syncError };
  if (!id) redirect(`/manage/events/${eventId}/edit`);
  return { ok: status === "published" ? "Published." : "Saved." };
}

function readAchievementInput(formData: FormData) {
  const resources = readList(formData, "resources");
  if (!resources) return { error: "A list field could not be read." };
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
    resources,
  });
  if (!parsed.success) return { error: issueMessage(parsed.error) };
  return { input: parsed.data };
}

export async function saveAchievement(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = readAchievementInput(formData);
  if ("error" in parsed) return { error: parsed.error };

  if ((await contentMode()) === "file") {
    const access = await fileActor((actor) => can(actor, "manage_achievements"));
    if ("error" in access) return access;
    const saved = saveAchievementToStore(
      access.actor,
      parsed.input,
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

  const input: AchievementInput = parsed.input;
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
    resources: input.resources,
    publication_status: status,
    published_at: publishedAt,
    is_sample: false,
  };

  const saved = id
    ? await context.supabase.from("campus_achievements").update(record).eq("id", id)
    : await context.supabase.from("campus_achievements").insert(record);
  if (saved.error) {
    const missing = (saved.error.message ?? "").toLowerCase().includes("resources");
    return {
      error: missing
        ? "Run supabase/RESOURCES_AND_NEWSLETTER_PDF.sql in the database, then save again."
        : databaseError(saved.error, "The achievement could not be saved."),
    };
  }

  revalidatePath("/achievements");
  revalidatePath("/manage/achievements");
  return { ok: "Saved." };
}

export async function saveCategory(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = categoryInputSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    sortOrder: formData.get("sortOrder") || 0,
    imageUrl: formData.get("imageUrl"),
    pdfUrl: formData.get("pdfUrl"),
  });
  if (!parsed.success) return { error: issueMessage(parsed.error) };

  const id = String(formData.get("id") ?? "").trim();
  const imageRaw = parsed.data.imageUrl;
  const pdfRaw = parsed.data.pdfUrl;
  if (pdfRaw) {
    const pdf = classifyNavigationUrl(pdfRaw);
    if (!pdf.ok) return { error: "Category PDF must be a valid https:// link." };
    parsed.data.pdfUrl = pdf.url;
  }

  if ((await contentMode()) === "file") {
    const access = await fileActor((actor) => can(actor, "manage_categories"));
    if ("error" in access) return access;
    if (imageRaw) {
      const image = classifyNavigationUrl(imageRaw);
      if (!image.ok) return { error: image.message };
      parsed.data.imageUrl = image.url;
    }
    if (
      !saveCategoryToStore({
        id: id || undefined,
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        sortOrder: parsed.data.sortOrder,
        imageUrl: parsed.data.imageUrl,
        pdfUrl: parsed.data.pdfUrl,
      })
    ) {
      return { error: "The category could not be saved." };
    }
    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath("/achievements");
    revalidatePath("/manage/categories");
    revalidatePath("/manage/events");
    return { ok: id ? "Category saved." : "Category added." };
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "manage_categories")) return { error: genericDenial };

  const hostsRow = await context.supabase.from("campus_settings").select("media_hosts").eq("id", true).maybeSingle();
  const hosts = Array.isArray(hostsRow.data?.media_hosts) ? hostsRow.data.media_hosts.map(String) : [];
  if (imageRaw) {
    const image = classifyMediaUrl(imageRaw, hosts);
    if (!image.ok) return { error: image.message };
    parsed.data.imageUrl = image.url;
  }

  const record = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description,
    sort_order: parsed.data.sortOrder,
    image_url: parsed.data.imageUrl,
    pdf_url: parsed.data.pdfUrl,
  };

  const saved = id
    ? await context.supabase.from("campus_categories").update(record).eq("id", id)
    : await context.supabase.from("campus_categories").insert(record);
  if (saved.error) {
    const missing = (saved.error.message ?? "").toLowerCase().includes("image_url")
      || (saved.error.message ?? "").toLowerCase().includes("pdf_url");
    return {
      error: missing
        ? "Run supabase/RESOURCES_AND_NEWSLETTER_PDF.sql in the database, then save again."
        : databaseError(saved.error, "The category could not be saved."),
    };
  }
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/achievements");
  revalidatePath("/manage/categories");
  revalidatePath("/manage/events");
  return { ok: id ? "Category saved." : "Category added." };
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
    const eventId = String(formData.get("id") ?? "");
    const removedFromArigo = await removeCampusEventFromArigo(eventId);
    if (!removedFromArigo.ok) return { error: removedFromArigo.error };
    if (!deleteFromStore(access.actor, "events", eventId)) return { error: deleteFailed };
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

  const removedFromArigo = await removeCampusEventFromArigo(id);
  if (!removedFromArigo.ok) return { error: removedFromArigo.error };

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

function revalidateCouncil(slug?: string, memberSlugs: string[] = []) {
  revalidatePath("/");
  revalidatePath("/council");
  revalidatePath("/sitemap.xml");
  revalidatePath("/manage");
  revalidatePath("/manage/council");
  if (!slug) return;
  for (const memberSlug of memberSlugs) {
    revalidatePath(`/council/${slug}/${memberSlug}`);
  }
}

function missingMemberProfileColumn(message: string) {
  const text = message.toLowerCase();
  return (
    /could not find the '(about|work|slug)' column/.test(text) ||
    (/column/.test(text) && /(about|work|slug)/.test(text) && /does not exist/.test(text))
  );
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
    const slugs = councilMemberSlugs(input.members);
    const rows = input.members.map((member, index) => ({
      year_id: yearId,
      role: member.role,
      name: member.name,
      image_url: member.imageUrl,
      image_alt: member.imageAlt,
      quote: member.quote,
      about: member.about,
      work: member.work,
      slug: slugs[index],
      board: member.board === "junior" ? "junior" : "main",
      sort_order: index,
    }));
    const inserted = await supabase.from("campus_council_members").insert(rows);
    if (inserted.error && missingMemberProfileColumn(inserted.error.message ?? "")) {
      const fallback = await supabase.from("campus_council_members").insert(
        rows.map((member) => ({
          year_id: member.year_id,
          role: member.role,
          name: member.name,
          image_url: member.image_url,
          image_alt: member.image_alt,
          quote: member.quote,
          board: member.board,
          sort_order: member.sort_order,
        })),
      );
      if (fallback.error) {
        const missingQuote = (fallback.error.message ?? "").toLowerCase().includes("quote");
        throw new Error(
          missingQuote
            ? "Run supabase/QUOTES_AND_SOCIAL.sql in the database, then save again."
            : databaseError(fallback.error, "The council list could not be saved."),
        );
      }
      throw new Error("Run supabase/MEMBER_PROFILES.sql in the database, then save again.");
    }
    if (inserted.error) {
      const message = (inserted.error.message ?? "").toLowerCase();
      if (message.includes("board")) {
        const withoutBoard = await supabase.from("campus_council_members").insert(
          rows.map(({ board: _board, ...member }) => member),
        );
        if (!withoutBoard.error) {
          throw new Error("Run supabase/JUNIOR_COUNCIL_AND_ACTIVITIES.sql in the database, then save again.");
        }
      }
      const missingQuote = message.includes("quote");
      throw new Error(
        missingQuote
          ? "Run supabase/QUOTES_AND_SOCIAL.sql in the database, then save again."
          : databaseError(inserted.error, "The council list could not be saved."),
      );
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
    revalidateCouncil(saved.slug, councilMemberSlugs(parsed.data.members));
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
    junior_heading: parsed.data.juniorHeading?.trim() || "Junior Student Council",
    sort_order: parsed.data.sortOrder,
    publication_status: status,
    published_at: publishedAt,
    is_sample: false,
  };

  let saved = id
    ? await context.supabase.from("campus_council_years").update(record).eq("id", id).select("id").maybeSingle()
    : await context.supabase.from("campus_council_years").insert(record).select("id").maybeSingle();
  if (saved.error && (saved.error.message ?? "").toLowerCase().includes("junior_heading")) {
    const { junior_heading: _juniorHeading, ...withoutHeading } = record;
    saved = id
      ? await context.supabase.from("campus_council_years").update(withoutHeading).eq("id", id).select("id").maybeSingle()
      : await context.supabase.from("campus_council_years").insert(withoutHeading).select("id").maybeSingle();
    if (!saved.error) {
      return {
        error: "Run supabase/JUNIOR_COUNCIL_AND_ACTIVITIES.sql in the database, then save again to store the junior heading.",
      };
    }
  }
  if (saved.error) {
    const missingBoard = (saved.error.message ?? "").toLowerCase().includes("board");
    return {
      error: missingBoard
        ? "Run supabase/JUNIOR_COUNCIL_AND_ACTIVITIES.sql in the database, then save again."
        : databaseError(saved.error, "The council year could not be saved."),
    };
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

  revalidateCouncil(parsed.data.slug, councilMemberSlugs(parsed.data.members));
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
  const pdfRaw = String(formData.get("pdfUrl") ?? "").trim();
  const published = formData.get("published") === "on";

  if (title.length < 2 || title.length > 80) return { error: "Enter a title." };

  let href: string | null = null;
  if (hrefRaw) {
    const classified = classifyNavigationUrl(hrefRaw);
    if (!classified.ok) return { error: classified.message };
    href = classified.url;
  }

  let pdfUrl: string | null = null;
  if (pdfRaw) {
    const classified = classifyNavigationUrl(pdfRaw);
    if (!classified.ok) return { error: "PDF must be a valid https:// link." };
    pdfUrl = classified.url;
  }

  if (published && !href && !pdfUrl) {
    return { error: "Add a PDF or a link before publishing." };
  }

  if ((await contentMode()) === "file") {
    const access = await fileActor(() => true);
    if ("error" in access) return access;
    let imageUrl: string | null = null;
    if (imageRaw) {
      const image = classifyNavigationUrl(imageRaw);
      if (!image.ok) return { error: image.message };
      imageUrl = image.url;
    }
    if (!saveNewsletterToStore({ title, imageUrl, href, pdfUrl, published })) {
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
  let imageUrl: string | null = null;
  if (imageRaw) {
    const image = classifyMediaUrl(imageRaw, hosts);
    if (!image.ok) return { error: image.message };
    imageUrl = image.url;
  }

  const saved = await context.supabase
    .from("campus_settings")
    .update({
      newsletter_title: title,
      newsletter_image_url: imageUrl,
      newsletter_href: href,
      newsletter_pdf_url: pdfUrl,
      newsletter_published: published,
    })
    .eq("id", true);
  if (saved.error) {
    const message = (saved.error.message ?? "").toLowerCase();
    const missing = message.includes("newsletter_");
    if (missing) {
      const pdfOnly = await context.supabase
        .from("campus_settings")
        .update({ newsletter_pdf_url: pdfUrl })
        .eq("id", true);
      if (!pdfOnly.error && !title && !imageUrl && !href && !published) {
        await writeAudit(context.supabase, context.actor.userId, "update_newsletter", "campus_settings", null);
        revalidatePath("/");
        revalidatePath("/newsletter");
        revalidatePath("/manage/newsletter");
        return { ok: "Newsletter PDF saved." };
      }
    }
    return {
      error: missing
        ? "Run supabase/SYNC_LIVE.sql in the database, then save again."
        : databaseError(saved.error, "The newsletter could not be saved."),
    };
  }

  await writeAudit(context.supabase, context.actor.userId, "update_newsletter", "campus_settings", null);
  revalidatePath("/");
  revalidatePath("/newsletter");
  revalidatePath("/manage/newsletter");
  return { ok: "Newsletter saved." };
}

export async function saveSocial(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseSocialInput(formData);
  if ("error" in parsed) return { error: parsed.error };
  const links = parsed.links;

  if ((await contentMode()) === "file") {
    const access = await fileActor(() => true);
    if ("error" in access) return access;
    if (!saveSocialToStore(links)) return { error: "The links could not be saved." };
    revalidatePath("/", "layout");
    revalidatePath("/about");
    revalidatePath("/council");
    revalidatePath("/manage/settings");
    return { ok: "Links saved." };
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "manage_settings")) return { error: genericDenial };

  const saved = await context.supabase
    .from("campus_settings")
    .update({
      site_links: links,
      instagram_url: links.instagramUrl,
      scixcom_instagram_url: links.scixcomInstagramUrl,
    })
    .eq("id", true);
  if (saved.error) {
    const message = (saved.error.message ?? "").toLowerCase();
    if (message.includes("site_links")) {
      const urls = await context.supabase
        .from("campus_settings")
        .update({
          instagram_url: links.instagramUrl,
          scixcom_instagram_url: links.scixcomInstagramUrl,
        })
        .eq("id", true);
      if (urls.error) return { error: databaseError(urls.error, "The links could not be saved.") };
      const extras =
        links.schoolLabel !== defaultSocialLinks.schoolLabel ||
        links.schoolUrl.replace(/\/$/, "") !== defaultSocialLinks.schoolUrl.replace(/\/$/, "") ||
        links.instagramLabel !== defaultSocialLinks.instagramLabel ||
        links.scixcomLabel !== defaultSocialLinks.scixcomLabel ||
        links.extraLinks.length > 0;
      if (extras) {
        return { error: "The Instagram addresses were saved. Run supabase/SYNC_LIVE.sql to save labels, the school website, and extra links." };
      }
    } else {
      return { error: databaseError(saved.error, "The links could not be saved.") };
    }
  }

  await writeAudit(context.supabase, context.actor.userId, "update_social", "campus_settings", null);
  revalidatePath("/", "layout");
  revalidatePath("/about");
  revalidatePath("/council");
  revalidatePath("/manage/settings");
  return { ok: "Links saved." };
}

export async function saveCouncilLogo(_state: ActionState, formData: FormData): Promise<ActionState> {
  const raw = String(formData.get("councilLogoUrl") ?? "").trim();
  let councilLogoUrl: string | null = null;
  if (raw) {
    const classified = classifyNavigationUrl(raw);
    if (!classified.ok) return { error: "Council logo must be a valid https:// image link." };
    councilLogoUrl = classified.url;
  }

  if ((await contentMode()) === "file") {
    const access = await fileActor(() => true);
    if ("error" in access) return access;
    const { saveCouncilLogoToStore } = await import("@/lib/data/file-content");
    if (!saveCouncilLogoToStore(councilLogoUrl)) return { error: "The logo could not be saved." };
    revalidatePath("/", "layout");
    revalidatePath("/council");
    revalidatePath("/manage/settings");
    return { ok: "Council logo saved." };
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "manage_settings")) return { error: genericDenial };

  if (councilLogoUrl) {
    const hostsRow = await context.supabase.from("campus_settings").select("media_hosts").eq("id", true).maybeSingle();
    const hosts = Array.isArray(hostsRow.data?.media_hosts) ? hostsRow.data.media_hosts.map(String) : [];
    const image = classifyMediaUrl(councilLogoUrl, hosts);
    if (!image.ok) return { error: image.message };
    councilLogoUrl = image.url;
  }

  const saved = await context.supabase
    .from("campus_settings")
    .update({ council_logo_url: councilLogoUrl })
    .eq("id", true);
  if (saved.error) {
    const missing = (saved.error.message ?? "").toLowerCase().includes("council_logo");
    return {
      error: missing
        ? "Run supabase/JUNIOR_COUNCIL_AND_ACTIVITIES.sql in the database, then save again."
        : databaseError(saved.error, "The logo could not be saved."),
    };
  }

  await writeAudit(context.supabase, context.actor.userId, "update_council_logo", "campus_settings", null);
  revalidatePath("/", "layout");
  revalidatePath("/council");
  revalidatePath("/manage/settings");
  return { ok: "Council logo saved." };
}

export async function saveContactEmail(_state: ActionState, formData: FormData): Promise<ActionState> {
  const raw = String(formData.get("contactEmail") ?? "").trim();
  let contactEmail: string | null = null;
  if (raw) {
    contactEmail = normalizeContactEmail(raw);
    if (!contactEmail) return { error: "Enter a valid email address." };
  }

  if ((await contentMode()) === "file") {
    const access = await fileActor(() => true);
    if ("error" in access) return access;
    const { saveContactEmailToStore } = await import("@/lib/data/file-content");
    if (!saveContactEmailToStore(contactEmail)) return { error: "The contact email could not be saved." };
    revalidatePath("/", "layout");
    revalidatePath("/about");
    revalidatePath("/manage/settings");
    return { ok: "Contact email saved." };
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "manage_settings")) return { error: genericDenial };

  const saved = await context.supabase
    .from("campus_settings")
    .update({ contact_email: contactEmail })
    .eq("id", true);
  if (saved.error) {
    const missing = (saved.error.message ?? "").toLowerCase().includes("contact_email");
    return {
      error: missing
        ? "Run supabase/CONTACT_EMAIL.sql in the database, then save again."
        : databaseError(saved.error, "The contact email could not be saved."),
    };
  }

  await writeAudit(context.supabase, context.actor.userId, "update_contact_email", "campus_settings", null);
  revalidatePath("/", "layout");
  revalidatePath("/about");
  revalidatePath("/manage/settings");
  return { ok: "Contact email saved." };
}

export async function saveAnnouncement(_state: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const eventIdRaw = String(formData.get("eventId") ?? "").trim();
  const enabled = formData.get("enabled") === "on";
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  if (message.length < 2 || message.length > 500) return { error: "Enter a message between 2 and 500 characters." };
  const eventId = /^[0-9a-f-]{36}$/i.test(eventIdRaw) ? eventIdRaw : null;

  if ((await contentMode()) === "file") {
    const access = await fileActor((actor) => can(actor, "manage_settings"));
    if ("error" in access) return access;
    const { saveAnnouncementToStore } = await import("@/lib/data/file-content");
    if (!saveAnnouncementToStore({ id: id || undefined, message, eventId, enabled, sortOrder })) {
      return { error: "The announcement could not be saved." };
    }
    revalidatePath("/");
    revalidatePath("/manage/announcements");
    return { ok: "Announcement saved." };
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "manage_settings")) return { error: genericDenial };

  const record = {
    message,
    event_id: eventId,
    enabled,
    sort_order: sortOrder,
  };
  const saved = id
    ? await context.supabase.from("campus_announcements").update(record).eq("id", id).select("id").maybeSingle()
    : await context.supabase.from("campus_announcements").insert(record).select("id").maybeSingle();
  if (saved.error) {
    const missing = isMissingTableError(saved.error) || (saved.error.message ?? "").toLowerCase().includes("announcement");
    return {
      error: missing
        ? "Run supabase/JUNIOR_COUNCIL_AND_ACTIVITIES.sql in the database, then save again."
        : databaseError(saved.error, "The announcement could not be saved."),
    };
  }

  await writeAudit(context.supabase, context.actor.userId, id ? "update" : "create", "campus_announcements", saved.data?.id ?? null);
  revalidatePath("/");
  revalidatePath("/manage/announcements");
  return { ok: "Announcement saved." };
}

export async function deleteAnnouncement(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("confirm") !== "yes") return { error: "Confirm the delete, then try again." };
  const id = String(formData.get("id") ?? "");

  if ((await contentMode()) === "file") {
    const access = await fileActor((actor) => can(actor, "manage_settings"));
    if ("error" in access) return access;
    const { deleteAnnouncementFromStore } = await import("@/lib/data/file-content");
    if (!deleteAnnouncementFromStore(id)) return { error: deleteFailed };
    revalidatePath("/");
    revalidatePath("/manage/announcements");
    return { ok: "Deleted." };
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "manage_settings")) return { error: genericDenial };

  const removed = await context.supabase.from("campus_announcements").delete().eq("id", id);
  if (removed.error) return { error: databaseError(removed.error, deleteFailed) };
  await writeAudit(context.supabase, context.actor.userId, "delete", "campus_announcements", id);
  revalidatePath("/");
  revalidatePath("/manage/announcements");
  return { ok: "Deleted." };
}

export async function saveFaq(_state: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  const published = formData.get("published") === "on";
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  if (question.length < 2 || question.length > 200) return { error: "Enter a question." };
  if (answer.length < 2 || answer.length > 4000) return { error: "Enter an answer." };

  if ((await contentMode()) === "file") {
    const access = await fileActor((actor) => can(actor, "manage_settings"));
    if ("error" in access) return access;
    const { saveFaqToStore } = await import("@/lib/data/file-content");
    if (!saveFaqToStore({ id: id || undefined, question, answer, published, sortOrder })) {
      return { error: "The FAQ could not be saved." };
    }
    revalidatePath("/about");
    revalidatePath("/manage/faq");
    return { ok: "FAQ saved." };
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "manage_settings")) return { error: genericDenial };

  const record = { question, answer, published, sort_order: sortOrder };
  const saved = id
    ? await context.supabase.from("campus_faqs").update(record).eq("id", id).select("id").maybeSingle()
    : await context.supabase.from("campus_faqs").insert(record).select("id").maybeSingle();
  if (saved.error) {
    const missing = isMissingTableError(saved.error) || (saved.error.message ?? "").toLowerCase().includes("faq");
    return {
      error: missing
        ? "Run supabase/JUNIOR_COUNCIL_AND_ACTIVITIES.sql in the database, then save again."
        : databaseError(saved.error, "The FAQ could not be saved."),
    };
  }

  await writeAudit(context.supabase, context.actor.userId, id ? "update" : "create", "campus_faqs", saved.data?.id ?? null);
  revalidatePath("/about");
  revalidatePath("/manage/faq");
  return { ok: "FAQ saved." };
}

export async function deleteFaq(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("confirm") !== "yes") return { error: "Confirm the delete, then try again." };
  const id = String(formData.get("id") ?? "");

  if ((await contentMode()) === "file") {
    const access = await fileActor((actor) => can(actor, "manage_settings"));
    if ("error" in access) return access;
    const { deleteFaqFromStore } = await import("@/lib/data/file-content");
    if (!deleteFaqFromStore(id)) return { error: deleteFailed };
    revalidatePath("/about");
    revalidatePath("/manage/faq");
    return { ok: "Deleted." };
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "manage_settings")) return { error: genericDenial };

  const removed = await context.supabase.from("campus_faqs").delete().eq("id", id);
  if (removed.error) return { error: databaseError(removed.error, deleteFailed) };
  await writeAudit(context.supabase, context.actor.userId, "delete", "campus_faqs", id);
  revalidatePath("/about");
  revalidatePath("/manage/faq");
  return { ok: "Deleted." };
}

const wellnessOrientations = new Set(["auto", "portrait", "landscape", "square"]);

function revalidateWellness() {
  revalidatePath("/", "layout");
  revalidatePath("/wellness");
  revalidatePath("/manage/wellness");
}

export async function saveWellnessPageSettings(_state: ActionState, formData: FormData): Promise<ActionState> {
  const pageTitle = String(formData.get("pageTitle") ?? "").trim();
  const navLabel = String(formData.get("navLabel") ?? "").trim();
  if (pageTitle.length < 2 || pageTitle.length > 80) return { error: "Enter a page title (2–80 characters)." };
  if (navLabel.length < 2 || navLabel.length > 40) return { error: "Enter a menu label (2–40 characters)." };

  if ((await contentMode()) === "file") {
    const access = await fileActor((actor) => can(actor, "manage_settings"));
    if ("error" in access) return access;
    const { saveWellnessPageToStore } = await import("@/lib/data/file-content");
    if (!saveWellnessPageToStore({ pageTitle, navLabel })) {
      return { error: "The page name could not be saved." };
    }
    revalidateWellness();
    return { ok: "Page name saved." };
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "manage_settings")) return { error: genericDenial };

  const saved = await context.supabase
    .from("campus_settings")
    .update({
      wellness_page_title: pageTitle,
      wellness_nav_label: navLabel,
    })
    .eq("id", true);
  if (saved.error) {
    const missing =
      isMissingTableError(saved.error) ||
      (saved.error.message ?? "").toLowerCase().includes("wellness_");
    return {
      error: missing
        ? "Run supabase/WELLNESS.sql in the database, then save again."
        : databaseError(saved.error, "The page name could not be saved."),
    };
  }

  await writeAudit(context.supabase, context.actor.userId, "update_wellness_page", "campus_settings", null);
  revalidateWellness();
  return { ok: "Page name saved." };
}

export async function saveWellnessCategory(_state: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  if (name.length < 2 || name.length > 80) return { error: "Enter a category name (2–80 characters)." };

  if ((await contentMode()) === "file") {
    const access = await fileActor((actor) => can(actor, "manage_settings"));
    if ("error" in access) return access;
    const { saveWellnessCategoryToStore } = await import("@/lib/data/file-content");
    if (!saveWellnessCategoryToStore({ id: id || undefined, name, sortOrder })) {
      return { error: "That category name is already in use, or it could not be saved." };
    }
    revalidateWellness();
    return { ok: id ? "Category saved." : "Category added." };
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "manage_settings")) return { error: genericDenial };

  const record = { name, sort_order: sortOrder };
  const saved = id
    ? await context.supabase.from("campus_wellness_categories").update(record).eq("id", id).select("id").maybeSingle()
    : await context.supabase.from("campus_wellness_categories").insert(record).select("id").maybeSingle();
  if (saved.error) {
    const missing =
      isMissingTableError(saved.error) ||
      (saved.error.message ?? "").toLowerCase().includes("wellness");
    return {
      error: missing
        ? "Run supabase/WELLNESS_CATEGORIES.sql in the database, then save again."
        : databaseError(saved.error, "The category could not be saved."),
    };
  }

  await writeAudit(
    context.supabase,
    context.actor.userId,
    id ? "update" : "create",
    "campus_wellness_categories",
    saved.data?.id ?? null,
  );
  revalidateWellness();
  return { ok: id ? "Category saved." : "Category added." };
}

export async function deleteWellnessCategory(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("confirm") !== "yes") return { error: "Confirm the delete, then try again." };
  const id = String(formData.get("id") ?? "");

  if ((await contentMode()) === "file") {
    const access = await fileActor((actor) => can(actor, "manage_settings"));
    if ("error" in access) return access;
    const { deleteWellnessCategoryFromStore } = await import("@/lib/data/file-content");
    if (!deleteWellnessCategoryFromStore(id)) return { error: deleteFailed };
    revalidateWellness();
    return { ok: "Deleted." };
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "manage_settings")) return { error: genericDenial };

  const cleared = await context.supabase
    .from("campus_wellness_items")
    .update({ category_id: null })
    .eq("category_id", id);
  if (cleared.error) return { error: databaseError(cleared.error, deleteFailed) };

  const removed = await context.supabase.from("campus_wellness_categories").delete().eq("id", id);
  if (removed.error) return { error: databaseError(removed.error, deleteFailed) };
  await writeAudit(context.supabase, context.actor.userId, "delete", "campus_wellness_categories", id);
  revalidateWellness();
  return { ok: "Deleted." };
}

export async function saveWellnessItem(_state: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim() || null;
  const imageRaw = String(formData.get("imageUrl") ?? "").trim();
  const imageAlt = String(formData.get("imageAlt") ?? "").trim();
  const orientationRaw = String(formData.get("imageOrientation") ?? "auto").trim();
  const pdfRaw = String(formData.get("pdfUrl") ?? "").trim();
  const published = formData.get("published") === "on";
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;

  if (title.length < 2 || title.length > 120) return { error: "Enter a title (2–120 characters)." };
  if (body.length > 8000) return { error: "Keep the text under 8000 characters." };
  if (!categoryId) return { error: "Choose a category." };
  if (imageAlt.length > 200) return { error: "Keep the image description under 200 characters." };
  if (!wellnessOrientations.has(orientationRaw)) return { error: "Choose a valid image layout." };
  const imageOrientation = orientationRaw as "auto" | "portrait" | "landscape" | "square";

  let pdfUrl: string | null = null;
  if (pdfRaw) {
    const pdf = classifyNavigationUrl(pdfRaw);
    if (!pdf.ok) return { error: "PDF must be a valid https:// link." };
    pdfUrl = pdf.url;
  }

  if ((await contentMode()) === "file") {
    const access = await fileActor((actor) => can(actor, "manage_settings"));
    if ("error" in access) return access;
    let imageUrl: string | null = null;
    if (imageRaw) {
      const image = classifyNavigationUrl(imageRaw);
      if (!image.ok) return { error: image.message };
      imageUrl = image.url;
    }
    const { saveWellnessItemToStore } = await import("@/lib/data/file-content");
    if (
      !saveWellnessItemToStore({
        id: id || undefined,
        title,
        body,
        categoryId,
        imageUrl,
        imageAlt,
        imageOrientation,
        pdfUrl,
        sortOrder,
        published,
      })
    ) {
      return { error: "Choose a valid category, or the item could not be saved." };
    }
    revalidateWellness();
    return { ok: id ? "Saved." : "Added." };
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "manage_settings")) return { error: genericDenial };

  const category = await context.supabase
    .from("campus_wellness_categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();
  if (category.error || !category.data) {
    const missing =
      isMissingTableError(category.error) ||
      (category.error?.message ?? "").toLowerCase().includes("wellness");
    return {
      error: missing
        ? "Run supabase/WELLNESS_CATEGORIES.sql in the database, then save again."
        : "Choose a valid category.",
    };
  }

  let imageUrl: string | null = null;
  if (imageRaw) {
    const hostsRow = await context.supabase.from("campus_settings").select("media_hosts").eq("id", true).maybeSingle();
    const hosts = Array.isArray(hostsRow.data?.media_hosts) ? hostsRow.data.media_hosts.map(String) : [];
    const image = classifyMediaUrl(imageRaw, hosts);
    if (!image.ok) return { error: image.message };
    imageUrl = image.url;
  }

  const record = {
    title,
    body,
    category_id: categoryId,
    image_url: imageUrl,
    image_alt: imageAlt,
    image_orientation: imageOrientation,
    pdf_url: pdfUrl,
    sort_order: sortOrder,
    published,
  };

  const saved = id
    ? await context.supabase.from("campus_wellness_items").update(record).eq("id", id).select("id").maybeSingle()
    : await context.supabase.from("campus_wellness_items").insert(record).select("id").maybeSingle();
  if (saved.error) {
    const missing =
      isMissingTableError(saved.error) ||
      (saved.error.message ?? "").toLowerCase().includes("wellness");
    return {
      error: missing
        ? "Run supabase/WELLNESS_CATEGORIES.sql in the database, then save again."
        : databaseError(saved.error, "The wellness item could not be saved."),
    };
  }

  await writeAudit(
    context.supabase,
    context.actor.userId,
    id ? "update" : "create",
    "campus_wellness_items",
    saved.data?.id ?? null,
  );
  revalidateWellness();
  return { ok: id ? "Saved." : "Added." };
}

export async function deleteWellnessItem(_state: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("confirm") !== "yes") return { error: "Confirm the delete, then try again." };
  const id = String(formData.get("id") ?? "");

  if ((await contentMode()) === "file") {
    const access = await fileActor((actor) => can(actor, "manage_settings"));
    if ("error" in access) return access;
    const { deleteWellnessItemFromStore } = await import("@/lib/data/file-content");
    if (!deleteWellnessItemFromStore(id)) return { error: deleteFailed };
    revalidateWellness();
    return { ok: "Deleted." };
  }

  const context = await staffContext();
  if ("error" in context) return { error: context.error };
  if (!can(context.actor, "manage_settings")) return { error: genericDenial };

  const removed = await context.supabase.from("campus_wellness_items").delete().eq("id", id);
  if (removed.error) return { error: databaseError(removed.error, deleteFailed) };
  await writeAudit(context.supabase, context.actor.userId, "delete", "campus_wellness_items", id);
  revalidateWellness();
  return { ok: "Deleted." };
}
