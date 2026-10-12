import { PublicMain } from "@/components/council/council-shell";
import { IntroSplash } from "@/components/home/intro-splash";
import { HomeLink, SiteChrome } from "@/components/layout/dynamic-island";
import { SiteFooter } from "@/components/layout/site-footer";
import { defaultSocialLinks } from "@/lib/config";
import { getPublicCatalog, getPublicSocial, getSiteBrand } from "@/lib/data/queries";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  let showSampleNote = true;
  let social = { ...defaultSocialLinks };
  let logoUrl: string | null = null;
  let contactEmail: string | null = null;
  try {
    const [catalog, brand] = await Promise.all([getPublicCatalog(), getSiteBrand()]);
    showSampleNote = catalog.events.some((event) => event.isSample);
    social = await getPublicSocial();
    logoUrl = brand.councilLogoUrl ?? catalog.councilLogoUrl;
    contactEmail = brand.contactEmail;
  } catch (error) {
    console.error(error);
  }

  return (
    <>
      <IntroSplash logoUrl={logoUrl} />
      <SiteChrome logoUrl={logoUrl} />
      <PublicMain>
        <HomeLink />
        {children}
      </PublicMain>
      <SiteFooter showSampleNote={showSampleNote} social={social} contactEmail={contactEmail} />
    </>
  );
}
