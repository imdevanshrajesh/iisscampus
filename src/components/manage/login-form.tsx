"use client";

import { useActionState } from "react";
import { signIn, type ActionState } from "@/lib/manage/actions";

export function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(signIn, {} as ActionState);

  if (!configured) {
    return (
      <div className="mx-auto max-w-md px-5 py-16">
        <h1 className="text-3xl font-medium tracking-tight">Sign in is not available.</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          Connect the existing Supabase project before anyone can sign in. This form does not grant access on its own.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="text-3xl font-medium tracking-tight">Sign in</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Use an existing account that has been granted campus access. There is no public signup here.
      </p>
      <form action={action} className="mt-8 grid gap-4">
        {state.error ? <p className="text-sm">{state.error}</p> : null}
        <label className="grid gap-1.5 text-sm">
          Email
          <input name="email" type="email" autoComplete="username" required className="rounded-md border border-line bg-white px-3 py-2" />
        </label>
        <label className="grid gap-1.5 text-sm">
          Password
          <input name="password" type="password" autoComplete="current-password" required className="rounded-md border border-line bg-white px-3 py-2" />
        </label>
        <button type="submit" disabled={pending} className="rounded-md bg-ink px-4 py-2 text-sm text-white">
          {pending ? "Signing in" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
