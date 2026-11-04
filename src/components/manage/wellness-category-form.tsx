"use client";

import { useActionState, useState } from "react";
import { deleteWellnessCategory, saveWellnessCategory, type ActionState } from "@/lib/manage/actions";
import type { WellnessCategory } from "@/lib/types";
import { ChevronDown, Layers, Trash2 } from "lucide-react";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function WellnessCategoryForm({ category }: { category: WellnessCategory | null }) {
  const [state, action, pending] = useActionState(saveWellnessCategory, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteWellnessCategory, {} as ActionState);
  const [isOpen, setIsOpen] = useState(!category); // Collapsed by default for existing categories
  const [name, setName] = useState(category?.name ?? "");

  const isFormValid = name.trim().length >= 2;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isFormValid) {
      event.preventDefault();
      alert("Please enter a category name (at least 2 characters).");
    }
  }

  return (
    <div className="rounded-xl border border-line bg-white shadow-xs overflow-hidden transition-all duration-200">
      {category ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left hover:bg-wash/40 transition cursor-pointer select-none border-b border-transparent data-[open=true]:border-line/70"
          data-open={isOpen}
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-700">
              <Layers size={14} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-ink truncate">
                  {name || category.name}
                </span>
                <span className="text-[10px] text-muted bg-gray-100 px-2 py-0.5 rounded-full">
                  Order #{category.sortOrder}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-navy/75 hover:text-navy hidden sm:inline">
              {isOpen ? "Close" : "Edit"}
            </span>
            <ChevronDown
              size={16}
              className={`text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </button>
      ) : null}

      <div className={`p-4 ${category && !isOpen ? "hidden" : "block"}`}>
        <form action={action} onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_6rem_auto] sm:items-end">
          {category ? <input type="hidden" name="id" value={category.id} /> : null}
          <label className="grid gap-1.5 text-sm">
            <span>
              Category name <span className="text-red-500 font-bold">*</span>
            </span>
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Awareness, Mental Health, Physical Fitness"
              required
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            Order
            <input type="number" name="sortOrder" defaultValue={category?.sortOrder ?? 0} className={fieldClass} />
          </label>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={pending || !isFormValid}
              className="rounded-md bg-navy px-4 py-2 text-sm text-white hover:bg-navy/90 transition cursor-pointer disabled:opacity-50"
            >
              {pending ? "Saving..." : category ? "Save" : "Add category"}
            </button>
            {category && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-line px-3 py-2 text-sm text-ink hover:bg-zinc-50 cursor-pointer"
              >
                Done
              </button>
            )}
          </div>
          {!isFormValid && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 sm:col-span-3">
              <span className="font-semibold">Required:</span> Category name must be at least 2 characters.
            </div>
          )}
          {state.error ? <p className="text-sm text-red-600 sm:col-span-3">{state.error}</p> : null}
          {state.ok ? <p className="text-sm text-accent sm:col-span-3">{state.ok}</p> : null}
        </form>

        {category ? (
          <form action={deleteAction} className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 mt-3.5 pt-3">
            <input type="hidden" name="id" value={category.id} />
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" name="confirm" value="yes" className="h-3.5 w-3.5 rounded border-line" />
              <span>Confirm delete category</span>
            </label>
            <button
              type="submit"
              disabled={deleting}
              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-600 hover:bg-red-100 transition cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={11} />
              <span>{deleting ? "Deleting..." : "Delete"}</span>
            </button>
            {deleteState.error ? <p className="text-xs text-red-600 w-full">{deleteState.error}</p> : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}
