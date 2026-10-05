import type { Metadata } from "next";
import { getPublicNewsletter } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Newsletter",
  description: "The monthly campus newsletter.",
  alternates: { canonical: "/newsletter" },
};

export default async function NewsletterPage() {
  const issue = await getPublicNewsletter();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <p className="kicker text-accent">Monthly</p>
      <h1 className="font-display mt-3 text-5xl text-ink md:text-6xl">Newsletter</h1>
      {issue ? (
        <a href={issue.href} target="_blank" rel="noreferrer" className="mt-10 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={issue.imageUrl} alt={issue.title} className="w-full rounded-2xl border border-line" />
          <p className="mt-4 text-sm text-ink">{issue.title}</p>
        </a>
      ) : (
        <p className="mt-8 text-sm text-muted">The next issue has not been published.</p>
      )}
    </div>
  );
}
