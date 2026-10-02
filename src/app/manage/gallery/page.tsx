import Link from "next/link";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { requireWorkspace } from "@/lib/manage/access";

export default async function ManageGalleryPage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <h1 className="text-3xl font-medium tracking-tight">Gallery</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
        Photographs are external links. Add, reorder, and preview them on the event itself.
      </p>
      <ul className="mt-8 divide-y divide-line rounded-xl border border-line bg-white">
        {access.workspace.events.map((event) => (
          <li key={event.id} className="flex items-center justify-between gap-4 px-4 py-4">
            <div>
              <p className="font-medium">{event.title}</p>
              <p className="text-sm text-muted">{event.images.length} image{event.images.length === 1 ? "" : "s"}</p>
            </div>
            <Link href={`/manage/events/${event.id}/edit`} className="text-sm text-accent">Edit images</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
