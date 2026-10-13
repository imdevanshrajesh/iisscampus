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
  registrationProvider: "arigo" | "page" | "google_form" | null;
  registrationDeadline: string | null;
  registrationInstructions: string | null;
  publicationStatus: "draft" | "in_review" | "published" | "archived";
};

export function shouldSendEventToArigo(status: ArigoCampusEvent["publicationStatus"], intent: string) {
  return status === "published" || intent === "unpublish" || intent === "archive" || intent === "restore";
}

export function campusEventIsPublicOnArigo(event: Pick<ArigoCampusEvent, "publicationStatus" | "listing">) {
  return event.publicationStatus === "published" && event.listing !== "external";
}

export function campusRegistrationUsesArigo(
  event: Pick<ArigoCampusEvent, "registrationEnabled" | "registrationProvider">,
) {
  if (!event.registrationEnabled) return false;
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
  };
}
