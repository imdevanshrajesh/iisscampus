import { PublicMain } from "@/components/council/council-shell";
import { AnnouncementBar } from "@/components/home/announcement-bar";
import { IntroSplash } from "@/components/home/intro-splash";
import { HomeLink, SiteChrome } from "@/components/layout/dynamic-island";
import { SiteFooter } from "@/components/layout/site-footer";
import { PreviewProvider } from "@/components/preview/preview-provider";
import { FloatingAiChat } from "@/components/ai/floating-chat";
import { defaultSocialLinks } from "@/lib/config";
import {
  getPublicMarquee,
  getPublicCatalog,
  getPublicNavGroups,
  getPublicSocial,
  getSiteBrand,
  getWellnessPageSettings,
} from "@/lib/data/queries";
import { defaultNavGroups, resolvePublicNav, withWellnessNavLabel } from "@/lib/nav";
import type { CampusEvent, Category, MarqueeMessage, PublicNavGroup } from "@/lib/types";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  let showSampleNote = true;
  let social = { ...defaultSocialLinks };
  let logoUrl: string | null = null;
  let navLogoUrl: string | null = null;
  let navLogoHref = "/";
  let navLabel = "IISS Boys";
  let contactEmail: string | null = null;
  let marquee: MarqueeMessage[] = [];
  let events: CampusEvent[] = [];
  let categories: Category[] = [];
  let hosts: string[] = [];
  let nav = withWellnessNavLabel();
  let menu: PublicNavGroup[] = resolvePublicNav(defaultNavGroups, []);
  try {
    const [catalog, brand, publicMarquee, wellness, navGroups] = await Promise.all([
      getPublicCatalog(),
      getSiteBrand(),
      getPublicMarquee(),
      getWellnessPageSettings(),
      getPublicNavGroups(),
    ]);
    showSampleNote = catalog.events.some((event) => event.isSample);
    social = await getPublicSocial();
    logoUrl = brand.councilLogoUrl ?? catalog.councilLogoUrl;
    navLogoUrl = brand.navLogoUrl;
    navLogoHref = brand.navLogoHref || "/";
    navLabel = brand.navLabel || "IISS Boys";
    contactEmail = brand.contactEmail;
    marquee = publicMarquee;
    events = catalog.events;
    categories = catalog.categories;
    hosts = catalog.mediaHosts;
    nav = withWellnessNavLabel(wellness.navLabel);
    menu = resolvePublicNav(navGroups, events, wellness.navLabel);
  } catch (error) {
    console.error(error);
  }

  return (
    <>
      <IntroSplash logoUrl={logoUrl} />
      <SiteChrome logoUrl={navLogoUrl ?? logoUrl} brandHref={navLogoHref} brandLabel={navLabel} groups={menu} />
      <PublicMain>
        <AnnouncementBar messages={marquee} events={events} />
        <PreviewProvider categories={categories} hosts={hosts} events={events}>
          {children}
        </PreviewProvider>
      </PublicMain>
      <SiteFooter showSampleNote={showSampleNote} social={social} contactEmail={contactEmail} nav={nav} />
      <FloatingAiChat />
    </>
  );
}
