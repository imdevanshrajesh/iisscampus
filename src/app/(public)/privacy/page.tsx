import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How the campus archive handles public visitors and external photographs.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-5xl text-ink">Privacy</h1>
      <div className="mt-8 space-y-5 text-base leading-7">
        <p>
          Visitors can read published pages without an account. The campus archive does not ask students to create a
          password here.
        </p>
        <p>
          Photographs are loaded by your browser from the address stored with an event. If that address stops working,
          the page shows a placeholder instead of the image. Only hosts an administrator has approved can be saved as
          photographs.
        </p>
        <p>
          Drafts, unpublished results, and the content workspace are not part of the public archive. Names appear on
          achievement pages only when that record has been published.
        </p>
        <p>
          This is an independent activities archive for IISS x Student Council Boys. It is not the official school
          website.
        </p>
      </div>
    </div>
  );
}
