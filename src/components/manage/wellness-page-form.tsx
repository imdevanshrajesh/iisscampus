"use client";

import { useActionState, useState } from "react";
import { saveWellnessPageSettings, type ActionState } from "@/lib/manage/actions";
import type { WellnessPageSettings } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function WellnessPageForm({ settings }: { settings: WellnessPageSettings }) {
  const [state, action, pending] = useActionState(saveWellnessPageSettings, {} as ActionState);
  const [pageTitle, setPageTitle] = useState(settings.pageTitle);
  const [navLabel, setNavLabel] = useState(settings.navLabel);

  const missingFields: string[] = [];
  if (pageTitle.trim().length < 2) missingFields.push("Public page title (at least 2 characters)");
  if (navLabel.trim().length < 2) missingFields.push("Menu label (at least 2 characters)");

  const isFormValid = missingFields.length === 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isFormValid) {
      event.preventDefault();
      alert(`Please fill in required fields: ${missingFields.join(", ")}.`);
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="grid max-w-xl gap-3 rounded-xl border border-line p-4">
      <p className="text-sm font-medium">Page name</p>
      <label className="grid gap-1.5 text-sm">
        <span>
          Title on the public page <span className="text-red-500 font-bold">*</span>
        </span>
        <input
          name="pageTitle"
          value={pageTitle}
          onChange={(e) => setPageTitle(e.target.value)}
          required
          maxLength={80}
          className={fieldClass}
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span>
          Menu label <span className="text-red-500 font-bold">*</span>
        </span>
        <input
          name="navLabel"
          value={navLabel}
          onChange={(e) => setNavLabel(e.target.value)}
          required
          maxLength={40}
          className={fieldClass}
        />
      </label>
      {missingFields.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
          <span className="font-semibold">Required fields missing:</span> {missingFields.join(", ")}
        </div>
      )}
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
      <button
        type="submit"
        disabled={pending || !isFormValid}
        className="justify-self-start rounded-md bg-navy px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save page name"}
      </button>
    </form>
  );
}
