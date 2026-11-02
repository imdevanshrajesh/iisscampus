import { ManageCategoriesList } from "@/components/manage/manage-categories-list";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { requireWorkspace } from "@/lib/manage/access";

export default async function ManageCategoriesPage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;

  const categories = [...access.workspace.categories].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Taxonomy</p>
          <h1 className="text-3xl font-medium tracking-tight text-ink mt-1">Categories</h1>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
            All categories are collapsed by default. Click any category to expand, manage details, and update PDF briefs.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ManageCategoriesList categories={categories} mediaHosts={access.workspace.mediaHosts} />
      </div>
    </div>
  );
}
