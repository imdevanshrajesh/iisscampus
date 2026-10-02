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

export function registrationState(
  event: RegistrationFields,
  today = new Date().toISOString().slice(0, 10),
): RegistrationState {
  if (!event.registrationEnabled) return { state: "hidden" };

  if (event.registrationDeadline && event.registrationDeadline < today) {
    return { state: "closed" };
  }

  const classified = classifyNavigationUrl(event.registrationUrl);
  if (!classified.ok) return { state: "unavailable" };

  const label =
    event.registrationLabel?.trim() ||
    (event.registrationProvider?.toLowerCase() === "arigo"
      ? "Register through Arigo"
      : "Register");

  return { state: "open", href: classified.url, label };
}
