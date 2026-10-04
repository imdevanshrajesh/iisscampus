"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/manage/actions";

export function DeleteRecord({
  action,
  id,
  label,
  next,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  id: string;
  label: string;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? <p className="text-sm">{state.error}</p> : null}
      {confirming ? (
        <button type="button" className="text-sm text-muted" onClick={() => setConfirming(false)} disabled={pending}>
          Cancel
        </button>
      ) : null}
      {confirming ? (
        <button type="submit" name="confirm" value="yes" disabled={pending} className="rounded-md border border-line bg-background px-3 py-2 text-sm text-ink disabled:opacity-60">
          {pending ? "Deleting" : "Confirm delete"}
        </button>
      ) : (
        <button type="button" className="rounded-md border border-line bg-background px-3 py-2 text-sm text-ink" onClick={() => setConfirming(true)}>
          {label}
        </button>
      )}
    </form>
  );
}
