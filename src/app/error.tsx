"use client";

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-24">
      <h1 className="text-3xl font-medium tracking-tight">This page could not be loaded.</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Refresh the page. If it keeps happening, the content service is unavailable and the sample archive should appear instead.
      </p>
      <button type="button" onClick={reset} className="mt-6 rounded-md bg-navy px-4 py-2 text-sm text-white">
        Try again
      </button>
    </main>
  );
}
