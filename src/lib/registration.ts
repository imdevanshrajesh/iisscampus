import { classifyNavigationUrl } from "./media/url.ts";
import type { RegistrationProvider } from "@/lib/types";

export type RegistrationState =
  | { state: "hidden" }
  | {
      state: "open";
      href: string;
      label: string;
      deadline: string | null;
      full: boolean;
      remaining: number | null;
    }
  | { state: "closed"; deadline: string | null }
  | { state: "full"; deadline: string | null }
  | { state: "unavailable"; deadline: string | null };

type RegistrationFields = {
  registrationEnabled: boolean;
  registrationUrl: string | null;
  registrationLabel: string | null;
  registrationProvider: RegistrationProvider | string | null;
  registrationDeadline: string | null;
  registrationLimit?: number | null;
  registrationCount?: number | null;
  overflowRegistrationUrl?: string | null;
  overflowRegistrationLabel?: string | null;
};

function arigoSignupUrl() {
  const raw = process.env.NEXT_PUBLIC_ARIGO_URL?.trim();
  if (!raw) return null;
  const classified = classifyNavigationUrl(raw);
  if (!classified.ok) return null;
  try {
    return new URL("/signup", classified.url).toString();
  } catch {
    return null;
  }
}

export function googleFormUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const classified = classifyNavigationUrl(raw.trim());
  if (!classified.ok) return null;
  try {
    const url = new URL(classified.url);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "forms.gle") return classified.url;
    if (host === "docs.google.com" && url.pathname.startsWith("/forms")) return classified.url;
  } catch {
    return null;
  }
  return null;
}

/** Three modes: Arigo signup, a page on this site, or a Google Form. */
function resolveRegistrationHref(
  provider: RegistrationProvider | string | null,
  registrationUrl: string | null,
): string | null {
  const mode = provider === "page" || provider === "google_form" ? provider : "arigo";

  if (mode === "arigo") {
    if (registrationUrl) {
      const classified = classifyNavigationUrl(registrationUrl);
      if (classified.ok) return classified.url;
    }
    return arigoSignupUrl();
  }

  if (!registrationUrl) return null;

  if (mode === "page") {
    if (registrationUrl.startsWith("/")) return registrationUrl;
    const classified = classifyNavigationUrl(registrationUrl);
    return classified.ok ? classified.url : null;
  }

  return googleFormUrl(registrationUrl);
}

function places(event: RegistrationFields) {
  const limit = event.registrationLimit;
  if (limit == null || !Number.isFinite(limit) || limit < 1) {
    return { full: false, remaining: null as number | null };
  }
  const rawCount = event.registrationCount;
  const count = rawCount != null && Number.isFinite(rawCount) ? Math.max(0, rawCount) : 0;
  return {
    full: count >= limit,
    remaining: Math.max(0, limit - count),
  };
}

export function registrationState(
  event: RegistrationFields,
  today = new Date().toISOString().slice(0, 10),
): RegistrationState {
  if (!event.registrationEnabled) return { state: "hidden" };

  const deadline = event.registrationDeadline;

  if (deadline && deadline < today) {
    return { state: "closed", deadline };
  }

  const { full, remaining } = places(event);

  if (full) {
    const href = googleFormUrl(event.overflowRegistrationUrl);
    if (!href) return { state: "full", deadline };
    const label = event.overflowRegistrationLabel?.trim() || "Register on the form";
    return { state: "open", href, label, deadline, full: true, remaining: 0 };
  }

  const href = resolveRegistrationHref(event.registrationProvider, event.registrationUrl);
  if (!href) return { state: "unavailable", deadline };

  const label = event.registrationLabel?.trim() || "Register now";

  return { state: "open", href, label, deadline, full: false, remaining };
}
