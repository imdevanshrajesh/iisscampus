import Link from "next/link";
import { DeleteRecord } from "@/components/manage/delete-record";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { canDelete } from "@/lib/auth/permissions";
import { deleteEvent } from "@/lib/manage/actions";
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
            <div className="flex flex-wrap items-center gap-4">
              <Link href={`/manage/events/${event.id}/edit`} className="text-sm text-accent">Edit images</Link>
              {canDelete({ userId: "staff", role: access.role }, event.publicationStatus) ? (
                <DeleteRecord action={deleteEvent} id={event.id} label="Delete" next="/manage/gallery" />
              ) : null}
            </div>
          </li>
        ))}
        {access.workspace.events.length === 0 ? (
          <li className="px-4 py-8 text-sm text-muted">No events yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
