import { classifyNavigationUrl } from "./media/url.ts";
import type { SocialLinks } from "./types.ts";

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

export const defaultSocialLinks: SocialLinks = {
  schoolLabel: "iiss.ae",
  schoolUrl: "https://iiss.ae",
  instagramLabel: "Instagram",
  instagramUrl: "https://www.instagram.com/iisscampus/",
  scixcomLabel: "SciXcom",
  scixcomInstagramUrl: "https://www.instagram.com/scixcom.27/",
  extraLinks: [],
};

const emailPattern = /^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$/i;

export function normalizeContactEmail(value: string | null | undefined) {
  const email = value?.trim().toLowerCase() ?? "";
  if (!email || !emailPattern.test(email)) return null;
  return email;
}

/** Builds a mailto: link for About and the footer when an admin contact email is set. */
export function contactMailto(email: string | null | undefined) {
  const normalized = normalizeContactEmail(email);
  return normalized ? `mailto:${normalized}` : null;
}

export const siteConfig = {
  name: "IISS x Student Council Boys",
  shortName: "IISS x Student Council Boys",
  description:
    "A digital archive of student activities, events, achievements, and campus life for IISS x Student Council Boys.",
  url: resolveSiteUrl(),
  officialSchoolUrl: defaultSocialLinks.schoolUrl,
  arigoUrl: absoluteHttps(read("NEXT_PUBLIC_ARIGO_URL")),
  instagramUrl: absoluteHttps(read("NEXT_PUBLIC_INSTAGRAM_URL")),
  contactUrl: absoluteHttps(read("NEXT_PUBLIC_CONTACT_URL")),
};

function supabaseProjectUrl(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim().replace(/^['"]+|['"]+$/g, "");
  if (!trimmed || /\s/.test(trimmed)) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname || !url.hostname.includes(".")) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function isSupabaseConfigured() {
  return getSupabasePublicEnv() !== null;
}

export function getSupabasePublicEnv() {
  const url = supabaseProjectUrl(read("NEXT_PUBLIC_SUPABASE_URL"));
  const anonKey = read("NEXT_PUBLIC_SUPABASE_ANON_KEY")?.replace(/^['"]+|['"]+$/g, "");
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export const campusAuthCookie = {
  name: "iisscampus-auth",
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
