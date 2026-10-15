import { HomePage } from "@/components/home/home-page";
import { getPublicAnnouncements, getPublicCatalog } from "@/lib/data/queries";

export default async function Page() {
  const [catalog, announcements] = await Promise.all([getPublicCatalog(), getPublicAnnouncements()]);
  return (
    <HomePage
      events={catalog.events}
      categories={catalog.categories}
      achievements={catalog.achievements}
      hosts={catalog.mediaHosts}
      logoUrl={catalog.councilLogoUrl}
      announcements={announcements}
    />
  );
}
