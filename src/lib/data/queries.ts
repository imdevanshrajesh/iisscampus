import { compareAnnouncements } from "@/lib/announcements";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { selectPublicAchievements, selectPublicCouncil, selectPublicEvents } from "@/lib/data/catalog";
import {
  listSuggestionsFromStore,
  readAiConfig,
  readContentStore,
  readNewsletter,
  readSocial,
  readSocialPostsFromStore,
  readWellnessPageSettings,
  type StoredAiConfig,
} from "@/lib/data/file-content";
import { normalizeSocialLinks } from "@/lib/social";
import {
  groupCouncilRows,
  mapAchievement,
  mapAnnouncement,
  mapMarquee,
  mapNavGroup,
  mapCategory,
  mapEvent,
  mapFacultyMember,
  mapCustomProgram,
  mapFaq,
  mapImage,
  mapHouse,
  mapSchoolIncharge,
  mapSocialPost,
  mapWellnessCategory,
  mapWellnessItem,
} from "@/lib/data/map";
import { contentMode } from "@/lib/data/content-mode";
import type { Suggestion } from "@/lib/suggestions";
import { defaultNavGroups } from "@/lib/nav";
import { seedMediaHosts } from "@/lib/data/seed";
import { isMissingTableError, logPostgrestUnlessMissing } from "@/lib/supabase/errors";
import { createPublicClient } from "@/lib/supabase/public";
import { createStaffClient } from "@/lib/supabase/server";
import type {
  Achievement,
  Announcement,
  CustomProgram,
  MarqueeMessage,
  CampusEvent,
  Category,
  CouncilYear,
  FacultyMember,
  Faq,
  House,
  NavGroup,
  Newsletter,
  PublicCatalog,
  SchoolIncharge,
  SiteBrand,
  SocialLinks,
  SocialPost,
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

export const getPublicSocial = cache(async function getPublicSocial(): Promise<SocialLinks> {
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
});

export const getSiteBrand = cache(async function getSiteBrand(): Promise<SiteBrand> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const row = await supabase
          .from("campus_settings")
          .select("council_logo_url, contact_email, nav_logo_url, nav_logo_href, nav_label")
          .eq("id", true)
          .maybeSingle();
        if (!row.error) {
          return brandFromRow(row.data);
        }
        const logoOnly = await supabase
          .from("campus_settings")
          .select("council_logo_url, contact_email")
          .eq("id", true)
          .maybeSingle();
        if (!logoOnly.error) {
          return brandFromRow(logoOnly.data);
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
    navLogoUrl: store.navLogoUrl ?? null,
    navLogoHref: store.navLogoHref ?? null,
    navLabel: store.navLabel?.trim() || "IISS Boys",
  };
});

function brandFromRow(row: {
  council_logo_url?: string | null;
  contact_email?: string | null;
  nav_logo_url?: string | null;
  nav_logo_href?: string | null;
  nav_label?: string | null;
} | null): SiteBrand {
  return {
    councilLogoUrl: row?.council_logo_url ? String(row.council_logo_url) : null,
    contactEmail: row?.contact_email ? String(row.contact_email) : null,
    navLogoUrl: row?.nav_logo_url ? String(row.nav_logo_url) : null,
    navLogoHref: row?.nav_logo_href ? String(row.nav_logo_href) : null,
    navLabel: row?.nav_label?.trim() || "IISS Boys",
  };
}

export const getAiConfig = cache(async function getAiConfig(): Promise<StoredAiConfig> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const row = await supabase
          .from("campus_settings")
          .select("ai_provider, ai_api_key, ai_model, ai_base_url")
          .eq("id", true)
          .maybeSingle();

        if (!row.error && row.data) {
          const provider = (row.data.ai_provider || "xai") as StoredAiConfig["provider"];
          const apiKey =
            row.data.ai_api_key ||
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
            row.data.ai_model ||
            (provider === "xai"
              ? "grok-2-latest"
              : provider === "openai"
              ? "gpt-4o"
              : provider === "gemini"
              ? "gemini-2.0-flash"
              : "x-ai/grok-2-1212");
          const baseUrl = row.data.ai_base_url || null;

          return { provider, apiKey: apiKey ?? null, model, baseUrl };
        }
      }
    }
  } catch (error) {
    console.error("Error reading AI config from database:", error);
  }
  return readAiConfig();
});

export const getPublicAnnouncements = cache(async function getPublicAnnouncements(): Promise<Announcement[]> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const result = await supabase
          .from("campus_announcements")
          .select("*")
          .eq("enabled", true)
          .order("created_at", { ascending: false });
        if (!result.error) {
          return (result.data ?? []).map((row) => mapAnnouncement(row as Record<string, unknown>));
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return (readContentStore().announcements ?? [])
    .filter((item) => item.enabled)
    .slice()
    .sort(compareAnnouncements);
});

export async function getEditableAnnouncements(): Promise<Announcement[]> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const result = await supabase
          .from("campus_announcements")
          .select("*")
          .order("created_at", { ascending: false });
        if (!result.error) {
          return (result.data ?? []).map((row) => mapAnnouncement(row as Record<string, unknown>));
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return (readContentStore().announcements ?? []).slice().sort(compareAnnouncements);
}

export async function getPublicMarquee(): Promise<MarqueeMessage[]> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const result = await supabase
          .from("campus_marquee")
          .select("*")
          .eq("enabled", true)
          .order("sort_order");
        if (!result.error) {
          return (result.data ?? []).map((row) => mapMarquee(row as Record<string, unknown>));
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return (readContentStore().marquee ?? [])
    .filter((item) => item.enabled && item.message.trim())
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getEditableMarquee(): Promise<MarqueeMessage[]> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const result = await supabase.from("campus_marquee").select("*").order("sort_order");
        if (!result.error) {
          return (result.data ?? []).map((row) => mapMarquee(row as Record<string, unknown>));
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return (readContentStore().marquee ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
}

const navColumns =
  "id, label, href, sort_order, enabled, include_listing, campus_nav_items(id, group_id, title, description, href, event_id, sort_order, enabled)";

function sortNavGroups(groups: NavGroup[]) {
  return groups
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
    .map((group) => ({
      ...group,
      items: group.items.slice().sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)),
    }));
}

function localNavGroups(enabledOnly: boolean) {
  const stored = readContentStore().navGroups;
  const groups = stored ?? defaultNavGroups;
  return sortNavGroups(enabledOnly ? groups.filter((group) => group.enabled) : groups);
}

export async function getPublicNavGroups(): Promise<NavGroup[]> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const result = await supabase.from("campus_nav_groups").select(navColumns).eq("enabled", true).order("sort_order");
        if (!result.error) {
          return sortNavGroups((result.data ?? []).map((row) => mapNavGroup(row as Record<string, unknown>)));
        }
        logPostgrestUnlessMissing(result.error);
      }
    }
  } catch (error) {
    console.error(error);
  }
  return localNavGroups(true);
}

export async function getEditableNavGroups(): Promise<NavGroup[]> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = await createStaffClient();
      if (supabase) {
        const result = await supabase.from("campus_nav_groups").select(navColumns).order("sort_order");
        if (!result.error) {
          return sortNavGroups((result.data ?? []).map((row) => mapNavGroup(row as Record<string, unknown>)));
        }
        if (isMissingTableError(result.error)) return [];
        console.error(result.error);
        return [];
      }
    }
  } catch (error) {
    console.error(error);
  }
  return localNavGroups(false);
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

function attachProgramEvents(
  programs: CustomProgram[],
  events: { id: string; title: string; slug: string; published: boolean }[],
  publishedOnly: boolean,
): CustomProgram[] {
  const byId = new Map(events.map((event) => [event.id, event]));
  return programs.map((program) => {
    const event = program.eventId ? byId.get(program.eventId) : undefined;
    if (!event || (publishedOnly && !event.published) || !event.slug) {
      return { ...program, event: null };
    }
    return { ...program, event: { title: event.title, slug: event.slug } };
  });
}

async function loadCustomPrograms(publishedOnly: boolean): Promise<CustomProgram[]> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        let query = supabase.from("campus_custom_programs").select("*").order("sort_order");
        if (publishedOnly) query = query.eq("published", true);
        const result = await query;
        if (!result.error) {
          const programs = (result.data ?? []).map((row) => mapCustomProgram(row as Record<string, unknown>));
          const eventIds = [...new Set(programs.map((program) => program.eventId).filter((id): id is string => Boolean(id)))];
          if (!eventIds.length) return programs;
          const events = await supabase
            .from("campus_events")
            .select("id, title, slug, publication_status")
            .in("id", eventIds);
          if (events.error) return programs;
          return attachProgramEvents(
            programs,
            (events.data ?? []).map((row) => ({
              id: String(row.id),
              title: String(row.title ?? ""),
              slug: String(row.slug ?? ""),
              published: row.publication_status === "published",
            })),
            publishedOnly,
          );
        }
      }
    }
  } catch (error) {
    console.error(error);
  }

  const store = readContentStore();
  const programs = (store.customPrograms ?? []).filter((program) => (publishedOnly ? program.published : true));
  return attachProgramEvents(
    programs,
    store.events.map((event) => ({
      id: event.id,
      title: event.title,
      slug: event.slug,
      published: event.publicationStatus === "published",
    })),
    publishedOnly,
  );
}

export async function getPublicCustomPrograms(): Promise<CustomProgram[]> {
  return loadCustomPrograms(true);
}

export async function getEditableCustomPrograms(): Promise<CustomProgram[]> {
  return loadCustomPrograms(false);
}

async function loadSchoolIncharges(publishedOnly: boolean): Promise<SchoolIncharge[]> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = publishedOnly ? createPublicClient() : await createStaffClient();
      if (supabase) {
        let query = supabase.from("campus_school_incharges").select("*").order("sort_order");
        if (publishedOnly) {
          query = query.eq("published", true);
        }
        const result = await query;
        if (!result.error && result.data) {
          return result.data.map((row) => mapSchoolIncharge(row as Record<string, unknown>));
        }
        if (result.error && !isMissingTableError(result.error)) {
          console.error(result.error);
        }
      }
    }
  } catch (error) {
    console.error(error);
  }

  const store = readContentStore();
  const list = store.schoolIncharges ?? [];
  return list
    .filter((item) => (publishedOnly ? item.published : true))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getPublicSchoolIncharges(): Promise<SchoolIncharge[]> {
  return loadSchoolIncharges(true);
}

export async function getEditableSchoolIncharges(): Promise<SchoolIncharge[]> {
  return loadSchoolIncharges(false);
}

export const getPublicSchoolHeads = getPublicSchoolIncharges;
export const getEditableSchoolHeads = getEditableSchoolIncharges;

export type FacultyQueryResult = {
  items: FacultyMember[];
  tableMissing: boolean;
  source: "supabase" | "file";
  error?: string;
};

async function loadFaculty(publishedOnly: boolean): Promise<FacultyQueryResult> {
  if ((await contentMode()) === "supabase") {
    try {
      const supabase = publishedOnly ? createPublicClient() : await createStaffClient();
      if (!supabase) {
        return { items: [], tableMissing: false, source: "supabase" };
      }
      let query = supabase
        .from("campus_faculty")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (publishedOnly) {
        query = query.eq("published", true);
      }
      const result = await query;
      if (!result.error && result.data) {
        return {
          items: result.data.map((row) => mapFacultyMember(row as Record<string, unknown>)),
          tableMissing: false,
          source: "supabase",
        };
      }
      if (result.error) {
        if (isMissingTableError(result.error)) {
          return { items: [], tableMissing: true, source: "supabase" };
        }
        console.error(result.error);
        return {
          items: [],
          tableMissing: false,
          source: "supabase",
          error: result.error.message,
        };
      }
    } catch (error) {
      console.error(error);
      return {
        items: [],
        tableMissing: false,
        source: "supabase",
        error: error instanceof Error ? error.message : "Could not load faculty.",
      };
    }
    return { items: [], tableMissing: false, source: "supabase" };
  }

  const store = readContentStore();
  const list = store.faculty ?? [];
  return {
    items: list
      .filter((item) => (publishedOnly ? item.published : true))
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder),
    tableMissing: false,
    source: "file",
  };
}

export async function getPublicFaculty(): Promise<FacultyQueryResult> {
  return loadFaculty(true);
}

export async function getEditableFaculty(): Promise<FacultyQueryResult> {
  return loadFaculty(false);
}

async function loadHouses(publishedOnly: boolean): Promise<House[]> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = publishedOnly ? createPublicClient() : await createStaffClient();
      if (supabase) {
        let query = supabase.from("campus_houses").select("*").order("sort_order");
        if (publishedOnly) {
          query = query.eq("published", true);
        }
        const result = await query;
        if (!result.error && result.data) {
          return result.data.map((row) => mapHouse(row as Record<string, unknown>));
        }
        if (result.error && !isMissingTableError(result.error)) {
          console.error(result.error);
        }
      }
    }
  } catch (error) {
    console.error(error);
  }

  const store = readContentStore();
  const list = store.houses ?? [];
  return list
    .filter((item) => (publishedOnly ? item.published : true))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getPublicHouses(): Promise<House[]> {
  return loadHouses(true);
}

export async function getEditableHouses(): Promise<House[]> {
  return loadHouses(false);
}

export async function getHouseBySlug(slug: string): Promise<House | null> {
  const houses = await getPublicHouses();
  return houses.find((h) => h.slug.toLowerCase() === slug.toLowerCase()) ?? null;
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

function mapSuggestion(row: Record<string, unknown>): Suggestion {
  return {
    id: String(row.id),
    email: String(row.email ?? ""),
    body: String(row.body ?? ""),
    createdAt: String(row.created_at ?? row.createdAt ?? ""),
  };
}

export async function getStaffSuggestions(): Promise<{ items: Suggestion[]; missing: boolean }> {
  try {
    if ((await contentMode()) === "file") {
      return {
        items: listSuggestionsFromStore().slice(0, 200).map((item) => ({
          id: item.id,
          email: item.email,
          body: item.body,
          createdAt: item.createdAt,
        })),
        missing: false,
      };
    }
    const supabase = await createStaffClient();
    if (!supabase) return { items: [], missing: false };
    const result = await supabase
      .from("campus_suggestions")
      .select("id, email, body, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (result.error) return { items: [], missing: isMissingTableError(result.error) };
    return { items: (result.data ?? []).map((row) => mapSuggestion(row as Record<string, unknown>)), missing: false };
  } catch (error) {
    console.error(error);
    return { items: [], missing: false };
  }
}

export const countStaffSuggestions = cache(async function countStaffSuggestions() {
  try {
    if ((await contentMode()) === "file") return listSuggestionsFromStore().length;
    const supabase = await createStaffClient();
    if (!supabase) return 0;
    const result = await supabase.from("campus_suggestions").select("id", { count: "exact", head: true });
    if (result.error) {
      logPostgrestUnlessMissing(result.error);
      return 0;
    }
    return result.count ?? 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
});

export async function getPublicSocialPosts(): Promise<SocialPost[]> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const result = await supabase
          .from("campus_social_posts")
          .select("*")
          .eq("pinned", true)
          .order("sort_order", { ascending: true })
          .order("published_on", { ascending: false });
        if (!result.error) {
          return (result.data ?? []).map((row) => mapSocialPost(row as Record<string, unknown>));
        }
        logPostgrestUnlessMissing(result.error);
      }
    }
  } catch (error) {
    console.error(error);
  }
  return readSocialPostsFromStore()
    .filter((post) => post.pinned)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || new Date(b.publishedOn).getTime() - new Date(a.publishedOn).getTime());
}

export async function getEditableSocialPosts(): Promise<SocialPost[]> {
  try {
    if ((await contentMode()) === "supabase") {
      const supabase = createPublicClient();
      if (supabase) {
        const result = await supabase
          .from("campus_social_posts")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("published_on", { ascending: false });
        if (!result.error) {
          return (result.data ?? []).map((row) => mapSocialPost(row as Record<string, unknown>));
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return readSocialPostsFromStore()
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || new Date(b.publishedOn).getTime() - new Date(a.publishedOn).getTime());
}
