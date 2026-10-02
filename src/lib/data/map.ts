import type {
  Achievement,
  CampusEvent,
  Category,
  GalleryImage,
  ParticipatingGroup,
  ScheduleItem,
} from "@/lib/types";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ""),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export function mapImage(row: Record<string, unknown>): GalleryImage {
  return {
    id: String(row.id),
    url: String(row.url),
    alt: String(row.alt ?? ""),
    caption: row.caption ? String(row.caption) : null,
    attribution: row.attribution ? String(row.attribution) : null,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export function mapEvent(
  row: Record<string, unknown>,
  images: GalleryImage[] = [],
  relatedIds: string[] = [],
): CampusEvent {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    shortDescription: String(row.short_description ?? ""),
    fullDescription: String(row.full_description ?? ""),
    categoryId: String(row.category_id),
    coverImageUrl: row.cover_image_url ? String(row.cover_image_url) : null,
    coverAlt: row.cover_alt ? String(row.cover_alt) : null,
    coverAttribution: row.cover_attribution ? String(row.cover_attribution) : null,
    eventDate: row.event_date ? String(row.event_date) : null,
    endDate: row.end_date ? String(row.end_date) : null,
    publicationStatus: row.publication_status as CampusEvent["publicationStatus"],
    eventStatus: (row.event_status as CampusEvent["eventStatus"]) ?? null,
    featured: Boolean(row.featured),
    isSample: Boolean(row.is_sample),
    registrationEnabled: Boolean(row.registration_enabled),
    registrationProvider: row.registration_provider ? String(row.registration_provider) : null,
    registrationUrl: row.registration_url ? String(row.registration_url) : null,
    registrationLabel: row.registration_label ? String(row.registration_label) : null,
    registrationDeadline: row.registration_deadline ? String(row.registration_deadline) : null,
    registrationInstructions: row.registration_instructions
      ? String(row.registration_instructions)
      : null,
    instagramUrl: row.instagram_url ? String(row.instagram_url) : null,
    purpose: row.purpose ? String(row.purpose) : null,
    activities: row.activities ? String(row.activities) : null,
    schedule: asArray<ScheduleItem>(row.schedule),
    groups: asArray<ParticipatingGroup>(row.groups),
    videoUrl: row.video_url ? String(row.video_url) : null,
    images: images.sort((a, b) => a.sortOrder - b.sortOrder),
    relatedIds,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    publishedAt: row.published_at ? String(row.published_at) : null,
  };
}

export function mapAchievement(row: Record<string, unknown>): Achievement {
  return {
    id: String(row.id),
    title: String(row.title),
    competitionName: String(row.competition_name ?? ""),
    winnerName: row.winner_name ? String(row.winner_name) : null,
    award: row.award ? String(row.award) : null,
    eventDate: row.event_date ? String(row.event_date) : null,
    academicYear: row.academic_year ? String(row.academic_year) : null,
    categoryId: row.category_id ? String(row.category_id) : null,
    eventId: row.event_id ? String(row.event_id) : null,
    imageUrl: row.image_url ? String(row.image_url) : null,
    imageAlt: row.image_alt ? String(row.image_alt) : null,
    publicationStatus: row.publication_status as Achievement["publicationStatus"],
    isSample: Boolean(row.is_sample),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    publishedAt: row.published_at ? String(row.published_at) : null,
  };
}
