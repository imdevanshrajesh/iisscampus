"use client";

import { useActionState, useRef, useState } from "react";
import { FormAutoSave } from "@/components/manage/form-auto-save";
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
  const [message, setMessage] = useState(item?.message ?? "");
  const [clientError, setClientError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isFormValid = message.trim().length >= 2;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!isFormValid) {
      e.preventDefault();
      setClientError("Please enter a marquee message (at least 2 characters) before saving.");
      return;
    }
    setClientError(null);
  };

  return (
    <div className="grid gap-4 rounded-xl border border-line p-4">
      <form ref={formRef} action={action} onSubmit={handleSubmit} noValidate className="grid gap-3">
        {item ? <input type="hidden" name="id" value={item.id} /> : null}
        <FormAutoSave
          formRef={formRef}
          draftKey={item ? `marquee:${item.id}` : "marquee:new"}
          serverAction={saveMarquee}
          recordId={item?.id ?? ""}
          canAutoSaveServer={Boolean(item?.id && message.trim())}
          externalSuccess={state?.ok}
          externalError={state?.error}
          compact
          watchValue={{ message }}
          onRestoreDraft={(fields) => {
            if (fields.message?.[0] !== undefined) setMessage(fields.message[0]);
          }}
        />
        {clientError ? <p className="rounded-xl border border-red-300 bg-red-50 text-red-900 px-4 py-3 text-sm font-medium">{clientError}</p> : null}
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          <span>Message <span className="text-red-500 font-bold" title="Required">*</span></span>
          <textarea
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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
        {state.error ? <p className="text-sm text-red-600 font-medium">{state.error}</p> : null}
        {state.ok ? <p className="text-sm text-accent font-medium">{state.ok}</p> : null}

        {!isFormValid && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200/80 px-3 py-2 text-xs text-amber-900">
            <span className="font-bold shrink-0">Required (*):</span>
            <span>Enter a message (min 2 characters) to save.</span>
          </div>
        )}

        <button
          type="submit"
          disabled={pending || !isFormValid}
          className="justify-self-start rounded-md bg-navy px-4 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
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
