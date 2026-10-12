import { classifyNavigationUrl } from "./media/url.ts";
import type { RegistrationProvider } from "@/lib/types";

export type RegistrationState =
  | { state: "hidden" }
  | { state: "open"; href: string; label: string }
  | { state: "closed" }
  | { state: "unavailable" };

type RegistrationFields = {
  registrationEnabled: boolean;
  registrationUrl: string | null;
  registrationLabel: string | null;
  registrationProvider: RegistrationProvider | string | null;
  registrationDeadline: string | null;
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

  const classified = classifyNavigationUrl(registrationUrl);
  if (!classified.ok) return null;
  try {
    const host = new URL(classified.url).hostname.replace(/^www\./, "");
    if (host !== "docs.google.com" && host !== "forms.gle") return null;
  } catch {
    return null;
  }
  return classified.url;
}

export function registrationState(
  event: RegistrationFields,
  today = new Date().toISOString().slice(0, 10),
): RegistrationState {
  if (!event.registrationEnabled) return { state: "hidden" };

  if (event.registrationDeadline && event.registrationDeadline < today) {
    return { state: "closed" };
  }

  const href = resolveRegistrationHref(event.registrationProvider, event.registrationUrl);
  if (!href) return { state: "unavailable" };

  const label = event.registrationLabel?.trim() || "Register now";

  return { state: "open", href, label };
}
