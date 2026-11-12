"use server";

import { revalidatePath } from "next/cache";
import { getCampusActor, getCampusSession, sessionActionError } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { contentMode } from "@/lib/data/content-mode";
import {
  saveAchievementToStore,
  saveAnnouncementToStore,
  saveEventToStore,
  saveFaqToStore,
  saveMarqueeToStore,
  saveWellnessItemToStore,
  readContentStore,
} from "@/lib/data/file-content";
import { getActiveTerm } from "@/lib/data/queries";
import { createStaffClient } from "@/lib/supabase/server";
import type { EventInput, AchievementInput } from "@/lib/validation/content";

export type AutoAddPayload = {
  section: "event" | "announcement" | "achievement" | "faq" | "marquee" | "wellness" | "incharge" | "program" | "house";
  fields: Record<string, any>;
};

export type AutoAddResult =
  | {
      ok: true;
      id: string;
      section: string;
      title: string;
      editUrl: string;
      viewUrl?: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function autoAddAiRecord(payload: AutoAddPayload): Promise<AutoAddResult> {
  const session = await getCampusSession();
  const denied = sessionActionError(session);
  if (denied || session.status !== "ok") {
    return { ok: false, error: denied ?? "Sign in is required to create records." };
  }

  const { actor } = session;
  if (!can(actor, "create_draft")) {
    return { ok: false, error: "You do not have permission to create records." };
  }

  const isFile = (await contentMode()) === "file";
  const { section, fields } = payload;
  const activeTerm = await getActiveTerm();

  try {
    if (section === "event") {
      const store = readContentStore();
      const firstCat = store.categories[0]?.id || crypto.randomUUID();
      const categoryId = fields.categoryId || firstCat;

      const eventInput: EventInput = {
        title: String(fields.title || "Untitled Event").trim(),
        slug: String(fields.slug || `event-${Date.now()}`)
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-"),
        shortDescription: String(
          fields.shortDescription || fields.title || "Campus event details.",
        ).trim(),
        fullDescription: String(
          fields.fullDescription || fields.shortDescription || fields.title || "",
        ).trim(),
        categoryId,
        categoryIds: [categoryId],
        listing: "event",
        coverImageUrl: fields.coverImageUrl || null,
        coverAlt: fields.coverAlt || fields.title || null,
        coverAttribution: null,
        eventDate: fields.eventDate || null,
        endDate: fields.endDate || null,
        startTime: fields.startTime || null,
        endTime: fields.endTime || null,
        locationName: fields.locationName || null,
        locationMapUrl: null,
        hostName: null,
        gradeFrom: fields.gradeFrom ? Number(fields.gradeFrom) : null,
        gradeTo: fields.gradeTo ? Number(fields.gradeTo) : null,
        feeAed: fields.feeAed ? Number(fields.feeAed) : 0,
        capacity: fields.capacity ? Number(fields.capacity) : null,
        packingList: fields.packingList || null,
        academicYear: fields.academicYear || activeTerm.label || null,
        eventStatus: "upcoming",
        featured: false,
        registrationEnabled: false,
        pushToArigo: false,
        registrationProvider: null,
        registrationUrl: null,
        registrationLabel: null,
        registrationDeadline: null,
        registrationLimit: null,
        registrationCount: 0,
        overflowRegistrationUrl: null,
        overflowRegistrationLabel: null,
        registrationInstructions: null,
        instagramUrl: null,
        purpose: fields.purpose || null,
        activities: fields.activities || null,
        schedule: Array.isArray(fields.schedule) ? fields.schedule : [],
        groups: [],
        resources: [],
        images: [],
        relatedIds: [],
        videoUrl: null,
      };

      if (isFile) {
        const saved = saveEventToStore(actor, eventInput, "save", "");
        if ("error" in saved && saved.error) {
          return { ok: false, error: saved.error };
        }
        const savedId =
          "id" in saved && typeof saved.id === "string" ? saved.id : crypto.randomUUID();
        revalidatePath("/");
        revalidatePath("/events");
        revalidatePath("/manage");
        revalidatePath("/manage/events");

        return {
          ok: true,
          id: savedId,
          section: "event",
          title: eventInput.title,
          editUrl: `/manage/events/${savedId}/edit`,
          viewUrl: `/events/${eventInput.slug}`,
        };
      } else {
        const supabase = await createStaffClient();
        if (!supabase) return { ok: false, error: "Database not connected." };
        const { data, error } = await supabase
          .from("campus_events")
          .insert({
            title: eventInput.title,
            slug: eventInput.slug,
            short_description: eventInput.shortDescription,
            full_description: eventInput.fullDescription,
            category_id: eventInput.categoryId,
            event_date: eventInput.eventDate,
            start_time: eventInput.startTime,
            end_time: eventInput.endTime,
            location_name: eventInput.locationName,
            publication_status: "draft",
            event_status: "upcoming",
          })
          .select("id, slug")
          .single();

        if (error) return { ok: false, error: error.message };

        revalidatePath("/manage/events");
        return {
          ok: true,
          id: data.id,
          section: "event",
          title: eventInput.title,
          editUrl: `/manage/events/${data.id}/edit`,
          viewUrl: `/events/${data.slug}`,
        };
      }
    }

    if (section === "announcement") {
      const title = String(fields.title || "Announcement").trim();
      const body = String(fields.body || fields.title || "").trim();

      if (isFile) {
        const saved = saveAnnouncementToStore({
          title,
          body,
          resources: [],
          eventId: null,
          academicYear: fields.academicYear || activeTerm.label || null,
          enabled: true,
        });
        if (!saved) return { ok: false, error: "Could not save announcement." };
        revalidatePath("/announcements");
        revalidatePath("/manage/announcements");
        return {
          ok: true,
          id: "announcement-new",
          section: "announcement",
          title,
          editUrl: "/manage/announcements",
          viewUrl: "/announcements",
        };
      }
    }

    if (section === "achievement") {
      const store = readContentStore();
      const firstCat = store.categories[0]?.id || null;
      const title = String(fields.title || fields.competitionName || "Achievement").trim();
      const competitionName = String(fields.competitionName || fields.title || "Competition").trim();

      const achInput: AchievementInput = {
        title,
        competitionName,
        winnerName: fields.winnerName || null,
        award: fields.award || null,
        eventDate: fields.eventDate || null,
        academicYear: fields.academicYear || activeTerm.label || "2026-2027",
        categoryId: fields.categoryId || firstCat,
        eventId: null,
        imageUrl: null,
        imageAlt: null,
        resources: [],
      };

      if (isFile) {
        const saved = saveAchievementToStore(actor, achInput, "save", "");
        if ("error" in saved && saved.error) return { ok: false, error: saved.error };
        const id =
          "id" in saved && typeof saved.id === "string" ? saved.id : crypto.randomUUID();
        revalidatePath("/achievements");
        revalidatePath("/manage/achievements");
        return {
          ok: true,
          id,
          section: "achievement",
          title,
          editUrl: `/manage/achievements/${id}/edit`,
          viewUrl: "/achievements",
        };
      }
    }

    if (section === "faq") {
      const question = String(fields.question || fields.title || "Question").trim();
      const answer = String(fields.answer || fields.body || "").trim();

      if (isFile) {
        const saved = saveFaqToStore({
          question,
          answer,
          sortOrder: 0,
          published: true,
        });
        if (!saved) return { ok: false, error: "Could not save FAQ." };
        revalidatePath("/about");
        revalidatePath("/manage/faq");
        return {
          ok: true,
          id: "faq-new",
          section: "faq",
          title: question,
          editUrl: "/manage/faq",
          viewUrl: "/about",
        };
      }
    }

    if (section === "marquee") {
      const message = String(fields.message || fields.title || "").trim();
      if (isFile) {
        const saved = saveMarqueeToStore({
          message,
          eventId: null,
          enabled: true,
          sortOrder: 0,
        });
        if (!saved) return { ok: false, error: "Could not save marquee message." };
        revalidatePath("/");
        revalidatePath("/manage/marquee");
        return {
          ok: true,
          id: "marquee-new",
          section: "marquee",
          title: message,
          editUrl: "/manage/marquee",
          viewUrl: "/",
        };
      }
    }

    if (section === "wellness") {
      const title = String(fields.title || "Wellness Resource").trim();
      const body = String(fields.body || "").trim();

      if (isFile) {
        const saved = saveWellnessItemToStore({
          title,
          body,
          categoryId: null,
          imageUrl: null,
          imageAlt: "",
          imageOrientation: "auto",
          pdfUrl: null,
          sortOrder: 0,
          published: true,
        });
        if (!saved) return { ok: false, error: "Could not save wellness resource." };
        revalidatePath("/wellness");
        revalidatePath("/manage/wellness");
        return {
          ok: true,
          id: "wellness-new",
          section: "wellness",
          title,
          editUrl: "/manage/wellness",
          viewUrl: "/wellness",
        };
      }
    }

    if (section === "incharge") {
      const name = String(fields.name || fields.title || "School Incharge").trim();
      const role = String(fields.role || fields.designation || "Section Incharge").trim();
      const department = fields.department ? String(fields.department).trim() : null;
      const about = String(fields.about || fields.bio || fields.shortDescription || "").trim();
      const email = fields.email ? String(fields.email).trim() : null;

      if (isFile) {
        const { saveSchoolInchargeToStore } = await import("@/lib/data/file-content");
        const saved = saveSchoolInchargeToStore({
          name,
          role,
          department,
          photoUrl: fields.photoUrl || null,
          about,
          email,
          sortOrder: 0,
          published: true,
        });
        if (!saved) return { ok: false, error: "Could not save school incharge." };
        revalidatePath("/school/heads");
        revalidatePath("/heads");
        revalidatePath("/manage/heads");
        revalidatePath("/school/incharges");
        revalidatePath("/incharges");
        revalidatePath("/manage/incharges");
        return {
          ok: true,
          id: "head-new",
          section: "incharge",
          title: `${name} (${role})`,
          editUrl: "/manage/heads",
          viewUrl: "/school/heads",
        };
      }
    }

    if (section === "program") {
      const title = String(fields.title || "Awareness / Activity Program").trim();
      const summary = String(fields.summary || fields.shortDescription || fields.fullDescription || "").trim();
      const category = String(fields.category || "Awareness").trim();
      const timing = fields.timing ? String(fields.timing).trim() : null;

      if (isFile) {
        const { saveCustomProgramToStore } = await import("@/lib/data/file-content");
        const saved = saveCustomProgramToStore({
          title,
          summary,
          websiteLabel: null,
          websiteUrl: null,
          photos: fields.photoUrl ? [{ url: fields.photoUrl, alt: title }] : [],
          links: [],
          eventId: null,
          published: true,
          sortOrder: 0,
          category,
          timing,
          pdfUrl: fields.pdfUrl || null,
        });
        if (!saved) return { ok: false, error: "Could not save program." };
        revalidatePath("/school/programs");
        revalidatePath("/programs");
        revalidatePath("/manage/programs");
        return {
          ok: true,
          id: "program-new",
          section: "program",
          title,
          editUrl: "/manage/programs",
          viewUrl: "/school/programs",
        };
      }
    }

    if (section === "house") {
      const name = String(fields.name || "").trim();
      const slug = String(fields.slug || name.toLowerCase().replace(/\s*house\s*/i, "")).trim();
      const color = (fields.color || slug || "ruby").toLowerCase();
      const validColor = color === "sapphire" || color === "topaz" || color === "emerald" ? color : "ruby";
      const points = Math.max(0, Number(fields.points || 0));
      const inchargeName = String(fields.inchargeName || fields.incharge || "").trim();
      const captainName = String(fields.captainName || fields.captain || "").trim();
      const viceCaptainName = String(fields.viceCaptainName || fields.viceCaptain || "").trim();

      if (!name) return { ok: false, error: "House name is required." };

      if (isFile) {
        const { saveHouseToStore } = await import("@/lib/data/file-content");
        const saved = saveHouseToStore({
          name,
          slug,
          color: validColor,
          points,
          inchargeName: inchargeName || "Faculty Incharge",
          inchargeTitle: fields.inchargeTitle || "Faculty Incharge",
          captainName: captainName || "House Captain",
          viceCaptainName: viceCaptainName || "Vice Captain",
          motto: fields.motto || null,
          description: fields.description || null,
          sortOrder: Number(fields.sortOrder || 0),
          published: true,
        });
        if (!saved) return { ok: false, error: "Could not save house." };
        revalidatePath("/council/houses");
        revalidatePath("/houses");
        revalidatePath("/manage/houses");
        return {
          ok: true,
          id: slug,
          section: "house",
          title: name,
          editUrl: "/manage/houses",
          viewUrl: "/council/houses",
        };
      }

      const client = await createStaffClient();
      if (!client) return { ok: false, error: "Supabase client unavailable." };

      const { data, error } = await client
        .from("campus_houses")
        .upsert(
          {
            name,
            slug,
            color: validColor,
            points,
            incharge_name: inchargeName || "Faculty Incharge",
            incharge_title: fields.inchargeTitle || "Faculty Incharge",
            captain_name: captainName || "House Captain",
            vice_captain_name: viceCaptainName || "Vice Captain",
            motto: fields.motto || null,
            description: fields.description || null,
            sort_order: Number(fields.sortOrder || 0),
            published: true,
          },
          { onConflict: "slug" }
        )
        .select("id")
        .single();

      if (error) return { ok: false, error: error.message };

      revalidatePath("/council/houses");
      revalidatePath("/houses");
      revalidatePath("/manage/houses");
      return {
        ok: true,
        id: data.id,
        section: "house",
        title: name,
        editUrl: "/manage/houses",
        viewUrl: "/council/houses",
      };
    }

    return { ok: false, error: `Section '${section}' auto-add is not supported yet.` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating record.";
    return { ok: false, error: message };
  }
}
