import { PublicMain } from "@/components/council/council-shell";
import { AnnouncementBar } from "@/components/home/announcement-bar";
import { IntroSplash } from "@/components/home/intro-splash";
import { HomeLink, SiteChrome } from "@/components/layout/dynamic-island";
import { SiteFooter } from "@/components/layout/site-footer";
import { PreviewProvider } from "@/components/preview/preview-provider";
import { defaultSocialLinks } from "@/lib/config";
import {
  getPublicAnnouncements,
  getPublicCatalog,
  getPublicSocial,
  getSiteBrand,
} from "@/lib/data/queries";
import type { Announcement, CampusEvent, Category } from "@/lib/types";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  let showSampleNote = true;
  let social = { ...defaultSocialLinks };
  let logoUrl: string | null = null;
  let contactEmail: string | null = null;
  let announcements: Announcement[] = [];
  let events: CampusEvent[] = [];
  let categories: Category[] = [];
  let hosts: string[] = [];
  try {
    const [catalog, brand, publicAnnouncements] = await Promise.all([
      getPublicCatalog(),
      getSiteBrand(),
      getPublicAnnouncements(),
    ]);
    showSampleNote = catalog.events.some((event) => event.isSample);
    social = await getPublicSocial();
    logoUrl = brand.councilLogoUrl ?? catalog.councilLogoUrl;
    contactEmail = brand.contactEmail;
    announcements = publicAnnouncements;
    events = catalog.events;
    categories = catalog.categories;
    hosts = catalog.mediaHosts;
  } catch (error) {
    console.error(error);
  }

  return (
    <>
      <IntroSplash logoUrl={logoUrl} />
      <SiteChrome logoUrl={logoUrl} />
      <PublicMain>
        <HomeLink />
        <AnnouncementBar announcements={announcements} events={events} />
        <PreviewProvider categories={categories} hosts={hosts} events={events}>
          {children}
        </PreviewProvider>
      </PublicMain>
      <SiteFooter showSampleNote={showSampleNote} social={social} contactEmail={contactEmail} />
    </>
  );
}
