import { cache } from "react";
import { selectPublicAchievements, selectPublicCouncil, selectPublicEvents } from "@/lib/data/catalog";
import { readContentStore } from "@/lib/data/file-content";
import { groupCouncilRows, mapAchievement, mapCategory, mapEvent, mapImage } from "@/lib/data/map";
import { contentMode } from "@/lib/data/content-mode";
import { seedAchievements, seedCategories, seedEvents, seedMediaHosts } from "@/lib/data/seed";
import { createPublicClient } from "@/lib/supabase/public";
import type { Achievement, CampusEvent, Category, CouncilYear, PublicCatalog } from "@/lib/types";

function localCatalog(): PublicCatalog {
  const store = readContentStore();
  return {
    source: "local",
    categories: seedCategories,
    events: selectPublicEvents(seedEvents),
    achievements: selectPublicAchievements(seedAchievements),
    councilYears: selectPublicCouncil(store.councilYears),
    mediaHosts: seedMediaHosts,
  };
}

function publishedCouncil(
  years: Record<string, unknown>[] | null,
  photos: Record<string, unknown>[],
  posts: Record<string, unknown>[],
  members: Record<string, unknown>[],
): CouncilYear[] {
  if (!years) return [];
  return selectPublicCouncil(groupCouncilRows(years, photos, posts, members));
}

async function supabaseCatalog(): Promise<PublicCatalog> {
  const supabase = createPublicClient();
  if (!supabase) return localCatalog();

  const [eventsResult, imagesResult, relationsResult, categoriesResult, achievementsResult, settingsResult, councilYearsResult, councilPhotosResult, councilPostsResult, councilMembersResult] =
    await Promise.all([
      supabase.from("campus_events").select("*").eq("publication_status", "published"),
      supabase.from("campus_event_images").select("*"),
      supabase.from("campus_event_relations").select("*"),
      supabase.from("campus_categories").select("*").order("sort_order"),
      supabase.from("campus_achievements").select("*").eq("publication_status", "published"),
      supabase.from("campus_settings").select("media_hosts").eq("id", true).maybeSingle(),
      supabase.from("campus_council_years").select("*").eq("publication_status", "published").order("sort_order"),
      supabase.from("campus_council_photos").select("*"),
      supabase.from("campus_council_posts").select("*"),
      supabase.from("campus_council_members").select("*"),
    ]);

  if (
    eventsResult.error ||
    categoriesResult.error ||
    imagesResult.error ||
    relationsResult.error ||
    achievementsResult.error ||
    settingsResult.error
  ) {
    return localCatalog();
  }

  const imagesByEvent = new Map<string, ReturnType<typeof mapImage>[]>();
  for (const row of imagesResult.data ?? []) {
    const image = mapImage(row as Record<string, unknown>);
    const eventId = String((row as { event_id: string }).event_id);
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

  const events = (eventsResult.data ?? []).map((row) =>
    mapEvent(
      row as Record<string, unknown>,
      imagesByEvent.get(String((row as { id: string }).id)) ?? [],
      relatedByEvent.get(String((row as { id: string }).id)) ?? [],
    ),
  );

  const hosts = settingsResult.data?.media_hosts;
  return {
    source: "supabase",
    categories: (categoriesResult.data ?? []).map((row) => mapCategory(row as Record<string, unknown>)),
    events: selectPublicEvents(events),
    achievements: selectPublicAchievements(
      (achievementsResult.data ?? []).map((row) => mapAchievement(row as Record<string, unknown>)),
    ),
    councilYears: publishedCouncil(
      councilYearsResult.error ? null : ((councilYearsResult.data ?? []) as Record<string, unknown>[]),
      councilPhotosResult.error ? [] : ((councilPhotosResult.data ?? []) as Record<string, unknown>[]),
      councilPostsResult.error ? [] : ((councilPostsResult.data ?? []) as Record<string, unknown>[]),
      councilMembersResult.error ? [] : ((councilMembersResult.data ?? []) as Record<string, unknown>[]),
    ),
    mediaHosts: Array.isArray(hosts) ? hosts.map(String) : [],
  };
}

export const getPublicCatalog = cache(async (): Promise<PublicCatalog> => {
  try {
    if ((await contentMode()) === "supabase") {
      const remote = await supabaseCatalog();
      if (remote.events.length > 0 || remote.achievements.length > 0 || remote.councilYears.length > 0) return remote;
    }
  } catch (error) {
    console.error(error);
  }
  return localCatalog();
});

export async function getPublicEvent(slug: string): Promise<{
  catalog: PublicCatalog;
  event: CampusEvent | null;
}> {
  const catalog = await getPublicCatalog();
  return {
    catalog,
    event: catalog.events.find((item) => item.slug === slug) ?? null,
  };
}

export function findCategory(categories: Category[], id: string | null) {
  if (!id) return null;
  return categories.find((category) => category.id === id) ?? null;
}

export function achievementsForEvent(achievements: Achievement[], eventId: string) {
  return achievements.filter((item) => item.eventId === eventId);
}
