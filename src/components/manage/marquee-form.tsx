"use client";

import { useActionState } from "react";
import { deleteMarquee, saveMarquee, type ActionState } from "@/lib/manage/actions";
import type { CampusEvent, MarqueeMessage } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function MarqueeForm({
  item,
  events,
}: {
  item: MarqueeMessage | null;
  events: CampusEvent[];
}) {
  const [state, action, pending] = useActionState(saveMarquee, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteMarquee, {} as ActionState);

  return (
    <div className="grid gap-4 rounded-xl border border-line p-4">
      <form action={action} className="grid gap-3">
        {item ? <input type="hidden" name="id" value={item.id} /> : null}
        <label className="grid gap-1.5 text-sm">
          Message
          <textarea
            name="message"
            defaultValue={item?.message ?? ""}
            rows={3}
            required
            maxLength={500}
            className={fieldClass}
            placeholder="**Summer Camp** registration closes tomorrow. [Register](https://example.com)"
          />
        </label>
        <p className="text-xs text-muted">Formatting: **bold**, *italic*, and [label](https://link).</p>
        <label className="grid gap-1.5 text-sm">
          Linked activity
          <select name="eventId" defaultValue={item?.eventId ?? ""} className={fieldClass}>
            <option value="">None</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid max-w-32 gap-1.5 text-sm">
          Order
          <input type="number" name="sortOrder" defaultValue={item?.sortOrder ?? 0} className={fieldClass} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="enabled" defaultChecked={item?.enabled ?? true} />
          Show in the scrolling bar
        </label>
        {state.error ? <p className="text-sm">{state.error}</p> : null}
        {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
        <button type="submit" disabled={pending} className="justify-self-start rounded-md bg-navy px-4 py-2 text-sm text-white">
          {item ? "Save" : "Add message"}
        </button>
      </form>
      {item ? (
        <form action={deleteAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={item.id} />
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
