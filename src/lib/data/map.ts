import { councilMemberSlugs } from "@/lib/data/catalog";
import type {
  Achievement,
  Announcement,
  MarqueeMessage,
  CampusEvent,
  Category,
  ContentResource,
  CouncilBoard,
  CouncilKind,
  CouncilMember,
  CouncilPhoto,
  CouncilPost,
  CouncilYear,
  EventListing,
  CustomProgram,
  CustomProgramLink,
  CustomProgramPhoto,
  Faq,
  WellnessCategory,
  WellnessImageOrientation,
  WellnessItem,
  GalleryImage,
  ParticipatingGroup,
  RegistrationProvider,
  ScheduleItem,
} from "@/lib/types";

function assignMemberSlugs(members: CouncilMember[]) {
  const sorted = members.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const slugs = councilMemberSlugs(sorted);
  return sorted.map((member, index) => ({ ...member, slug: slugs[index] ?? member.slug }));
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function mapResources(value: unknown): ContentResource[] {
  return asArray<ContentResource>(value)
    .filter((item) => item && typeof item.title === "string" && item.title.trim())
    .map((item) => ({
      title: String(item.title).trim(),
      detail: item.detail ? String(item.detail) : null,
      href: item.href ? String(item.href) : null,
      kind: item.kind === "link" || item.kind === "pdf" ? item.kind : "card",
    }));
}

export function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ""),
    sortOrder: Number(row.sort_order ?? 0),
    imageUrl: row.image_url ? String(row.image_url) : null,
    pdfUrl: row.pdf_url ? String(row.pdf_url) : null,
  };
}

export function mapImage(row: Record<string, unknown>): GalleryImage {
  return {
    id: String(row.id),
    url: String(row.url),
    alt: String(row.alt ?? ""),
    caption: row.caption ? String(row.caption) : null,
    attribution: row.attribution ? String(row.attribution) : null,
    pinned: Boolean(row.pinned),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function asRegistrationProvider(value: unknown): RegistrationProvider | null {
  const text = String(value ?? "").trim();
  if (text === "arigo" || text === "page" || text === "google_form") return text;
  return null;
}

function asListing(value: unknown): EventListing {
  if (value === "competition" || value === "external") return value;
  return "event";
}

function asBoard(value: unknown): CouncilBoard {
  return value === "junior" ? "junior" : "main";
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function optionalTime(value: unknown): string | null {
  if (!value) return null;
  const text = String(value);
  return text.length >= 5 ? text.slice(0, 5) : text;
}

export function mapEvent(
  row: Record<string, unknown>,
  images: GalleryImage[] = [],
  relatedIds: string[] = [],
  categoryIds: string[] = [],
): CampusEvent {
  const categoryId = String(row.category_id);
  const extras = categoryIds.filter((id) => id && id !== categoryId);
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    shortDescription: String(row.short_description ?? ""),
    fullDescription: String(row.full_description ?? ""),
    categoryId,
    categoryIds: [categoryId, ...extras],
    listing: asListing(row.listing),
    coverImageUrl: row.cover_image_url ? String(row.cover_image_url) : null,
    coverAlt: row.cover_alt ? String(row.cover_alt) : null,
    coverAttribution: row.cover_attribution ? String(row.cover_attribution) : null,
    eventDate: row.event_date ? String(row.event_date) : null,
    endDate: row.end_date ? String(row.end_date) : null,
    startTime: optionalTime(row.start_time),
    endTime: optionalTime(row.end_time),
    locationName: row.location_name ? String(row.location_name) : null,
    locationMapUrl: row.location_map_url ? String(row.location_map_url) : null,
    hostName: row.host_name ? String(row.host_name) : null,
    gradeFrom: optionalNumber(row.grade_from),
    gradeTo: optionalNumber(row.grade_to),
    feeAed: optionalNumber(row.fee_aed),
    capacity: optionalNumber(row.capacity),
    packingList: row.packing_list ? String(row.packing_list) : null,
    publicationStatus: row.publication_status as CampusEvent["publicationStatus"],
    eventStatus: (row.event_status as CampusEvent["eventStatus"]) ?? null,
    featured: Boolean(row.featured),
    isSample: Boolean(row.is_sample),
    registrationEnabled: Boolean(row.registration_enabled),
    pushToArigo: Boolean(row.push_to_arigo),
    registrationProvider: asRegistrationProvider(row.registration_provider),
    registrationUrl: row.registration_url ? String(row.registration_url) : null,
    registrationLabel: row.registration_label ? String(row.registration_label) : null,
    registrationDeadline: row.registration_deadline ? String(row.registration_deadline).slice(0, 10) : null,
    registrationLimit: optionalNumber(row.registration_limit),
    registrationCount: optionalNumber(row.registration_count) ?? 0,
    overflowRegistrationUrl: row.overflow_registration_url ? String(row.overflow_registration_url) : null,
    overflowRegistrationLabel: row.overflow_registration_label ? String(row.overflow_registration_label) : null,
    registrationInstructions: row.registration_instructions
      ? String(row.registration_instructions)
      : null,
    instagramUrl: row.instagram_url ? String(row.instagram_url) : null,
    purpose: row.purpose ? String(row.purpose) : null,
    activities: row.activities ? String(row.activities) : null,
    schedule: asArray<ScheduleItem>(row.schedule),
    groups: asArray<ParticipatingGroup>(row.groups),
    resources: mapResources(row.resources),
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
    quote: row.quote ? String(row.quote) : null,
    about: row.about ? String(row.about) : null,
    work: row.work ? String(row.work) : null,
    slug: row.slug ? String(row.slug) : "",
    board: asBoard(row.board),
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
    juniorHeading: String(row.junior_heading ?? "Junior Student Council").trim() || "Junior Student Council",
    publicationStatus: row.publication_status as CouncilYear["publicationStatus"],
    sortOrder: Number(row.sort_order ?? 0),
    isSample: Boolean(row.is_sample),
    members: assignMemberSlugs(members),
    photos: photos.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    posts: posts.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    publishedAt: row.published_at ? String(row.published_at) : null,
  };
}

export function mapMarquee(row: Record<string, unknown>): MarqueeMessage {
  return {
    id: String(row.id),
    message: String(row.message ?? ""),
    eventId: row.event_id ? String(row.event_id) : null,
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export function mapAnnouncement(row: Record<string, unknown>): Announcement {
  const titleRaw = String(row.title ?? "").trim();
  const legacy = String(row.message ?? "").trim();
  return {
    id: String(row.id),
    title: titleRaw || legacy || "Announcement",
    body: String(row.body ?? ""),
    resources: mapResources(row.resources),
    eventId: row.event_id ? String(row.event_id) : null,
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function mapFaq(row: Record<string, unknown>): Faq {
  return {
    id: String(row.id),
    question: String(row.question ?? ""),
    answer: String(row.answer ?? ""),
    sortOrder: Number(row.sort_order ?? 0),
    published: Boolean(row.published),
  };
}

function mapProgramPhotos(value: unknown): CustomProgramPhoto[] {
  return asArray<CustomProgramPhoto>(value)
    .filter((item) => item && typeof item.url === "string" && item.url.trim())
    .map((item) => ({
      url: String(item.url).trim(),
      alt: String(item.alt ?? "").trim(),
    }));
}

function mapProgramLinks(value: unknown): CustomProgramLink[] {
  return asArray<CustomProgramLink>(value)
    .filter((item) => item && typeof item.label === "string" && item.label.trim() && typeof item.url === "string" && item.url.trim())
    .map((item) => ({
      label: String(item.label).trim(),
      url: String(item.url).trim(),
    }));
}

export function mapCustomProgram(row: Record<string, unknown>): CustomProgram {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    websiteLabel: row.website_label ? String(row.website_label) : null,
    websiteUrl: row.website_url ? String(row.website_url) : null,
    photos: mapProgramPhotos(row.photos),
    links: mapProgramLinks(row.links),
    eventId: row.event_id ? String(row.event_id) : null,
    event: null,
    sortOrder: Number(row.sort_order ?? 0),
    published: Boolean(row.published),
  };
}

function mapWellnessOrientation(value: unknown): WellnessImageOrientation {
  const raw = String(value ?? "auto");
  if (raw === "portrait" || raw === "landscape" || raw === "square") return raw;
  return "auto";
}

export function mapWellnessCategory(row: Record<string, unknown>): WellnessCategory {
  return {
    id: String(row.id),
    name: String(row.name ?? "").trim(),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export function mapWellnessItem(row: Record<string, unknown>): WellnessItem {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    categoryId: row.category_id ? String(row.category_id) : null,
    imageUrl: row.image_url ? String(row.image_url).trim() || null : null,
    imageAlt: String(row.image_alt ?? ""),
    imageOrientation: mapWellnessOrientation(row.image_orientation),
    pdfUrl: row.pdf_url ? String(row.pdf_url).trim() || null : null,
    sortOrder: Number(row.sort_order ?? 0),
    published: Boolean(row.published),
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
    resources: mapResources(row.resources),
    publicationStatus: row.publication_status as Achievement["publicationStatus"],
    isSample: Boolean(row.is_sample),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    publishedAt: row.published_at ? String(row.published_at) : null,
  };
}
