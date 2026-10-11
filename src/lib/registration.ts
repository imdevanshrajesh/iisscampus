import { classifyNavigationUrl } from "./media/url.ts";

export type RegistrationState =
  | { state: "hidden" }
  | { state: "open"; href: string; label: string }
  | { state: "closed" }
  | { state: "unavailable" };

type RegistrationFields = {
  registrationEnabled: boolean;
  registrationUrl: string | null;
  registrationLabel: string | null;
  registrationProvider: string | null;
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

export function registrationState(
  event: RegistrationFields,
  today = new Date().toISOString().slice(0, 10),
): RegistrationState {
  if (!event.registrationEnabled) return { state: "hidden" };

  if (event.registrationDeadline && event.registrationDeadline < today) {
    return { state: "closed" };
  }

  let href: string | null = null;
  if (event.registrationUrl) {
    const classified = classifyNavigationUrl(event.registrationUrl);
    if (!classified.ok) return { state: "unavailable" };
    href = classified.url;
  } else {
    href = arigoSignupUrl();
  }
  if (!href) return { state: "unavailable" };

  const label = event.registrationLabel?.trim() || "Register now";

  return { state: "open", href, label };
}
