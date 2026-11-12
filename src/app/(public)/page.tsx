import { HomePage } from "@/components/home/home-page";
import { getPublicAnnouncements, getPublicCatalog } from "@/lib/data/queries";
import {
  filterAchievementsForTerm,
  filterAnnouncementsForTerm,
  filterEventsForTerm,
} from "@/lib/terms";

export default async function Page() {
  const [catalog, announcements] = await Promise.all([getPublicCatalog(), getPublicAnnouncements()]);
  const termEvents = filterEventsForTerm(catalog.events, catalog.activeTerm);
  const termAchievements = filterAchievementsForTerm(catalog.achievements, catalog.activeTerm);
  const termAnnouncements = filterAnnouncementsForTerm(announcements, catalog.activeTerm);

  return (
    <HomePage
      events={termEvents}
      categories={catalog.categories}
      achievements={termAchievements}
      hosts={catalog.mediaHosts}
      logoUrl={catalog.councilLogoUrl}
      announcements={termAnnouncements}
    />
  );
}
