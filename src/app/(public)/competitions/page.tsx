import type { Metadata } from "next";
import { ActivitiesBrowse, activityFiltersFromParams } from "@/components/events/activities-browse";
import { getPublicCatalog } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Competitions",
  description: "Browse published school competitions.",
  alternates: { canonical: "/competitions" },
};

export default async function CompetitionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const catalog = await getPublicCatalog();
  return (
    <ActivitiesBrowse
      listing="competition"
      kicker="Competitions"
      title="Contests on the calendar."
      intro="School competitions with the same filters and calendar as events. Move a finished competition back to events from the content desk when you want it in that list."
      basePath="/competitions"
      events={catalog.events}
      categories={catalog.categories}
      hosts={catalog.mediaHosts}
      filters={activityFiltersFromParams(params)}
    />
  );
}
