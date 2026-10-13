import Link from "next/link";
import { DeleteRecord } from "@/components/manage/delete-record";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { canDelete } from "@/lib/auth/permissions";
import { formatEventDate } from "@/lib/data/catalog";
import { formatEventDay } from "@/lib/events/display";
import { deleteEvent } from "@/lib/manage/actions";
import { requireWorkspace } from "@/lib/manage/access";
import { registrationState } from "@/lib/registration";
import type { PublicationStatus } from "@/lib/types";

const statusTone: Record<PublicationStatus, string> = {
  draft: "bg-wash text-ink",
  in_review: "bg-sky/15 text-navy",
  published: "bg-accent/10 text-accent-deep",
  archived: "bg-line text-muted",
};

export default async function ManageEventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim().toLowerCase() ?? "";
  const status = (Array.isArray(params.status) ? params.status[0] : params.status) ?? "";
  const events = access.workspace.events.filter((event) => {
    if (status && event.publicationStatus !== status) return false;
    if (!query) return true;
    return `${event.title} ${event.shortDescription}`.toLowerCase().includes(query);
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Content</p>
          <h1 className="font-display mt-2 text-4xl text-ink">Events</h1>
        </div>
        <Link href="/manage/events/new" className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink">
          New event
        </Link>
      </div>
      <form method="get" className="mt-6 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search events"
          aria-label="Search events"
          className="min-w-56 rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
        />
        <select
          name="status"
          defaultValue={status}
          aria-label="Publication status"
          className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="in_review">In review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <button type="submit" className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm">
          Filter
        </button>
      </form>
      <ul className="mt-6 grid gap-3">
        {events.map((event) => {
          const start = formatEventDate(event.eventDate);
          const end = formatEventDate(event.endDate);
          const when = start && end && end !== start ? `${start} – ${end}` : start;
          const registration = registrationState(event);
          const due = formatEventDay(event.registrationDeadline);
          return (
            <li key={event.id} className="rounded-2xl border border-line bg-white px-4 py-4 shadow-[0_1px_0_rgba(20,27,56,0.04)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/manage/events/${event.id}/edit`} className="font-medium text-ink">
                      {event.title}
                    </Link>
                    <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.12em] ${statusTone[event.publicationStatus]}`}>
                      {event.publicationStatus.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {[when, event.locationName].filter(Boolean).join(" · ") || "Date not set"}
                  </p>
                  {event.registrationEnabled ? (
                    <p className="mt-1 text-sm text-ink">
                      {registration.state === "full"
                        ? "Registration full"
                        : registration.state === "closed"
                          ? `Registration closed${due ? ` on ${due}` : ""}`
                          : registration.state === "open" && registration.full
                            ? `Full · other form${due ? ` · due ${due}` : ""}`
                            : due
                              ? `Register by ${due}`
                              : "Registration open"}
                      {event.registrationLimit != null
                        ? ` · ${event.registrationCount} of ${event.registrationLimit}`
                        : ""}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href={`/events/${event.slug}?preview=1`}
                    className="text-sm font-medium text-accent"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Preview
                  </a>
                  <Link href={`/manage/events/${event.id}/edit`} className="text-sm text-ink">
                    Edit
                  </Link>
                  {canDelete({ userId: "staff", role: access.role }, event.publicationStatus) ? (
                    <DeleteRecord action={deleteEvent} id={event.id} label="Delete" />
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
        {events.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-line bg-white px-4 py-10 text-sm text-muted">
            No events match.
          </li>
        ) : null}
      </ul>
      <p className="mt-8 text-sm text-muted">
        Manage category cards, images, and PDF briefs on{" "}
        <Link href="/manage/categories" className="text-accent">
          Categories
        </Link>
        .
      </p>
    </div>
  );
}
