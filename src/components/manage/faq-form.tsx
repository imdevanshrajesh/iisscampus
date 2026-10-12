"use client";

import { useActionState } from "react";
import { deleteFaq, saveFaq, type ActionState } from "@/lib/manage/actions";
import type { Faq } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function FaqForm({ faq }: { faq: Faq | null }) {
  const [state, action, pending] = useActionState(saveFaq, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteFaq, {} as ActionState);

  return (
    <div className="grid gap-4 rounded-xl border border-line p-4">
      <form action={action} className="grid gap-3">
        {faq ? <input type="hidden" name="id" value={faq.id} /> : null}
        <label className="grid gap-1.5 text-sm">
          Question
          <input name="question" defaultValue={faq?.question ?? ""} required className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm">
          Answer
          <textarea name="answer" defaultValue={faq?.answer ?? ""} rows={5} required className={fieldClass} />
        </label>
        <label className="grid max-w-32 gap-1.5 text-sm">
          Order
          <input type="number" name="sortOrder" defaultValue={faq?.sortOrder ?? 0} className={fieldClass} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={faq?.published ?? true} />
          Published
        </label>
        {state.error ? <p className="text-sm">{state.error}</p> : null}
        {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
        <button type="submit" disabled={pending} className="justify-self-start rounded-md bg-navy px-4 py-2 text-sm text-white">
          {faq ? "Save" : "Add FAQ"}
        </button>
      </form>
      {faq ? (
        <form action={deleteAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={faq.id} />
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
