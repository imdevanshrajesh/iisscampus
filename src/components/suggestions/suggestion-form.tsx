"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitSuggestion, type SuggestionActionState } from "@/lib/suggestions/actions";
import { TurnstileWidget } from "@/components/turnstile/turnstile-widget";

const fieldClass = "rounded-md border border-line bg-background px-3 py-2 text-base text-ink";

export function SuggestionForm() {
  const [state, action, pending] = useActionState(submitSuggestion, {} as SuggestionActionState);
  const openedAt = useRef<HTMLInputElement>(null);
  const startedAt = useRef("");

  useEffect(() => {
    if (!startedAt.current) startedAt.current = String(Date.now());
    if (openedAt.current) openedAt.current.value = startedAt.current;
  }, [state]);

  return (
    <form
      action={action}
      className="relative mt-8 grid max-w-xl gap-4"
      onSubmit={() => {
        if (openedAt.current && startedAt.current) openedAt.current.value = startedAt.current;
      }}
    >
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input ref={openedAt} type="hidden" name="openedAt" defaultValue="" />
      {state.error ? <p className="text-sm text-ink">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-ink">{state.ok}</p> : null}
      <label className="grid gap-1.5 text-sm">
        Email
        <input name="email" type="email" autoComplete="email" required maxLength={254} className={fieldClass} />
      </label>
      <label className="grid gap-1.5 text-sm">
        Suggestion
        <textarea name="suggestion" required minLength={20} maxLength={1500} rows={6} className={fieldClass} />
      </label>
      <p className="text-sm leading-6 text-muted">Use a @gmail.com or @iiss.ae address. A name is not needed.</p>
      <TurnstileWidget action="suggestion" resetKey={state} />
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink disabled:opacity-60"
      >
        {pending ? "Sending" : "Send suggestion"}
      </button>
    </form>
  );
}
