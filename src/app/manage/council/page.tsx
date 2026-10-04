import Link from "next/link";
import { councilKindLabel } from "@/components/council/council-year";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { requireWorkspace } from "@/lib/manage/access";

export default async function ManageCouncilPage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;

  const years = access.workspace.councilYears.slice().sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Student council · Boys</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            One record per academic year. The sitting council is this year. Each post is a role and a name, and a photograph can be added later.
          </p>
        </div>
        <Link href="/manage/council/new" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink">
          New year
        </Link>
      </div>
      <ul className="mt-8 divide-y divide-line rounded-xl border border-line bg-background">
        {years.map((year) => (
          <li key={year.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
            <div>
              <Link href={`/manage/council/${year.id}/edit`} className="font-medium">
                {year.label}
              </Link>
              <p className="mt-1 text-sm text-muted">
                {councilKindLabel(year.kind)} · {year.publicationStatus.replace("_", " ")} · {year.members.length} posts
              </p>
            </div>
            <Link href={`/manage/council/${year.id}/edit`} className="text-sm text-accent">
              Edit
            </Link>
          </li>
        ))}
        {years.length === 0 ? (
          <li className="px-4 py-8 text-sm text-muted">No council years yet. Start with the current year.</li>
        ) : null}
      </ul>
    </div>
  );
}
