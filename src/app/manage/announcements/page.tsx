import { AnnouncementForm } from "@/components/manage/announcement-form";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { getEditableAnnouncements } from "@/lib/data/queries";
import { requireAdministrator } from "@/lib/manage/access";

export default async function AnnouncementsPage() {
  const access = await requireAdministrator();
  if (!access.ready) return <ManageUnavailable />;
  const announcements = await getEditableAnnouncements();
  const events = access.workspace.events.filter((event) => event.publicationStatus === "published");

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <h1 className="text-3xl font-medium tracking-tight">Announcements</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        These are the visitor announcements on the homepage and the announcements page. The scrolling bar is edited under Marquee.
      </p>
      <div className="mt-8 grid gap-6">
        <AnnouncementForm announcement={null} events={events} />
        {announcements.map((item) => (
          <AnnouncementForm key={item.id} announcement={item} events={events} />
        ))}
      </div>
    </div>
  );
}
