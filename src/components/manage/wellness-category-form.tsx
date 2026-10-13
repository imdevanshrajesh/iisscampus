"use client";

import { useActionState } from "react";
import { deleteWellnessCategory, saveWellnessCategory, type ActionState } from "@/lib/manage/actions";
import type { WellnessCategory } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function WellnessCategoryForm({ category }: { category: WellnessCategory | null }) {
  const [state, action, pending] = useActionState(saveWellnessCategory, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteWellnessCategory, {} as ActionState);

  return (
    <div className="grid gap-3 rounded-xl border border-line p-4">
      <form action={action} className="grid gap-3 sm:grid-cols-[1fr_6rem_auto] sm:items-end">
        {category ? <input type="hidden" name="id" value={category.id} /> : null}
        <label className="grid gap-1.5 text-sm">
          Category name
          <input
            name="name"
            defaultValue={category?.name ?? ""}
            placeholder="e.g. Awareness"
            required
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          Order
          <input type="number" name="sortOrder" defaultValue={category?.sortOrder ?? 0} className={fieldClass} />
        </label>
        <button type="submit" disabled={pending} className="rounded-md bg-navy px-4 py-2 text-sm text-white">
          {pending ? "Saving" : category ? "Save" : "Add category"}
        </button>
        {state.error ? <p className="text-sm sm:col-span-3">{state.error}</p> : null}
        {state.ok ? <p className="text-sm text-accent sm:col-span-3">{state.ok}</p> : null}
      </form>
      {category ? (
        <form action={deleteAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={category.id} />
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
