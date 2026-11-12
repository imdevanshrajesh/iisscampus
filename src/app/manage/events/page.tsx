import Link from "next/link";
import { ManageEventsList } from "@/components/manage/manage-events-list";
import { ManageUnavailable } from "@/components/manage/unavailable";
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

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Content</p>
          <h1 className="font-display mt-2 text-4xl text-ink">Events</h1>
          <p className="mt-1 text-sm text-muted">
            Grouped and collapsed by status. Click any section to browse or edit.
          </p>
        </div>
        <Link href="/manage/events/new" className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink">
          New event
        </Link>
      </div>

      <div className="mt-8">
        <ManageEventsList
          events={access.workspace.events}
          role={access.role}
          initialQuery={query}
          initialStatus={status}
          activeTerm={access.workspace.activeTerm}
        />
      </div>

      <p className="mt-8 text-sm text-muted">
        Manage category cards, images, and PDF briefs on{" "}
        <Link href="/manage/categories" className="text-accent hover:underline">
          Categories
        </Link>
        .
      </p>
    </div>
  );
}
