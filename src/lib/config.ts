import { classifyNavigationUrl } from "@/lib/media/url";

const PRODUCTION_ORIGIN = "https://campus.buildkre.com";

function read(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function absoluteHttps(value: string | undefined) {
  if (!value) return null;
  const classified = classifyNavigationUrl(value);
  return classified.ok ? classified.url : null;
}

export function resolveSiteUrl() {
  const candidate = read("NEXT_PUBLIC_SITE_URL");
  if (!candidate) return PRODUCTION_ORIGIN;
  try {
    const withProtocol = /^https?:\/\//i.test(candidate)
      ? candidate
      : `https://${candidate}`;
    const url = new URL(withProtocol);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return PRODUCTION_ORIGIN;
    }
    return url.origin;
  } catch {
    return PRODUCTION_ORIGIN;
  }
}

export const siteConfig = {
  name: "IISSCampus",
  description:
    "A digital archive of student activities, events, achievements, and campus life at India International School, Sharjah.",
  url: resolveSiteUrl(),
  officialSchoolUrl: "https://iiss.ae",
  arigoUrl: absoluteHttps(read("NEXT_PUBLIC_ARIGO_URL")) ?? "https://arigo.buildkre.com",
  instagramUrl: absoluteHttps(read("NEXT_PUBLIC_INSTAGRAM_URL")),
  contactUrl: absoluteHttps(read("NEXT_PUBLIC_CONTACT_URL")),
};

export function isSupabaseConfigured() {
  return Boolean(
    read("NEXT_PUBLIC_SUPABASE_URL") && read("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}

export function getSupabasePublicEnv() {
  const url = read("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = read("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export const campusAuthCookie = {
  name: "iisscampus-auth",
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
