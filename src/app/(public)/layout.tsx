import { HomeLink, SiteChrome } from "@/components/layout/dynamic-island";
import { SiteFooter } from "@/components/layout/site-footer";
import { campusPulse } from "@/lib/data/catalog";
import { getPublicCatalog } from "@/lib/data/queries";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  let showSampleNote = true;
  let pulse = campusPulse([]);
  try {
    const catalog = await getPublicCatalog();
    showSampleNote = catalog.events.some((event) => event.isSample);
    pulse = campusPulse(catalog.events);
  } catch (error) {
    console.error(error);
  }

  return (
    <>
      <SiteChrome pulse={pulse} />
      <main id="content" className="flex-1 pb-24 pt-20 md:pb-0 md:pt-24">
        <HomeLink />
        {children}
      </main>
      <SiteFooter showSampleNote={showSampleNote} />
    </>
  );
}
