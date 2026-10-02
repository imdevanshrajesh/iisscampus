import { EventForm } from "@/components/manage/event-form";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { requireWorkspace } from "@/lib/manage/access";

export default async function NewEventPage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8">
      <h1 className="text-3xl font-medium tracking-tight">New event</h1>
      <div className="mt-8">
        <EventForm
          event={null}
          categories={access.workspace.categories}
          events={access.workspace.events}
          role={access.role}
          mediaHosts={access.workspace.mediaHosts}
        />
      </div>
    </div>
  );
}
