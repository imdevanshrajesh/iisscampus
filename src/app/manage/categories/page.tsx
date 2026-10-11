import { CategoryForm } from "@/components/manage/category-form";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { requireWorkspace } from "@/lib/manage/access";
import { classifyNavigationUrl } from "@/lib/media/url";

export default async function ManageCategoriesPage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;

  const categories = [...access.workspace.categories].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <h1 className="text-3xl font-medium tracking-tight">Categories</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
        Category cards appear on the homepage and in filters. Optional images and PDF links support briefs for each kind of activity.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <h2 className="text-lg font-medium">Add a category</h2>
          <div className="mt-4">
            <CategoryForm category={null} mediaHosts={access.workspace.mediaHosts} />
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="text-lg font-medium">Existing</h2>
          {categories.length ? (
            categories.map((category) => {
              const pdf = category.pdfUrl ? classifyNavigationUrl(category.pdfUrl) : null;
              return (
                <div key={category.id} className="space-y-3">
                  <div className="rounded-xl border border-line px-4 py-3 text-sm">
                    <p className="font-medium">{category.name}</p>
                    <p className="mt-1 text-muted">{category.description || "No description yet."}</p>
                    {pdf?.ok ? (
                      <a href={pdf.url} className="mt-2 inline-flex text-accent" rel="noopener noreferrer" target="_blank">
                        Download PDF
                      </a>
                    ) : null}
                  </div>
                  <CategoryForm category={category} mediaHosts={access.workspace.mediaHosts} />
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted">No categories yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
