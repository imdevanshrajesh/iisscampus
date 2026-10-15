import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { getPublicCatalog } from "@/lib/data/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getPublicCatalog();
  const staticRoutes = [
    "",
    "/events",
    "/competitions",
    "/council",
    "/achievements",
    "/gallery",
    "/newsletter",
    "/wellness",
    "/announcements",
    "/about",
    "/privacy",
  ].map((path) => ({
    url: `${siteConfig.url}${path || "/"}`,
  }));
  const events = catalog.events.map((event) => ({
    url: `${siteConfig.url}/events/${event.slug}`,
  }));
  const councilMembers = catalog.councilYears.flatMap((year) =>
    year.members
      .filter((member) => member.slug && member.board !== "junior")
      .map((member) => ({
        url: `${siteConfig.url}/council/${year.slug}/${member.slug}`,
      })),
  );
  return [...staticRoutes, ...events, ...councilMembers];
}
