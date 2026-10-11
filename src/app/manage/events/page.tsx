import Link from "next/link";
import { DeleteRecord } from "@/components/manage/delete-record";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { canDelete } from "@/lib/auth/permissions";
import { deleteEvent } from "@/lib/manage/actions";
import { requireWorkspace } from "@/lib/manage/access";

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
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-3xl font-medium tracking-tight">Events</h1>
        <Link href="/manage/events/new" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink">New event</Link>
      </div>
      <form method="get" className="mt-6 flex flex-wrap gap-3">
        <input name="q" defaultValue={query} placeholder="Search" aria-label="Search events" className="rounded-md border border-line bg-background px-3 py-2 text-sm" />
        <select name="status" defaultValue={status} aria-label="Publication status" className="rounded-md border border-line bg-background px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="in_review">In review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <button type="submit" className="rounded-md border border-line bg-background px-4 py-2 text-sm">Filter</button>
      </form>
      <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-background">
        {events.map((event) => (
          <li key={event.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
            <div>
              <Link href={`/manage/events/${event.id}/edit`} className="font-medium">{event.title}</Link>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">{event.publicationStatus.replace("_", " ")}</p>
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
              <Link href={`/manage/events/${event.id}/edit`} className="text-sm text-ink">Edit</Link>
              {canDelete({ userId: "staff", role: access.role }, event.publicationStatus) ? (
                <DeleteRecord action={deleteEvent} id={event.id} label="Delete" />
              ) : null}
            </div>
          </li>
        ))}
        {events.length === 0 ? <li className="px-4 py-8 text-sm text-muted">No events match.</li> : null}
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
