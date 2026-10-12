import { HomePage } from "@/components/home/home-page";
import { getPublicCatalog } from "@/lib/data/queries";

export default async function Page() {
  const catalog = await getPublicCatalog();
  return (
    <HomePage
      events={catalog.events}
      categories={catalog.categories}
      achievements={catalog.achievements}
      hosts={catalog.mediaHosts}
      logoUrl={catalog.councilLogoUrl}
    />
  );
}
