import { EventForm } from "@/components/manage/event-form";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { requireWorkspace } from "@/lib/manage/access";

export default async function NewEventPage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 md:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Events</p>
      <h1 className="font-display mt-2 text-4xl text-ink">New event</h1>
      <div className="mt-8">
        <EventForm
          event={null}
          categories={access.workspace.categories}
          events={access.workspace.events}
          role={access.role}
          mediaHosts={access.workspace.mediaHosts}
          announcements={access.workspace.announcements}
        />
      </div>
    </div>
  );
}
