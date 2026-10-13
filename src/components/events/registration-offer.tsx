import { formatEventDay } from "@/lib/events/display";
import { registrationState } from "@/lib/registration";
import type { CampusEvent } from "@/lib/types";

export function RegistrationOffer({
  event,
  compact = false,
  children,
}: {
  event: CampusEvent;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  const registration = registrationState(event);
  const due = registration.state === "hidden" ? null : formatEventDay(registration.deadline);
  if (registration.state === "hidden" && !children) return null;

  return (
    <div className={compact ? "mt-4" : "mt-8"}>
      <div className="flex flex-wrap items-center gap-3">
        {registration.state === "open" ? (
          <a
            href={registration.href}
            className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink"
            rel="noopener noreferrer"
            target={registration.href.startsWith("/") ? undefined : "_blank"}
          >
            {registration.label}
          </a>
        ) : null}
        {registration.state === "open" && due ? (
          <p className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink">
            <span className="text-muted">Due </span>
            {due}
          </p>
        ) : null}
        {registration.state === "closed" ? (
          <p className="text-sm text-muted">Registration closed{due ? ` on ${due}` : ""}.</p>
        ) : null}
        {registration.state === "full" ? <p className="text-sm text-muted">Registration is full.</p> : null}
        {children}
      </div>
      {registration.state === "open" && registration.full ? (
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
          The registration limit has been reached. Use this form to register.
        </p>
      ) : null}
      {registration.state === "open" && !registration.full && registration.remaining != null ? (
        <p className="mt-3 text-sm text-muted">
          {registration.remaining === 1 ? "1 place left" : `${registration.remaining} places left`}
        </p>
      ) : null}
      {registration.state === "open" && !registration.full && event.registrationInstructions ? (
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{event.registrationInstructions}</p>
      ) : null}
    </div>
  );
}
