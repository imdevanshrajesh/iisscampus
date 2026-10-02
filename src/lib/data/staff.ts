import { contentMode, preferFileContent } from "@/lib/data/content-mode";
import { readContentStore } from "@/lib/data/file-content";
import { mapAchievement, mapCategory, mapEvent, mapImage } from "@/lib/data/map";
import { seedAchievements, seedCategories, seedEvents } from "@/lib/data/seed";
import { createStaffClient } from "@/lib/supabase/server";
import type { Achievement, CampusEvent, Category } from "@/lib/types";

function workspaceFromStore() {
  const store = readContentStore();
  return {
    events: store.events,
    categories: store.categories,
    achievements: store.achievements,
    mediaHosts: [] as string[],
  };
}

function seedWorkspace() {
  return {
    events: seedEvents,
    categories: seedCategories,
    achievements: seedAchievements,
    mediaHosts: [] as string[],
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

  const [eventsResult, imagesResult, relationsResult, categoriesResult, achievementsResult, settingsResult] =
    await Promise.all([
      supabase.from("campus_events").select("*").order("updated_at", { ascending: false }),
      supabase.from("campus_event_images").select("*"),
      supabase.from("campus_event_relations").select("*"),
      supabase.from("campus_categories").select("*").order("sort_order"),
      supabase.from("campus_achievements").select("*").order("updated_at", { ascending: false }),
      supabase.from("campus_settings").select("media_hosts").eq("id", true).maybeSingle(),
    ]);

  if (
    eventsResult.error ||
    imagesResult.error ||
    relationsResult.error ||
    categoriesResult.error ||
    achievementsResult.error ||
    settingsResult.error
  ) {
    preferFileContent();
    return seedWorkspace();
  }

  const imagesByEvent = new Map<string, ReturnType<typeof mapImage>[]>();
  for (const row of imagesResult.data ?? []) {
    const record = row as Record<string, unknown>;
    const image = mapImage(record);
    const eventId = String(record.event_id);
    const list = imagesByEvent.get(eventId) ?? [];
    list.push(image);
    imagesByEvent.set(eventId, list);
  }

  const relatedByEvent = new Map<string, string[]>();
  for (const row of relationsResult.data ?? []) {
    const record = row as { event_id: string; related_event_id: string };
    const list = relatedByEvent.get(record.event_id) ?? [];
    list.push(record.related_event_id);
    relatedByEvent.set(record.event_id, list);
  }

  const events = (eventsResult.data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const id = String(record.id);
    return mapEvent(record, imagesByEvent.get(id) ?? [], relatedByEvent.get(id) ?? []);
  });

  const hosts = settingsResult.data?.media_hosts;
  return {
    events,
    categories: (categoriesResult.data ?? []).map((row) =>
      mapCategory(row as Record<string, unknown>),
    ),
    achievements: (achievementsResult.data ?? []).map((row) =>
      mapAchievement(row as Record<string, unknown>),
    ),
    mediaHosts: Array.isArray(hosts) ? hosts.map(String) : [],
  };
}

export async function getStaffEvent(id: string): Promise<CampusEvent | null> {
  const workspace = await getStaffWorkspace();
  return workspace?.events.find((event) => event.id === id) ?? null;
}

export type StaffWorkspace = NonNullable<Awaited<ReturnType<typeof getStaffWorkspace>>>;

export type { Achievement, Category };
