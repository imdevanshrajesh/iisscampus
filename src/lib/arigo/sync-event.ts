import { resolveSiteUrl } from "@/lib/config";
import {
  buildHostedEventPayload,
  campusEventIsPublicOnArigo,
  campusRegistrationUsesArigo,
  type ArigoCampusEvent,
} from "@/lib/arigo/event-payload";

const HOST_SLUG = "india-international-school";

function arigoOrigin() {
  const raw = process.env.NEXT_PUBLIC_ARIGO_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function sendCampusEventToArigo(event: ArigoCampusEvent) {
  const secret = process.env.ARIGO_HOST_SECRET?.trim() ?? "";
  const origin = arigoOrigin();
  const campusOrigin = resolveSiteUrl();
  const hostSlug = process.env.ARIGO_HOST_SLUG?.trim() || HOST_SLUG;

  if (secret.length < 16) {
    return {
      ok: false as const,
      error:
        "The event is saved here, but Arigo is not connected yet. Set ARIGO_HOST_SECRET, then save again.",
    };
  }
  if (!origin) {
    return {
      ok: false as const,
      error: "The event is saved here, but NEXT_PUBLIC_ARIGO_URL must be the https Arigo address.",
    };
  }
  if (!campusOrigin.startsWith("https://")) {
    return {
      ok: false as const,
      error: "The event is saved here, but the campus site address must be https before Arigo can list it.",
    };
  }

  const body = buildHostedEventPayload(event, { campusOrigin, hostSlug });

  try {
    const response = await fetch(`${origin}/api/hosted-events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
        "idempotency-key": event.id,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      registrationUrl?: string | null;
    } | null;
    if (!response.ok) {
      const reason = payload?.error?.trim() || "Save again.";
      return {
        ok: false as const,
        error: `The event is saved here, but Arigo did not accept it. ${reason}`,
      };
    }
    return {
      ok: true as const,
      registrationUrl: typeof payload?.registrationUrl === "string" ? payload.registrationUrl : null,
    };
  } catch {
    return {
      ok: false as const,
      error: "The event is saved here, but Arigo could not be reached. Save again.",
    };
  }
}

export async function removeCampusEventFromArigo(eventId: string) {
  const secret = process.env.ARIGO_HOST_SECRET?.trim() ?? "";
  const origin = arigoOrigin();
  const hostSlug = process.env.ARIGO_HOST_SLUG?.trim() || HOST_SLUG;

  if (secret.length < 16) {
    return {
      ok: false as const,
      error: "The event is still on Arigo. Set ARIGO_HOST_SECRET, then delete it again.",
    };
  }
  if (!origin) {
    return {
      ok: false as const,
      error: "The event is still on Arigo. Set NEXT_PUBLIC_ARIGO_URL, then delete it again.",
    };
  }

  try {
    const response = await fetch(`${origin}/api/hosted-events`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
        "idempotency-key": eventId,
      },
      body: JSON.stringify({
        hostSlug,
        source: "iisscampus",
        externalId: eventId,
      }),
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      const reason = payload?.error?.trim() || "Try again.";
      return {
        ok: false as const,
        error: `The event is still on Arigo. ${reason}`,
      };
    }
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error: "The event is still on Arigo because Arigo could not be reached. Try again.",
    };
  }
}

export async function syncCampusEvent(
  event: ArigoCampusEvent,
  persistRegistrationUrl: (url: string) => Promise<boolean>,
) {
  const result = await sendCampusEventToArigo(event);
  if (!result.ok) return result.error;
  if (
    result.registrationUrl &&
    campusEventIsPublicOnArigo(event) &&
    campusRegistrationUsesArigo(event)
  ) {
    const saved = await persistRegistrationUrl(result.registrationUrl);
    if (!saved) {
      return "The event is on Arigo, but the register link could not be saved. Save again.";
    }
  }
  return null;
}
