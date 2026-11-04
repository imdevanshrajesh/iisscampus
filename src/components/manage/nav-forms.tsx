"use client";

import { useActionState, useState } from "react";
import { deleteNavGroup, deleteNavItem, saveNavGroup, saveNavItem, type ActionState } from "@/lib/manage/actions";
import type { CampusEvent, NavGroup, NavItem } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function NavGroupForm({ group }: { group: NavGroup | null }) {
  const [state, action, pending] = useActionState(saveNavGroup, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteNavGroup, {} as ActionState);
  const [label, setLabel] = useState(group?.label ?? "");

  const isFormValid = label.trim().length >= 1;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isFormValid) {
      event.preventDefault();
      alert("Please fill in the required field: Label.");
    }
  }

  return (
    <div className="grid gap-4">
      <form action={action} onSubmit={handleSubmit} className="grid gap-3">
        {group ? <input type="hidden" name="id" value={group.id} /> : null}
        <label className="grid gap-1.5 text-sm">
          <span>
            Label <span className="text-red-500 font-bold">*</span>
          </span>
          <input
            name="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            maxLength={40}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          Direct link
          <input
            name="href"
            defaultValue={group?.href ?? ""}
            maxLength={300}
            placeholder="/ or /events"
            className={fieldClass}
          />
        </label>
        <p className="text-xs text-muted">Used when this label has no cards. A path such as /events, or an https:// link.</p>
        <label className="grid gap-1.5 text-sm">
          Also list
          <select name="includeListing" defaultValue={group?.includeListing ?? ""} className={fieldClass}>
            <option value="">Nothing extra</option>
            <option value="event">The next upcoming events</option>
            <option value="competition">The next upcoming competitions</option>
          </select>
        </label>
        <label className="grid max-w-32 gap-1.5 text-sm">
          Order
          <input type="number" name="sortOrder" defaultValue={group?.sortOrder ?? 0} className={fieldClass} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="enabled" defaultChecked={group?.enabled ?? true} />
          Show in the bar
        </label>
        {!isFormValid && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
            <span className="font-semibold">Required:</span> Enter a label to enable saving.
          </div>
        )}
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
        <button
          type="submit"
          disabled={pending || !isFormValid}
          className="justify-self-start rounded-md bg-navy px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {group ? "Save label" : "Add label"}
        </button>
      </form>
      {group ? (
        <form action={deleteAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={group.id} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="confirm" value="yes" />
            Confirm delete
          </label>
          <button type="submit" disabled={deleting} className="rounded-md border border-line px-3 py-1.5 text-sm">
            Delete label
          </button>
          {deleteState.error ? <p className="text-sm">{deleteState.error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}

export function NavItemForm({
  groupId,
  item,
  events,
}: {
  groupId: string;
  item: NavItem | null;
  events: CampusEvent[];
}) {
  const [state, action, pending] = useActionState(saveNavItem, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteNavItem, {} as ActionState);
  const [eventId, setEventId] = useState(item?.eventId ?? "");
  const [title, setTitle] = useState(item?.title ?? "");
  const [href, setHref] = useState(item?.href ?? "");

  const missingFields: string[] = [];
  if (!eventId) {
    if (!title.trim()) missingFields.push("Title");
    if (!href.trim()) missingFields.push("Link");
  }
  const isFormValid = missingFields.length === 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isFormValid) {
      event.preventDefault();
      alert(`Please fill in required fields: ${missingFields.join(", ")}.`);
    }
  }

  return (
    <div className="grid gap-3 rounded-lg border border-line bg-background p-3">
      <form action={action} onSubmit={handleSubmit} className="grid gap-3">
        <input type="hidden" name="groupId" value={groupId} />
        {item ? <input type="hidden" name="id" value={item.id} /> : null}
        <label className="grid gap-1.5 text-sm">
          Activity
          <select
            name="eventId"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className={fieldClass}
          >
            <option value="">Write this card yourself</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-muted">
          A chosen activity keeps its title, short line, and page. Leave it blank to write your own.
        </p>
        <label className="grid gap-1.5 text-sm">
          <span>
            Title {!eventId && <span className="text-red-500 font-bold">*</span>}
          </span>
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            className={fieldClass}
            placeholder={eventId ? "Optional: overrides event title" : "Required when no activity is selected"}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          Short line
          <input name="description" defaultValue={item?.description ?? ""} maxLength={160} className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>
            Link {!eventId && <span className="text-red-500 font-bold">*</span>}
          </span>
          <input
            name="href"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            maxLength={300}
            placeholder={eventId ? "/gallery (optional override)" : "/gallery or https://"}
            className={fieldClass}
          />
        </label>
        <label className="grid max-w-32 gap-1.5 text-sm">
          Order
          <input type="number" name="sortOrder" defaultValue={item?.sortOrder ?? 0} className={fieldClass} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="enabled" defaultChecked={item?.enabled ?? true} />
          Show this card
        </label>
        {missingFields.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
            <span className="font-semibold">Required without an activity:</span> {missingFields.join(", ")}
          </div>
        )}
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
        <button
          type="submit"
          disabled={pending || !isFormValid}
          className="justify-self-start rounded-md bg-navy px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {item ? "Save card" : "Add card"}
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
            Delete card
          </button>
          {deleteState.error ? <p className="text-sm">{deleteState.error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
