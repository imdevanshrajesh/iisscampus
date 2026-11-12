import { notFound } from "next/navigation";
import { EventForm } from "@/components/manage/event-form";
import { DeleteRecord } from "@/components/manage/delete-record";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { canDelete } from "@/lib/auth/permissions";
import { deleteEvent } from "@/lib/manage/actions";
import { requireWorkspace } from "@/lib/manage/access";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;
  const event = access.workspace.events.find((item) => item.id === id);
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 md:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">{event.publicationStatus.replace("_", " ")}</p>
      <h1 className="font-display mt-2 text-4xl text-ink">{event.title}</h1>
      <div className="mt-8">
        <EventForm
          event={event}
          categories={access.workspace.categories}
          events={access.workspace.events}
          role={access.role}
          mediaHosts={access.workspace.mediaHosts}
          announcements={access.workspace.announcements}
          defaultAcademicYear={access.workspace.activeTerm.label}
        />
      </div>
      {canDelete({ userId: "staff", role: access.role }, event.publicationStatus) ? (
        <div className="mt-10 border-t border-line pt-6">
          <h2 className="text-lg font-medium">Delete this event</h2>
          <p className="mt-2 text-sm text-muted">This removes the event and its gallery. It cannot be undone.</p>
          <div className="mt-4">
            <DeleteRecord action={deleteEvent} id={event.id} label="Delete event" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
