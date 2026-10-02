"use client";

import Link from "next/link";

export default function ManageError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-24">
      <h1 className="text-3xl font-medium tracking-tight">Content tools could not be loaded.</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Sign-in is still at the login page. This screen does not show private records.
      </p>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={reset} className="rounded-md bg-navy px-4 py-2 text-sm text-white">
          Try again
        </button>
        <Link href="/manage/login" className="rounded-md border border-line px-4 py-2 text-sm">
          Sign in
        </Link>
      </div>
    </main>
  );
}
