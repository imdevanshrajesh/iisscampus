import { ManageAnnouncementsList } from "@/components/manage/manage-announcements-list";
import { ManageUnavailable } from "@/components/manage/unavailable";
import {
  getEditableAnnouncements,
  getEditableCustomPrograms,
  getPublicWellnessItems,
} from "@/lib/data/queries";
import { requireAdministrator } from "@/lib/manage/access";

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams?: Promise<{ eventId?: string; edit?: string }>;
}) {
  const access = await requireAdministrator();
  if (!access.ready) return <ManageUnavailable />;
  const params = searchParams ? await searchParams : {};
  const defaultEventId = params?.eventId ?? null;
  const initialEditId = params?.edit ?? null;

  const [announcements, programs, wellnessItems] = await Promise.all([
    getEditableAnnouncements(),
    getEditableCustomPrograms(),
    getPublicWellnessItems(),
  ]);
  const events = access.workspace.events.filter((event) => event.publicationStatus === "published");

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Official Circulars, Directives &amp; Articles</p>
          <h1 className="text-3xl font-medium tracking-tight text-ink mt-1">Notices &amp; Posts</h1>
          <p className="mt-1 text-sm leading-6 text-muted">
            Publish circulars, directives, safety policies, or blog posts with PDF attachments and linked wellness or awareness programs.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ManageAnnouncementsList
          announcements={announcements}
          events={events}
          programs={programs}
          wellnessItems={wellnessItems}
          defaultEventId={defaultEventId}
          initialEditId={initialEditId}
        />
      </div>
    </div>
  );
}
