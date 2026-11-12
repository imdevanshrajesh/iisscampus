import type { Metadata } from "next";
import { ActivitiesBrowse, activityFiltersFromParams } from "@/components/events/activities-browse";
import { ExternalCompetitions } from "@/components/events/external-competitions";
import { getPublicCatalog } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Competitions",
  description: "School competitions, and contests at other schools that students can join.",
  alternates: { canonical: "/competitions" },
};

export default async function CompetitionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const catalog = await getPublicCatalog();
  const filters = activityFiltersFromParams(params);
  return (
    <>
    <ActivitiesBrowse
      listing="competition"
      kicker="Competitions"
      title="Contests on the calendar."
      intro="Competitions this school hosts. Contests at other schools are listed further down."
      basePath="/competitions"
      events={catalog.events}
      categories={catalog.categories}
      hosts={catalog.mediaHosts}
      activeTerm={catalog.activeTerm}
      filters={filters}
    />
    <ExternalCompetitions
      events={catalog.events}
      categories={catalog.categories}
      hosts={catalog.mediaHosts}
      activeTerm={catalog.activeTerm}
      yearFilter={filters.year}
    />
    </>
  );
}
