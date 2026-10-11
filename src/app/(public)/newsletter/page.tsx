import type { Metadata } from "next";
import { getPublicNewsletter } from "@/lib/data/queries";
import { classifyNavigationUrl } from "@/lib/media/url";

export const metadata: Metadata = {
  title: "Newsletter",
  description: "The monthly campus newsletter.",
  alternates: { canonical: "/newsletter" },
};

export default async function NewsletterPage() {
  const issue = await getPublicNewsletter();
  const pdf = issue?.pdfUrl ? classifyNavigationUrl(issue.pdfUrl) : null;
  const href = issue?.href ? classifyNavigationUrl(issue.href) : null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <p className="kicker text-accent">Monthly</p>
      <h1 className="font-display mt-3 text-5xl text-ink md:text-6xl">Newsletter</h1>
      {issue ? (
        <div className="mt-10">
          {issue.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={issue.imageUrl} alt={issue.title} className="w-full rounded-2xl border border-line" />
          ) : null}
          <p className="mt-4 text-sm text-ink">{issue.title}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {pdf?.ok ? (
              <a
                href={pdf.url}
                className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink"
                rel="noopener noreferrer"
                target="_blank"
              >
                Download PDF
              </a>
            ) : null}
            {href?.ok ? (
              <a
                href={href.url}
                className="rounded-md border border-line px-4 py-2.5 text-sm"
                rel="noopener noreferrer"
                target="_blank"
              >
                Open issue
              </a>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted">The next issue has not been published.</p>
      )}
    </div>
  );
}
