import { WellnessCategoryForm } from "@/components/manage/wellness-category-form";
import { WellnessItemForm } from "@/components/manage/wellness-item-form";
import { WellnessPageForm } from "@/components/manage/wellness-page-form";
import { ManageUnavailable } from "@/components/manage/unavailable";
import {
  getEditableWellnessCategories,
  getEditableWellnessItems,
  getWellnessPageSettings,
} from "@/lib/data/queries";
import { requireAdministrator } from "@/lib/manage/access";

export default async function ManageWellnessPage() {
  const access = await requireAdministrator();
  if (!access.ready) return <ManageUnavailable />;
  const [settings, categories, items] = await Promise.all([
    getWellnessPageSettings(),
    getEditableWellnessCategories(),
    getEditableWellnessItems(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <h1 className="text-3xl font-medium tracking-tight">{settings.pageTitle}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Create categories first (like Awareness), then add items and pick a category from the dropdown. Items in the
        same category appear side by side on the public page.
      </p>

      <div className="mt-8">
        <WellnessPageForm settings={settings} />
      </div>

      <div className="mt-10 grid gap-4">
        <h2 className="text-lg font-medium">Categories</h2>
        <WellnessCategoryForm category={null} />
        {categories.map((category) => (
          <WellnessCategoryForm key={category.id} category={category} />
        ))}
      </div>

      <div className="mt-10 grid gap-6">
        <h2 className="text-lg font-medium">Add an item</h2>
        {!categories.length ? (
          <p className="text-sm text-muted">Add at least one category above before creating items.</p>
        ) : null}
        <WellnessItemForm item={null} categories={categories} mediaHosts={access.workspace.mediaHosts} />
        {items.length ? (
          <>
            <h2 className="mt-4 text-lg font-medium">Existing</h2>
            {items.map((item) => (
              <WellnessItemForm
                key={item.id}
                item={item}
                categories={categories}
                mediaHosts={access.workspace.mediaHosts}
              />
            ))}
          </>
        ) : (
          <p className="text-sm text-muted">No wellness items yet.</p>
        )}
      </div>
    </div>
  );
}
