"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/manage/actions";

export function DeleteRecord({
  action,
  id,
  label,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  id: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      {confirming ? <input type="hidden" name="confirm" value="yes" /> : null}
      {state.error ? <p className="text-sm">{state.error}</p> : null}
      {confirming ? (
        <button type="button" className="text-sm text-muted" onClick={() => setConfirming(false)} disabled={pending}>
          Cancel
        </button>
      ) : null}
      {confirming ? (
        <button type="submit" disabled={pending} className="rounded-md border border-line bg-background px-3 py-2 text-sm text-ink disabled:opacity-60">
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
