import type {
  Achievement,
  CampusEvent,
  Category,
  CouncilKind,
  CouncilMember,
  CouncilPhoto,
  CouncilPost,
  CouncilYear,
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

export function mapCouncilMember(row: Record<string, unknown>): CouncilMember {
  return {
    id: String(row.id),
    role: String(row.role ?? ""),
    name: String(row.name ?? ""),
    imageUrl: row.image_url ? String(row.image_url) : null,
    imageAlt: row.image_alt ? String(row.image_alt) : null,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export function mapCouncilPhoto(row: Record<string, unknown>): CouncilPhoto {
  return {
    id: String(row.id),
    url: String(row.url),
    alt: String(row.alt ?? ""),
    caption: row.caption ? String(row.caption) : null,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export function mapCouncilPost(row: Record<string, unknown>): CouncilPost {
  return {
    id: String(row.id),
    title: String(row.title),
    body: String(row.body ?? ""),
    publishedOn: row.published_on ? String(row.published_on).slice(0, 10) : null,
    imageUrl: row.image_url ? String(row.image_url) : null,
    imageAlt: row.image_alt ? String(row.image_alt) : null,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export function mapCouncilYear(
  row: Record<string, unknown>,
  photos: CouncilPhoto[] = [],
  posts: CouncilPost[] = [],
  members: CouncilMember[] = [],
): CouncilYear {
  const kind = String(row.kind ?? "past");
  return {
    id: String(row.id),
    label: String(row.label),
    slug: String(row.slug),
    kind: (kind === "current" || kind === "upcoming" || kind === "past" ? kind : "past") as CouncilKind,
    summary: String(row.summary ?? ""),
    publicationStatus: row.publication_status as CouncilYear["publicationStatus"],
    sortOrder: Number(row.sort_order ?? 0),
    isSample: Boolean(row.is_sample),
    members: members.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    photos: photos.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    posts: posts.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    publishedAt: row.published_at ? String(row.published_at) : null,
  };
}

export function groupCouncilRows(
  years: Record<string, unknown>[],
  photos: Record<string, unknown>[],
  posts: Record<string, unknown>[],
  members: Record<string, unknown>[] = [],
): CouncilYear[] {
  const membersByYear = new Map<string, CouncilMember[]>();
  for (const row of members) {
    const yearId = String(row.year_id);
    const list = membersByYear.get(yearId) ?? [];
    list.push(mapCouncilMember(row));
    membersByYear.set(yearId, list);
  }
  const photosByYear = new Map<string, CouncilPhoto[]>();
  for (const row of photos) {
    const yearId = String(row.year_id);
    const list = photosByYear.get(yearId) ?? [];
    list.push(mapCouncilPhoto(row));
    photosByYear.set(yearId, list);
  }
  const postsByYear = new Map<string, CouncilPost[]>();
  for (const row of posts) {
    const yearId = String(row.year_id);
    const list = postsByYear.get(yearId) ?? [];
    list.push(mapCouncilPost(row));
    postsByYear.set(yearId, list);
  }
  return years.map((row) => {
    const id = String(row.id);
    return mapCouncilYear(row, photosByYear.get(id) ?? [], postsByYear.get(id) ?? [], membersByYear.get(id) ?? []);
  });
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
