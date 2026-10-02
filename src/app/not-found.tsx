import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-24">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">404</p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight">This page is not in the archive.</h1>
      <p className="mt-4 text-base leading-7 text-muted">
        The address may be mistyped, or the record is not published.
      </p>
      <Link href="/events" className="mt-8 text-sm font-medium text-accent">
        Browse events
      </Link>
    </main>
  );
}
