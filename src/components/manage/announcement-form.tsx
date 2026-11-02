"use client";

import { useActionState, useState } from "react";
import { Bell, ChevronDown, ChevronRight, Paperclip, Plus } from "lucide-react";
import { ResourceRepeater } from "@/components/manage/resource-repeater";
import { deleteAnnouncement, saveAnnouncement, type ActionState } from "@/lib/manage/actions";
import type { Announcement, CampusEvent, ContentResource } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function AnnouncementForm({
  announcement,
  events,
  defaultEventId,
  isOpen: controlledOpen,
  onToggle,
}: {
  announcement: Announcement | null;
  events: CampusEvent[];
  defaultEventId?: string | null;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggle = onToggle ?? (() => setInternalOpen((prev) => !prev));

  const [state, action, pending] = useActionState(saveAnnouncement, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteAnnouncement, {} as ActionState);
  const [resources, setResources] = useState<ContentResource[]>(announcement?.resources ?? []);

  const linkedEvent = events.find((ev) => ev.id === announcement?.eventId);

  return (
    <div>
      {/* Collapsible Accordion Header */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-white hover:bg-[#fbfaf4] transition cursor-pointer select-none border-b border-transparent data-[open=true]:border-line"
        data-open={isOpen}
      >
        {announcement === null ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/5 text-navy">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">New Campus Announcement / Bulletin</h2>
              <p className="text-xs text-muted">Click to draft and issue a new announcement or event notice</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${
                announcement.enabled ? "bg-emerald-500" : "bg-muted"
              }`}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-ink truncate">{announcement.title}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    announcement.enabled ? "bg-emerald-500/10 text-emerald-700" : "bg-muted/15 text-muted"
                  }`}
                >
                  {announcement.enabled ? "Active" : "Hidden"}
                </span>
                {linkedEvent ? (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent truncate max-w-[200px]">
                    📍 {linkedEvent.title}
                  </span>
                ) : null}
                {resources.length > 0 ? (
                  <span className="flex items-center gap-1 text-[11px] text-muted">
                    <Paperclip className="h-3 w-3" />
                    {resources.length}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-muted truncate max-w-xl">
                {announcement.body || "No additional text."}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-muted shrink-0 pl-3">
          <span className="text-xs font-medium">{isOpen ? "Close" : announcement ? "Edit" : "Open"}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-accent transition-transform" />
          ) : (
            <ChevronRight className="h-4 w-4 transition-transform" />
          )}
        </div>
      </button>

      {/* Expanded Form Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 pt-3 bg-[#faf9f5]/50 border-t border-line/40 grid gap-4">
          <form action={action} className="grid gap-3">
            {announcement ? <input type="hidden" name="id" value={announcement.id} /> : null}
            <input
              type="hidden"
              name="resources"
              value={JSON.stringify(resources.filter((item) => item.title.trim()))}
            />
            <label className="grid gap-1.5 text-sm">
              Title
              <input
                name="title"
                defaultValue={announcement?.title ?? ""}
                required
                maxLength={200}
                className={fieldClass}
                placeholder="Summer camp registration or Inter-School fixture brief"
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
              <select
                name="eventId"
                defaultValue={announcement?.eventId ?? defaultEventId ?? ""}
                className={fieldClass}
              >
                <option value="">None (General campus bulletin)</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="enabled" defaultChecked={announcement?.enabled ?? true} />
              Show on site (active)
            </label>
            {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
            {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
            <button
              type="submit"
              disabled={pending}
              className="justify-self-start rounded-md bg-navy px-4 py-2 text-sm text-white transition hover:bg-navy/90"
            >
              {pending ? "Saving..." : announcement ? "Save changes" : "Add announcement"}
            </button>
          </form>
          {announcement ? (
            <form action={deleteAction} className="flex flex-wrap items-center gap-3 border-t border-line/60 pt-3">
              <input type="hidden" name="id" value={announcement.id} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="confirm" value="yes" />
                Confirm delete
              </label>
              <button
                type="submit"
                disabled={deleting}
                className="rounded-md border border-line bg-white px-3 py-1.5 text-sm text-muted hover:text-red-600 transition"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
              {deleteState.error ? <p className="text-sm text-red-600">{deleteState.error}</p> : null}
            </form>
          ) : null}
        </div>
      )}
    </div>
  );
}
