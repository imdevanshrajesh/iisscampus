import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-24">
      <p className="text-sm text-accent">404</p>
      <h1 className="font-display mt-3 text-5xl text-ink">This page is not in the archive.</h1>
      <p className="mt-4 text-base leading-7 text-muted">
        The address may be mistyped, or the record is not published.
      </p>
      <Link href="/events" className="mt-8 text-sm font-medium text-accent">
        Browse events
      </Link>
    </main>
  );
}
