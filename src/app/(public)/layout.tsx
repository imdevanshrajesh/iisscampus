import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getPublicCatalog } from "@/lib/data/queries";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  let showSampleNote = true;
  try {
    const catalog = await getPublicCatalog();
    showSampleNote = catalog.events.some((event) => event.isSample);
  } catch (error) {
    console.error(error);
  }

  return (
    <>
      <SiteHeader />
      <main id="content" className="flex-1">
        {children}
      </main>
      <SiteFooter showSampleNote={showSampleNote} />
    </>
  );
}
