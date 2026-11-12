import type { Metadata } from "next";
import { ActivitiesBrowse, activityFiltersFromParams } from "@/components/events/activities-browse";
import { getPublicCatalog } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Events & Activities",
  description: "Browse published campus events and student activities.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const catalog = await getPublicCatalog();
  return (
    <ActivitiesBrowse
      listing="event"
      kicker="Events"
      title="What's happening, and what happened."
      intro="Search published activities by name, category, grade, date, or fee. Drafts stay off this page."
      basePath="/events"
      events={catalog.events}
      categories={catalog.categories}
      hosts={catalog.mediaHosts}
      activeTerm={catalog.activeTerm}
      filters={activityFiltersFromParams(params)}
    />
  );
}
