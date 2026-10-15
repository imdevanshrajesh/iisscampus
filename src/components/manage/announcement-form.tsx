"use client";

import { useActionState, useState } from "react";
import { ResourceRepeater } from "@/components/manage/resource-repeater";
import { deleteAnnouncement, saveAnnouncement, type ActionState } from "@/lib/manage/actions";
import type { Announcement, CampusEvent, ContentResource } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function AnnouncementForm({
  announcement,
  events,
}: {
  announcement: Announcement | null;
  events: CampusEvent[];
}) {
  const [state, action, pending] = useActionState(saveAnnouncement, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteAnnouncement, {} as ActionState);
  const [resources, setResources] = useState<ContentResource[]>(announcement?.resources ?? []);

  return (
    <div className="grid gap-4 rounded-xl border border-line p-4">
      <form action={action} className="grid gap-3">
        {announcement ? <input type="hidden" name="id" value={announcement.id} /> : null}
        <input type="hidden" name="resources" value={JSON.stringify(resources.filter((item) => item.title.trim()))} />
        <label className="grid gap-1.5 text-sm">
          Title
          <input
            name="title"
            defaultValue={announcement?.title ?? ""}
            required
            maxLength={200}
            className={fieldClass}
            placeholder="Summer camp registration"
          />
        </label>
        <p className="text-xs text-muted">Formatting: **bold**, *italic*, and [label](https://link).</p>
        <label className="grid gap-1.5 text-sm">
          Details
          <textarea
            name="body"
            defaultValue={announcement?.body ?? ""}
            rows={5}
            maxLength={8000}
            className={fieldClass}
            placeholder="Full announcement text shown when visitors open the card."
          />
        </label>
        <ResourceRepeater resources={resources} onChange={setResources} />
        <label className="grid gap-1.5 text-sm">
          Linked activity
          <select name="eventId" defaultValue={announcement?.eventId ?? ""} className={fieldClass}>
            <option value="">None</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="enabled" defaultChecked={announcement?.enabled ?? true} />
          Show on site
        </label>
        {state.error ? <p className="text-sm">{state.error}</p> : null}
        {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
        <button type="submit" disabled={pending} className="justify-self-start rounded-md bg-navy px-4 py-2 text-sm text-white">
          {announcement ? "Save" : "Add announcement"}
        </button>
      </form>
      {announcement ? (
        <form action={deleteAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={announcement.id} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="confirm" value="yes" />
            Confirm delete
          </label>
          <button type="submit" disabled={deleting} className="rounded-md border border-line px-3 py-1.5 text-sm">
            Delete
          </button>
          {deleteState.error ? <p className="text-sm">{deleteState.error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
