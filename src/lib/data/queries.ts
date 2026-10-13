import { cache } from "react";
import { unstable_cache } from "next/cache";
import { selectPublicAchievements, selectPublicCouncil, selectPublicEvents } from "@/lib/data/catalog";
import {
  readContentStore,
  readNewsletter,
  readSocial,
  readWellnessPageSettings,
} from "@/lib/data/file-content";
import { normalizeSocialLinks } from "@/lib/social";
import {
  groupCouncilRows,
  mapAchievement,
  mapAnnouncement,
  mapCategory,
  mapEvent,
  mapFaq,
  mapImage,
  mapWellnessCategory,
  mapWellnessItem,
} from "@/lib/data/map";
import { contentMode } from "@/lib/data/content-mode";
import { seedMediaHosts } from "@/lib/data/seed";
import { logPostgrestUnlessMissing } from "@/lib/supabase/errors";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  Achievement,
  Announcement,
  CampusEvent,
  Category,
  CouncilYear,
  Faq,
  Newsletter,
  PublicCatalog,
  SiteBrand,
  SocialLinks,
  WellnessCategory,
  WellnessItem,
  WellnessPageSettings,
} from "@/lib/types";

function localCatalog(): PublicCatalog {
  const store = readContentStore();
  return {
    source: "local",
    categories: store.categories,
    events: selectPublicEvents(store.events),
    achievements: selectPublicAchievements(store.achievements),
    councilYears: selectPublicCouncil(store.councilYears),
    mediaHosts: seedMediaHosts,
    councilLogoUrl: store.councilLogoUrl ?? null,
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
  ] = await Promise.all([
    supabase.from("campus_events").select("*").eq("publication_status", "published"),
    supabase.from("campus_event_images").select("*"),
    supabase.from("campus_event_relations").select("*"),
    supabase.from("campus_event_categories").select("*"),
    supabase.from("campus_categories").select("*").order("sort_order"),
    supabase.from("campus_achievements").select("*").eq("publication_status", "published"),
    supabase.from("campus_settings").select("media_hosts, council_logo_url").eq("id", true).maybeSingle(),
    supabase.from("campus_council_years").select("*").eq("publication_status", "published").order("sort_order"),
    supabase.from("campus_council_photos").select("*"),
    supabase.from("campus_council_posts").select("*"),
    supabase.from("campus_council_members").select("*"),
  ]);

  logPostgrestUnlessMissing(eventsResult.error);
  logPostgrestUnlessMissing(categoriesResult.error);
  logPostgrestUnlessMissing(achievementsResult.error);
  logPostgrestUnlessMissing(councilYearsResult.error);

  if (eventsResult.error || categoriesResult.error || achievementsResult.error) {
    return localCatalog();
  }

  const imagesByEvent = new Map<string, ReturnType<typeof mapImage>[]>();
  for (const row of imagesResult.error ? [] : (imagesResult.data ?? [])) {
    const image = mapImage(row as Record<string, unknown>);
    const eventId = String((row as { event_id: string }).event_id);
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

  const events = (eventsResult.data ?? []).map((row) => {
    const id = String((row as { id: string }).id);
    return mapEvent(
      row as Record<string, unknown>,
      imagesByEvent.get(id) ?? [],
      relatedByEvent.get(id) ?? [],
      categoriesByEvent.get(id) ?? [],
    );
  });

  const hosts = settingsResult.error ? [] : settingsResult.data?.media_hosts;
  const logoRaw = settingsResult.error ? null : settingsResult.data?.council_logo_url;
  const councilYears = councilYearsResult.error
    ? selectPublicCouncil(readContentStore().councilYears)
    : publishedCouncil(
        (councilYearsResult.data ?? []) as Record<string, unknown>[],
        councilPhotosResult.error ? [] : ((councilPhotosResult.data ?? []) as Record<string, unknown>[]),
        councilPostsResult.error ? [] : ((councilPostsResult.data ?? []) as Record<string, unknown>[]),
        councilMembersResult.error ? [] : ((councilMembersResult.data ?? []) as Record<string, unknown>[]),
      );
  return {
    source: "supabase",
    categories: (categoriesResult.data ?? []).map((row) => mapCategory(row as Record<string, unknown>)),
    events: selectPublicEvents(events),
    achievements: selectPublicAchievements(
      (achievementsResult.data ?? []).map((row) => mapAchievement(row as Record<string, unknown>)),
    ),
    councilYears,
    mediaHosts: Array.isArray(hosts) ? hosts.map(String) : [],
    councilLogoUrl: logoRaw ? String(logoRaw) : null,
  };
}

export async function getPublicNewsletter(): Promise<Newsletter | null> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const row = await supabase
          .from("campus_settings")
          .select("newsletter_title, newsletter_image_url, newsletter_href, newsletter_pdf_url, newsletter_published")
          .eq("id", true)
          .maybeSingle();
        if (!row.error && row.data?.newsletter_published) {
          const title = String(row.data.newsletter_title ?? "").trim();
          const imageUrl = String(row.data.newsletter_image_url ?? "").trim() || null;
          const href = String(row.data.newsletter_href ?? "").trim() || null;
          const pdfUrl = String(row.data.newsletter_pdf_url ?? "").trim() || null;
          if (title && (href || pdfUrl)) return { title, imageUrl, href, pdfUrl, published: true };
        }
        if (row.error) {
          const pdf = await supabase.from("campus_settings").select("newsletter_pdf_url").eq("id", true).maybeSingle();
          const pdfUrl = String(pdf.data?.newsletter_pdf_url ?? "").trim();
          if (!pdf.error && pdfUrl) return { title: "Newsletter", imageUrl: null, href: null, pdfUrl, published: true };
        }
        if (!row.error) return null;
      }
    }
  } catch (error) {
    console.error(error);
  }
  const local = readNewsletter();
  if (!local?.published || !local.title || !(local.href || local.pdfUrl)) return null;
  return local;
}

export async function getEditableNewsletter(): Promise<Newsletter | null> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const row = await supabase
          .from("campus_settings")
          .select("newsletter_title, newsletter_image_url, newsletter_href, newsletter_pdf_url, newsletter_published")
          .eq("id", true)
          .maybeSingle();
        if (!row.error && row.data) {
          return {
            title: String(row.data.newsletter_title ?? ""),
            imageUrl: String(row.data.newsletter_image_url ?? "").trim() || null,
            href: String(row.data.newsletter_href ?? "").trim() || null,
            pdfUrl: String(row.data.newsletter_pdf_url ?? "").trim() || null,
            published: Boolean(row.data.newsletter_published),
          };
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return readNewsletter();
}

function socialFromRow(row: {
  site_links?: unknown;
  instagram_url?: string | null;
  scixcom_instagram_url?: string | null;
} | null): SocialLinks {
  const stored =
    row?.site_links && typeof row.site_links === "object" && !Array.isArray(row.site_links)
      ? (row.site_links as Record<string, unknown>)
      : {};
  return normalizeSocialLinks({
    ...stored,
    instagramUrl: stored.instagramUrl || row?.instagram_url,
    scixcomInstagramUrl: stored.scixcomInstagramUrl || row?.scixcom_instagram_url,
  });
}

export async function getPublicSocial(): Promise<SocialLinks> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const row = await supabase
          .from("campus_settings")
          .select("site_links, instagram_url, scixcom_instagram_url")
          .eq("id", true)
          .maybeSingle();
        if (!row.error) return socialFromRow(row.data);
        const legacy = await supabase
          .from("campus_settings")
          .select("instagram_url, scixcom_instagram_url")
          .eq("id", true)
          .maybeSingle();
        if (!legacy.error) return socialFromRow(legacy.data);
      }
    }
  } catch (error) {
    console.error(error);
  }
  return normalizeSocialLinks(readSocial());
}

export async function getSiteBrand(): Promise<SiteBrand> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const row = await supabase
          .from("campus_settings")
          .select("council_logo_url, contact_email")
          .eq("id", true)
          .maybeSingle();
        if (!row.error) {
          return {
            councilLogoUrl: row.data?.council_logo_url ? String(row.data.council_logo_url) : null,
            contactEmail: row.data?.contact_email ? String(row.data.contact_email) : null,
          };
        }
        const logoOnly = await supabase
          .from("campus_settings")
          .select("council_logo_url")
          .eq("id", true)
          .maybeSingle();
        if (!logoOnly.error) {
          return {
            councilLogoUrl: logoOnly.data?.council_logo_url ? String(logoOnly.data.council_logo_url) : null,
            contactEmail: null,
          };
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  const store = readContentStore();
  return {
    councilLogoUrl: store.councilLogoUrl ?? null,
    contactEmail: store.contactEmail ?? null,
  };
}

export async function getPublicAnnouncements(): Promise<Announcement[]> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const result = await supabase
          .from("campus_announcements")
          .select("*")
          .eq("enabled", true)
          .order("sort_order");
        if (!result.error) {
          return (result.data ?? []).map((row) => mapAnnouncement(row as Record<string, unknown>));
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return (readContentStore().announcements ?? []).filter((item) => item.enabled);
}

export async function getEditableAnnouncements(): Promise<Announcement[]> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const result = await supabase.from("campus_announcements").select("*").order("sort_order");
        if (!result.error) {
          return (result.data ?? []).map((row) => mapAnnouncement(row as Record<string, unknown>));
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return readContentStore().announcements ?? [];
}

export async function getPublicFaqs(): Promise<Faq[]> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const result = await supabase
          .from("campus_faqs")
          .select("*")
          .eq("published", true)
          .order("sort_order");
        if (!result.error) {
          return (result.data ?? []).map((row) => mapFaq(row as Record<string, unknown>));
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return (readContentStore().faqs ?? []).filter((item) => item.published);
}

export async function getEditableFaqs(): Promise<Faq[]> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const result = await supabase.from("campus_faqs").select("*").order("sort_order");
        if (!result.error) {
          return (result.data ?? []).map((row) => mapFaq(row as Record<string, unknown>));
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return readContentStore().faqs ?? [];
}

const defaultWellnessPage: WellnessPageSettings = {
  pageTitle: "Wellness Corner",
  navLabel: "Wellness",
};

export async function getWellnessPageSettings(): Promise<WellnessPageSettings> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const row = await supabase
          .from("campus_settings")
          .select("wellness_page_title, wellness_nav_label")
          .eq("id", true)
          .maybeSingle();
        if (!row.error && row.data) {
          return {
            pageTitle: String(row.data.wellness_page_title ?? "").trim() || defaultWellnessPage.pageTitle,
            navLabel: String(row.data.wellness_nav_label ?? "").trim() || defaultWellnessPage.navLabel,
          };
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return readWellnessPageSettings();
}

function sortWellnessCategories(categories: WellnessCategory[]) {
  return [...categories].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

function sortWellnessItems(items: WellnessItem[]) {
  return [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}

export async function getPublicWellnessCategories(): Promise<WellnessCategory[]> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const result = await supabase.from("campus_wellness_categories").select("*").order("sort_order");
        if (!result.error) {
          return sortWellnessCategories(
            (result.data ?? []).map((row) => mapWellnessCategory(row as Record<string, unknown>)),
          );
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return sortWellnessCategories(readContentStore().wellnessCategories ?? []);
}

export async function getEditableWellnessCategories(): Promise<WellnessCategory[]> {
  return getPublicWellnessCategories();
}

export async function getPublicWellnessItems(): Promise<WellnessItem[]> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const result = await supabase
          .from("campus_wellness_items")
          .select("*")
          .eq("published", true)
          .order("sort_order");
        if (!result.error) {
          return sortWellnessItems((result.data ?? []).map((row) => mapWellnessItem(row as Record<string, unknown>)));
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return sortWellnessItems((readContentStore().wellnessItems ?? []).filter((item) => item.published));
}

export async function getEditableWellnessItems(): Promise<WellnessItem[]> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const result = await supabase.from("campus_wellness_items").select("*").order("sort_order");
        if (!result.error) {
          return sortWellnessItems((result.data ?? []).map((row) => mapWellnessItem(row as Record<string, unknown>)));
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return sortWellnessItems(readContentStore().wellnessItems ?? []);
}

export const getPublicCatalog = cache(
  unstable_cache(
    async (): Promise<PublicCatalog> => {
      try {
        if ((await contentMode()) === "supabase") {
          const remote = await supabaseCatalog();
          if (remote.source === "supabase") return remote;
        }
      } catch (error) {
        console.error(error);
      }
      return localCatalog();
    },
    ["public-catalog"],
    { revalidate: 120 },
  ),
);

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
