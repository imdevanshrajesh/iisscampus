export type ArigoCampusEvent = {
  id: string;
  title: string;
  slug: string;
  listing: "event" | "competition" | "external";
  shortDescription: string;
  fullDescription: string;
  eventDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  locationName: string | null;
  locationMapUrl: string | null;
  gradeFrom: number | null;
  gradeTo: number | null;
  feeAed: number | null;
  capacity: number | null;
  registrationEnabled: boolean;
  pushToArigo: boolean;
  registrationProvider: "arigo" | "page" | "google_form" | null;
  registrationDeadline: string | null;
  registrationInstructions: string | null;
  eventStatus?: "upcoming" | "ongoing" | "completed" | null;
  publicationStatus: "draft" | "in_review" | "published" | "archived";
  coverImageUrl?: string | null;
  coverAlt?: string | null;
  coverAttribution?: string | null;
  packingList?: string | null;
  purpose?: string | null;
  activities?: string | null;
  instagramUrl?: string | null;
  videoUrl?: string | null;
  schedule?: Array<{ time: string; title: string; detail?: string | null }>;
  groups?: Array<{ name: string; detail?: string | null }>;
  resources?: Array<{
    title: string;
    detail?: string | null;
    href?: string | null;
    kind?: "card" | "link" | "pdf" | "video";
  }>;
  images?: Array<{ url: string; alt?: string | null; caption?: string | null }>;
};

export type ArigoSyncAction = "upsert" | "remove" | null;

export function arigoSyncAction(
  event: Pick<ArigoCampusEvent, "publicationStatus" | "listing" | "pushToArigo">,
  intent: string,
  options: { wasPushedToArigo?: boolean } = {},
): ArigoSyncAction {
  const publicOnCampus =
    event.publicationStatus === "published" && event.listing !== "external";
  if (event.pushToArigo && publicOnCampus) return "upsert";
  if (
    intent === "unpublish" ||
    intent === "archive" ||
    intent === "restore" ||
    (options.wasPushedToArigo && !event.pushToArigo)
  ) {
    return "remove";
  }
  return null;
}

export function shouldSendEventToArigo(
  status: ArigoCampusEvent["publicationStatus"],
  intent: string,
  pushToArigo = false,
) {
  if (pushToArigo && status === "published") return true;
  return intent === "unpublish" || intent === "archive" || intent === "restore";
}

export function campusEventIsPublicOnArigo(
  event: Pick<ArigoCampusEvent, "publicationStatus" | "listing" | "pushToArigo">,
) {
  return (
    Boolean(event.pushToArigo) &&
    event.publicationStatus === "published" &&
    event.listing !== "external"
  );
}

export function campusRegistrationUsesArigo(
  event: Pick<ArigoCampusEvent, "registrationEnabled" | "registrationProvider" | "pushToArigo">,
) {
  if (!event.pushToArigo || !event.registrationEnabled) return false;
  return (event.registrationProvider ?? "arigo") === "arigo";
}

export function toArigoCampusEvent(
  id: string,
  publicationStatus: ArigoCampusEvent["publicationStatus"],
  input: Omit<ArigoCampusEvent, "id" | "publicationStatus">,
): ArigoCampusEvent {
  return {
    ...input,
    id,
    publicationStatus,
    listing: input.listing ?? "event",
    pushToArigo: Boolean(input.pushToArigo),
  };
}

function clock(value: string | null) {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})/.exec(value.trim());
  return match ? `${match[1]}:${match[2]}` : null;
}

function httpsOrNull(value: string | null) {
  if (!value?.trim().startsWith("https://")) return null;
  return value.trim();
}

export function buildHostedEventPayload(
  event: ArigoCampusEvent,
  options: { campusOrigin: string; hostSlug: string },
) {
  const origin = options.campusOrigin.replace(/\/+$/, "");
  const published = campusEventIsPublicOnArigo(event);
  return {
    hostSlug: options.hostSlug,
    externalId: event.id,
    source: "iisscampus",
    title: event.title,
    slug: event.slug,
    listing: event.listing === "competition" ? "competition" : "event",
    shortDescription: event.shortDescription,
    fullDescription: event.fullDescription,
    eventDate: event.eventDate,
    endDate: event.endDate,
    startTime: clock(event.startTime),
    endTime: clock(event.endTime),
    venueName: event.locationName?.trim() || null,
    mapUrl: httpsOrNull(event.locationMapUrl),
    gradeFrom: event.gradeFrom,
    gradeTo: event.gradeTo,
    feeAed: event.feeAed,
    capacity: event.capacity,
    registrationDeadline: event.registrationDeadline,
    registrationInstructions: event.registrationInstructions,
    campusUrl: `${origin}/events/${event.slug}`,
    published,
    registrationOpen: published && campusRegistrationUsesArigo(event),
    details: {
      coverImageUrl: httpsOrNull(event.coverImageUrl ?? null),
      coverAlt: event.coverAlt ?? null,
      coverAttribution: event.coverAttribution ?? null,
      packingList: event.packingList ?? null,
      purpose: event.purpose ?? null,
      activities: event.activities ?? null,
      instagramUrl: httpsOrNull(event.instagramUrl ?? null),
      videoUrl: httpsOrNull(event.videoUrl ?? null),
      schedule: (event.schedule ?? [])
        .filter((item) => item.time.trim() && item.title.trim())
        .map((item) => ({
          time: item.time,
          title: item.title,
          detail: item.detail ?? null,
        })),
      groups: (event.groups ?? [])
        .filter((group) => group.name.trim())
        .map((group) => ({ name: group.name, detail: group.detail ?? null })),
      resources: (event.resources ?? [])
        .filter((item) => item.title.trim())
        .map((item) => ({
          title: item.title,
          detail: item.detail ?? null,
          href: httpsOrNull(item.href ?? null),
          kind: item.kind === "pdf" || item.kind === "card" ? item.kind : "link",
        })),
      images: (event.images ?? [])
        .flatMap((image) => {
          const url = httpsOrNull(image.url);
          if (!url) return [];
          return [{ url, alt: image.alt ?? "", caption: image.caption ?? null }];
        }),
      eventStatus: event.eventStatus ?? null,
    },
  };
}
