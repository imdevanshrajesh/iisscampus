"use client";

import { useActionState } from "react";
import { saveWellnessPageSettings, type ActionState } from "@/lib/manage/actions";
import type { WellnessPageSettings } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function WellnessPageForm({ settings }: { settings: WellnessPageSettings }) {
  const [state, action, pending] = useActionState(saveWellnessPageSettings, {} as ActionState);

  return (
    <form action={action} className="grid max-w-xl gap-3 rounded-xl border border-line p-4">
      <p className="text-sm font-medium">Page name</p>
      <label className="grid gap-1.5 text-sm">
        Title on the public page
        <input name="pageTitle" defaultValue={settings.pageTitle} required className={fieldClass} />
      </label>
      <label className="grid gap-1.5 text-sm">
        Menu label
        <input name="navLabel" defaultValue={settings.navLabel} required className={fieldClass} />
      </label>
      {state.error ? <p className="text-sm">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
      <button type="submit" disabled={pending} className="justify-self-start rounded-md bg-navy px-4 py-2 text-sm text-white">
        {pending ? "Saving" : "Save page name"}
      </button>
    </form>
  );
}
