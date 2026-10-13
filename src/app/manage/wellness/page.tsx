import { WellnessItemForm } from "@/components/manage/wellness-item-form";
import { WellnessPageForm } from "@/components/manage/wellness-page-form";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { getEditableWellnessItems, getWellnessPageSettings } from "@/lib/data/queries";
import { requireAdministrator } from "@/lib/manage/access";

export default async function ManageWellnessPage() {
  const access = await requireAdministrator();
  if (!access.ready) return <ManageUnavailable />;
  const [settings, items] = await Promise.all([getWellnessPageSettings(), getEditableWellnessItems()]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <h1 className="text-3xl font-medium tracking-tight">{settings.pageTitle}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Add posters, tips, and PDFs. Use sections to keep related items together, and order to control the sequence
        inside each section.
      </p>

      <div className="mt-8">
        <WellnessPageForm settings={settings} />
      </div>

      <div className="mt-10 grid gap-6">
        <h2 className="text-lg font-medium">Add an item</h2>
        <WellnessItemForm item={null} mediaHosts={access.workspace.mediaHosts} />
        {items.length ? (
          <>
            <h2 className="mt-4 text-lg font-medium">Existing</h2>
            {items.map((item) => (
              <WellnessItemForm key={item.id} item={item} mediaHosts={access.workspace.mediaHosts} />
            ))}
          </>
        ) : (
          <p className="text-sm text-muted">No wellness items yet.</p>
        )}
      </div>
    </div>
  );
}
