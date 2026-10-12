import { PublicMain } from "@/components/council/council-shell";
import { AnnouncementBar } from "@/components/home/announcement-bar";
import { IntroSplash } from "@/components/home/intro-splash";
import { HomeLink, SiteChrome } from "@/components/layout/dynamic-island";
import { SiteFooter } from "@/components/layout/site-footer";
import { defaultSocialLinks } from "@/lib/config";
import {
  getPublicAnnouncements,
  getPublicCatalog,
  getPublicSocial,
  getSiteBrand,
} from "@/lib/data/queries";
import type { Announcement, CampusEvent } from "@/lib/types";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  let showSampleNote = true;
  let social = { ...defaultSocialLinks };
  let logoUrl: string | null = null;
  let contactEmail: string | null = null;
  let announcements: Announcement[] = [];
  let events: CampusEvent[] = [];
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
        {children}
      </PublicMain>
      <SiteFooter showSampleNote={showSampleNote} social={social} contactEmail={contactEmail} />
    </>
  );
}
