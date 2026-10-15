import { contentMode } from "@/lib/data/content-mode";
import { readContentStore } from "@/lib/data/file-content";
import {
  groupCouncilRows,
  mapAchievement,
  mapAnnouncement,
  mapCategory,
  mapEvent,
  mapFaq,
  mapImage,
} from "@/lib/data/map";
import { seedAchievements, seedCategories, seedCouncilYears, seedEvents } from "@/lib/data/seed";
import { logPostgrestUnlessMissing } from "@/lib/supabase/errors";
import { createStaffClient } from "@/lib/supabase/server";
import type { Achievement, Announcement, CampusEvent, Category, CouncilYear, Faq } from "@/lib/types";

function workspaceFromStore() {
  const store = readContentStore();
  return {
    events: store.events,
    categories: store.categories,
    achievements: store.achievements,
    councilYears: store.councilYears,
    mediaHosts: [] as string[],
    councilLogoUrl: store.councilLogoUrl ?? null,
    announcements: store.announcements ?? [],
    faqs: store.faqs ?? [],
  };
}

function seedWorkspace() {
  return {
    events: seedEvents,
    categories: seedCategories,
    achievements: seedAchievements,
    councilYears: seedCouncilYears,
    mediaHosts: [] as string[],
    councilLogoUrl: null as string | null,
    announcements: [] as Announcement[],
    faqs: [] as Faq[],
  };
}

export async function getStaffWorkspace() {
  try {
    return await loadStaffWorkspace();
  } catch (error) {
    console.error(error);
    return seedWorkspace();
  }
}

async function loadStaffWorkspace() {
  if ((await contentMode()) === "file") {
    try {
      return workspaceFromStore();
    } catch {
      return seedWorkspace();
    }
  }

  const supabase = await createStaffClient();
  if (!supabase) return null;

  const [
    eventsResult,
    imagesResult,
    relationsResult,
    eventCategoriesResult,
    categoriesResult,
    achievementsResult,
    settingsResult,
    councilYearsResult,
    councilPhotosResult,
    councilPostsResult,
    councilMembersResult,
    announcementsResult,
    faqsResult,
  ] = await Promise.all([
    supabase.from("campus_events").select("*").order("updated_at", { ascending: false }),
    supabase.from("campus_event_images").select("*"),
    supabase.from("campus_event_relations").select("*"),
    supabase.from("campus_event_categories").select("*"),
    supabase.from("campus_categories").select("*").order("sort_order"),
    supabase.from("campus_achievements").select("*").order("updated_at", { ascending: false }),
    supabase.from("campus_settings").select("media_hosts, council_logo_url").eq("id", true).maybeSingle(),
    supabase.from("campus_council_years").select("*").order("sort_order"),
    supabase.from("campus_council_photos").select("*"),
    supabase.from("campus_council_posts").select("*"),
    supabase.from("campus_council_members").select("*"),
    supabase.from("campus_announcements").select("*").order("created_at", { ascending: false }),
    supabase.from("campus_faqs").select("*").order("sort_order"),
  ]);

  logPostgrestUnlessMissing(eventsResult.error);
  logPostgrestUnlessMissing(categoriesResult.error);
  logPostgrestUnlessMissing(achievementsResult.error);
  logPostgrestUnlessMissing(councilYearsResult.error);
  logPostgrestUnlessMissing(imagesResult.error);
  logPostgrestUnlessMissing(relationsResult.error);
  logPostgrestUnlessMissing(settingsResult.error);

  const imagesByEvent = new Map<string, ReturnType<typeof mapImage>[]>();
  for (const row of imagesResult.error ? [] : (imagesResult.data ?? [])) {
    const record = row as Record<string, unknown>;
    const image = mapImage(record);
    const eventId = String(record.event_id);
    const list = imagesByEvent.get(eventId) ?? [];
    list.push(image);
    imagesByEvent.set(eventId, list);
  }

  const relatedByEvent = new Map<string, string[]>();
  for (const row of relationsResult.error ? [] : (relationsResult.data ?? [])) {
    const record = row as { event_id: string; related_event_id: string };
    const list = relatedByEvent.get(record.event_id) ?? [];
    list.push(record.related_event_id);
    relatedByEvent.set(record.event_id, list);
  }

  const categoriesByEvent = new Map<string, string[]>();
  for (const row of eventCategoriesResult.error ? [] : (eventCategoriesResult.data ?? [])) {
    const record = row as { event_id: string; category_id: string };
    const list = categoriesByEvent.get(record.event_id) ?? [];
    list.push(record.category_id);
    categoriesByEvent.set(record.event_id, list);
  }

  const events = eventsResult.error
    ? []
    : (eventsResult.data ?? []).map((row) => {
        const record = row as Record<string, unknown>;
        const id = String(record.id);
        return mapEvent(
          record,
          imagesByEvent.get(id) ?? [],
          relatedByEvent.get(id) ?? [],
          categoriesByEvent.get(id) ?? [],
        );
      });

  const hosts = settingsResult.data?.media_hosts;
  const councilYears: CouncilYear[] = councilYearsResult.error
    ? readContentStore().councilYears
    : groupCouncilRows(
        (councilYearsResult.data ?? []) as Record<string, unknown>[],
        councilPhotosResult.error ? [] : ((councilPhotosResult.data ?? []) as Record<string, unknown>[]),
        councilPostsResult.error ? [] : ((councilPostsResult.data ?? []) as Record<string, unknown>[]),
        councilMembersResult.error ? [] : ((councilMembersResult.data ?? []) as Record<string, unknown>[]),
      );

  return {
    events,
    categories: categoriesResult.error
      ? readContentStore().categories
      : (categoriesResult.data ?? []).map((row) => mapCategory(row as Record<string, unknown>)),
    achievements: achievementsResult.error
      ? []
      : (achievementsResult.data ?? []).map((row) => mapAchievement(row as Record<string, unknown>)),
    councilYears,
    mediaHosts: Array.isArray(hosts) ? hosts.map(String) : [],
    councilLogoUrl: settingsResult.data?.council_logo_url ? String(settingsResult.data.council_logo_url) : null,
    announcements: announcementsResult.error
      ? []
      : (announcementsResult.data ?? []).map((row) => mapAnnouncement(row as Record<string, unknown>)),
    faqs: faqsResult.error
      ? []
      : (faqsResult.data ?? []).map((row) => mapFaq(row as Record<string, unknown>)),
  };
}

export async function getStaffEvent(id: string): Promise<CampusEvent | null> {
  const workspace = await getStaffWorkspace();
  return workspace?.events.find((event) => event.id === id) ?? null;
}

export type StaffWorkspace = NonNullable<Awaited<ReturnType<typeof getStaffWorkspace>>>;

export type { Achievement, Category };
