import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { getPublicCatalog } from "@/lib/data/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getPublicCatalog();
  const staticRoutes = ["", "/events", "/achievements", "/gallery", "/about", "/privacy"].map((path) => ({
    url: `${siteConfig.url}${path || "/"}`,
  }));
  const events = catalog.events.map((event) => ({
    url: `${siteConfig.url}/events/${event.slug}`,
  }));
  return [...staticRoutes, ...events];
}
