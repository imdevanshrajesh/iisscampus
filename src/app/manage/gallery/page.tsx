import { ManageGalleryStudio } from "@/components/manage/manage-gallery-studio";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { requireWorkspace } from "@/lib/manage/access";

export default async function ManageGalleryPage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Media</p>
        <h1 className="font-display mt-2 text-4xl text-ink">Gallery</h1>
        <p className="mt-1 text-sm text-muted">
          Mass-upload event photographs directly to RustFS object storage and choose which images appear on the public Gallery page.
        </p>
      </div>

      <ManageGalleryStudio events={access.workspace.events} />
    </div>
  );
}
