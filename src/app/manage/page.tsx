import Link from "next/link";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { requireWorkspace } from "@/lib/manage/access";

export default async function ManageHomePage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;

  const counts = access.workspace.events.reduce(
    (summary, event) => {
      summary[event.publicationStatus] += 1;
      return summary;
    },
    { draft: 0, in_review: 0, published: 0, archived: 0 },
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <h1 className="text-3xl font-medium tracking-tight">Content</h1>
      <p className="mt-2 text-sm text-muted">Signed in as {access.role}.</p>
      <dl className="mt-8 grid gap-4 sm:grid-cols-4">
        {(
          [
            ["Drafts", counts.draft],
            ["In review", counts.in_review],
            ["Published", counts.published],
            ["Archived", counts.archived],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-background p-4">
            <dt className="text-xs uppercase tracking-[0.14em] text-muted">{label}</dt>
            <dd className="mt-2 text-3xl font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <Link href="/manage/events/new" className="mt-8 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink">
        New event
      </Link>
    </div>
  );
}
