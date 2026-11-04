"use client";

import { useActionState, useState } from "react";
import { signIn, type ActionState } from "@/lib/manage/actions";

export function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(signIn, {} as ActionState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isFormValid) {
      event.preventDefault();
      alert("Please enter both email and password.");
    }
  }

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
      <form action={action} onSubmit={handleSubmit} className="mt-8 grid gap-4">
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <label className="grid gap-1.5 text-sm">
          <span>
            Email <span className="text-red-500 font-bold">*</span>
          </span>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            className="rounded-md border border-line bg-white px-3 py-2"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>
            Password <span className="text-red-500 font-bold">*</span>
          </span>
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="rounded-md border border-line bg-white px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={pending || !isFormValid}
          className="rounded-md bg-ink px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
