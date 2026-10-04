import type { Metadata } from "next";
import { CouncilYearBlock } from "@/components/council/council-year";
import { selectPublicCouncil } from "@/lib/data/catalog";
import { getPublicCatalog } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Student Council · Boys",
  description: "Photographs and notes from the boys' student council, year by year.",
  alternates: { canonical: "/council" },
};

export default async function CouncilPage() {
  const catalog = await getPublicCatalog();
  const years = selectPublicCouncil(catalog.councilYears);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <p className="text-sm text-accent">Student council · Boys</p>
      <h1 className="font-display mt-3 max-w-3xl text-5xl leading-[0.95] text-ink md:text-6xl">
        The boys who run the year.
      </h1>
      <p className="mt-5 max-w-xl text-base leading-7 text-muted">
        Photographs and short posts for the current council, the one coming in, and the years already finished. Nothing is shown here until it is published.
      </p>

      {years.length ? (
        years.map((year) => <CouncilYearBlock key={year.id} year={year} hosts={catalog.mediaHosts} />)
      ) : (
        <div className="mt-12 max-w-xl border-t border-line pt-8">
          <p className="font-display text-3xl text-ink">The page is ready.</p>
          <p className="mt-3 text-base leading-7 text-muted">
            Add a year from the content desk, attach the photographs and posts, and publish it. This year, the next council, and earlier years each have their own place.
          </p>
        </div>
      )}
    </div>
  );
}
