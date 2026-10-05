import { PublicMain } from "@/components/council/council-shell";
import { IntroSplash } from "@/components/home/intro-splash";
import { HomeLink, SiteChrome } from "@/components/layout/dynamic-island";
import { SiteFooter } from "@/components/layout/site-footer";
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
      <IntroSplash />
      <SiteChrome />
      <PublicMain>
        <HomeLink />
        {children}
      </PublicMain>
      <SiteFooter showSampleNote={showSampleNote} />
    </>
  );
}
