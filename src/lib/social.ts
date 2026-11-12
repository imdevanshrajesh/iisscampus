import { defaultSocialLinks } from "./config.ts";
import { classifyNavigationUrl } from "./media/url.ts";
import type { ExtraSiteLink, SocialLinks } from "./types.ts";

const LABEL_MAX = 60;
const DESCRIPTION_MAX = 240;
const EXTRA_MAX = 12;

const INSTAGRAM_RESERVED_PATHS = new Set([
  "p",
  "reel",
  "reels",
  "tv",
  "stories",
  "explore",
  "accounts",
  "direct",
  "about",
  "legal",
  "developer",
  "api",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanLabel(value: unknown, fallback: string) {
  const label = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!label || label.length > LABEL_MAX) return fallback;
  return label;
}

function cleanDescription(value: unknown, fallback: string) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.slice(0, DESCRIPTION_MAX);
}

function cleanUrl(value: unknown, fallback: string) {
  const classified = classifyNavigationUrl(String(value ?? ""));
  return classified.ok ? classified.url : fallback;
}

function safeId(value: unknown) {
  const id = String(value ?? "").trim();
  if (/^[a-zA-Z0-9-]{1,40}$/.test(id)) return id;
  return crypto.randomUUID();
}

function extraFromUnknown(value: unknown): ExtraSiteLink[] {
  if (!Array.isArray(value)) return [];
  const links: ExtraSiteLink[] = [];
  for (const item of value) {
    if (!isRecord(item) || links.length >= EXTRA_MAX) continue;
    const label = cleanLabel(item.label, "");
    const classified = classifyNavigationUrl(String(item.url ?? ""));
    if (!label || !classified.ok) continue;
    links.push({ id: safeId(item.id), label, url: classified.url });
  }
  return links;
}

export function linkHostIsInstagram(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return host === "instagram.com" || host === "instagr.am";
  } catch {
    return false;
  }
}

export function linkHostIsYouTube(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be";
  } catch {
    return false;
  }
}

export function normalizeYouTubeChannelUrl(raw: string | null | undefined): string | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  if (candidate.startsWith("@")) {
    const handle = candidate.slice(1).trim();
    if (!/^[a-zA-Z0-9._-]{2,60}$/.test(handle)) return null;
    candidate = `https://www.youtube.com/@${handle}`;
  } else if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate)) {
    candidate = `https://${candidate.replace(/^\/+/, "")}`;
  }

  const classified = classifyNavigationUrl(candidate);
  if (!classified.ok) return null;
  if (!linkHostIsYouTube(classified.url)) return null;

  try {
    const parsed = new URL(classified.url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;
    parsed.searchParams.delete("sub_confirmation");
    parsed.hash = "";
    const normalized = parsed.toString().replace(/\/+$/, "");
    return normalized;
  } catch {
    return null;
  }
}

export function youtubeSubscribeUrl(url: string): string {
  const base = normalizeYouTubeChannelUrl(url) ?? defaultSocialLinks.youtubeUrl;
  try {
    const parsed = new URL(base);
    parsed.searchParams.set("sub_confirmation", "1");
    return parsed.toString();
  } catch {
    return `${defaultSocialLinks.youtubeUrl}?sub_confirmation=1`;
  }
}

export function extractYouTubeHandle(url: string | null | undefined): string | null {
  const normalized = normalizeYouTubeChannelUrl(url);
  if (!normalized) return null;
  try {
    const parsed = new URL(normalized);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const first = parts[0];
    if (first && first.startsWith("@")) return first;
    return null;
  } catch {
    return null;
  }
}

export function extractInstagramUsername(value: string | null | undefined): string | null {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("@")) {
    const handle = trimmed.slice(1).replace(/\/+$/, "");
    if (/^[a-zA-Z0-9._]{1,30}$/.test(handle) && !INSTAGRAM_RESERVED_PATHS.has(handle.toLowerCase())) {
      return handle;
    }
    return null;
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
    ? trimmed
    : trimmed.includes("instagram.com")
      ? `https://${trimmed.replace(/^\/+/, "")}`
      : trimmed;

  try {
    const parsed = new URL(withProtocol);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (host !== "instagram.com") return null;
    const segments = parsed.pathname.split("/").filter(Boolean);
    const first = segments[0];
    if (!first || INSTAGRAM_RESERVED_PATHS.has(first.toLowerCase())) return null;
    const clean = first.replace(/^@/, "");
    return /^[a-zA-Z0-9._]{1,30}$/.test(clean) ? clean : null;
  } catch {
    return null;
  }
}

export function extractInstagramShortcode(url: string | null | undefined): string | null {
  const trimmed = String(url ?? "").trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (host !== "instagram.com" && host !== "instagr.am") return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const index = parts.findIndex((part) => part === "p" || part === "reel" || part === "reels" || part === "tv");
    if (index !== -1 && parts[index + 1]) {
      const code = parts[index + 1];
      return /^[A-Za-z0-9_-]{4,40}$/.test(code) ? code : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function canonicalInstagramPostUrl(code: string, kind: "post" | "reel" = "post"): string {
  const segment = kind === "reel" ? "reel" : "p";
  return `https://www.instagram.com/${segment}/${code}/`;
}

export type ConfiguredInstagramAccount = {
  key: "scixcom" | "campus";
  label: string;
  url: string;
  username: string | null;
  councilTag: "12th" | "11th";
};

export function resolveConfiguredInstagramAccounts(social: SocialLinks): ConfiguredInstagramAccount[] {
  return [
    {
      key: "scixcom",
      label: social.scixcomLabel || "SciXcom",
      url: social.scixcomInstagramUrl,
      username: extractInstagramUsername(social.scixcomInstagramUrl),
      councilTag: "12th",
    },
    {
      key: "campus",
      label: social.instagramLabel || "Instagram",
      url: social.instagramUrl,
      username: extractInstagramUsername(social.instagramUrl),
      councilTag: "11th",
    },
  ];
}

export function normalizeSocialLinks(input: unknown): SocialLinks {
  const record = isRecord(input) ? input : {};
  const ytNormalized = normalizeYouTubeChannelUrl(
    typeof record.youtubeUrl === "string" ? record.youtubeUrl : undefined,
  );
  return {
    schoolLabel: cleanLabel(record.schoolLabel, defaultSocialLinks.schoolLabel),
    schoolUrl: cleanUrl(record.schoolUrl, defaultSocialLinks.schoolUrl),
    instagramLabel: cleanLabel(record.instagramLabel, defaultSocialLinks.instagramLabel),
    instagramUrl: cleanUrl(record.instagramUrl, defaultSocialLinks.instagramUrl),
    scixcomLabel: cleanLabel(record.scixcomLabel, defaultSocialLinks.scixcomLabel),
    scixcomInstagramUrl: cleanUrl(record.scixcomInstagramUrl, defaultSocialLinks.scixcomInstagramUrl),
    youtubeLabel: cleanLabel(record.youtubeLabel, defaultSocialLinks.youtubeLabel),
    youtubeUrl: ytNormalized ?? defaultSocialLinks.youtubeUrl,
    youtubeDescription: cleanDescription(record.youtubeDescription, defaultSocialLinks.youtubeDescription),
    youtubeEnabled: typeof record.youtubeEnabled === "boolean" ? record.youtubeEnabled : defaultSocialLinks.youtubeEnabled,
    extraLinks: extraFromUnknown(record.extraLinks),
  };
}

function namedLink(
  labelRaw: unknown,
  urlRaw: unknown,
  fallbackLabel: string,
  fallbackUrl: string,
  name: string,
): { label: string; url: string } | { error: string } {
  const typed = String(labelRaw ?? "").replace(/\s+/g, " ").trim();
  const label = typed || fallbackLabel;
  if (label.length > LABEL_MAX) return { error: `${name} label must be ${LABEL_MAX} characters or fewer.` };
  const urlValue = String(urlRaw ?? "").trim() || fallbackUrl;
  const classified = classifyNavigationUrl(urlValue);
  if (!classified.ok) return { error: `${name} must be a valid https:// link.` };
  return { label, url: classified.url };
}

function parseExtra(raw: unknown): { links: ExtraSiteLink[] } | { error: string } {
  const text = String(raw ?? "").trim();
  if (!text) return { links: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "The extra links could not be read." };
  }
  if (!Array.isArray(parsed)) return { error: "The extra links could not be read." };
  const links: ExtraSiteLink[] = [];
  for (const item of parsed) {
    if (!isRecord(item)) return { error: "The extra links could not be read." };
    const label = String(item.label ?? "").replace(/\s+/g, " ").trim();
    const url = String(item.url ?? "").trim();
    if (!label && !url) continue;
    if (!label || !url) return { error: "Each extra link needs a label and an https:// address." };
    if (label.length > LABEL_MAX) return { error: `Link labels must be ${LABEL_MAX} characters or fewer.` };
    const classified = classifyNavigationUrl(url);
    if (!classified.ok) return { error: `“${label}” must be a valid https:// link.` };
    if (links.length >= EXTRA_MAX) return { error: `Add ${EXTRA_MAX} extra links or fewer.` };
    links.push({ id: safeId(item.id), label, url: classified.url });
  }
  return { links };
}

export function parseYouTubeSettingsInput(
  formData: FormData,
):
  | {
      youtubeLabel: string;
      youtubeUrl: string;
      youtubeDescription: string;
      youtubeEnabled: boolean;
    }
  | { error: string } {
  const rawLabel = String(formData.get("youtubeLabel") ?? "").replace(/\s+/g, " ").trim();
  const youtubeLabel = rawLabel || defaultSocialLinks.youtubeLabel;
  if (youtubeLabel.length > LABEL_MAX) {
    return { error: `YouTube label must be ${LABEL_MAX} characters or fewer.` };
  }

  const rawUrl = String(formData.get("youtubeUrl") ?? "").trim() || defaultSocialLinks.youtubeUrl;
  const youtubeUrl = normalizeYouTubeChannelUrl(rawUrl);
  if (!youtubeUrl) {
    return { error: "YouTube channel must be a valid youtube.com channel link (e.g. https://www.youtube.com/@iissboys)." };
  }

  const rawDesc = String(formData.get("youtubeDescription") ?? "").replace(/\s+/g, " ").trim();
  if (rawDesc.length > DESCRIPTION_MAX) {
    return { error: `YouTube description must be ${DESCRIPTION_MAX} characters or fewer.` };
  }
  const youtubeDescription = rawDesc || defaultSocialLinks.youtubeDescription;

  const youtubeEnabled = formData.has("youtubeFormPresent")
    ? formData.get("youtubeEnabled") === "on" || formData.get("youtubeEnabled") === "true"
    : defaultSocialLinks.youtubeEnabled;

  return {
    youtubeLabel,
    youtubeUrl,
    youtubeDescription,
    youtubeEnabled,
  };
}

export function parseSocialInput(formData: FormData): { links: SocialLinks } | { error: string } {
  const school = namedLink(
    formData.get("schoolLabel"),
    formData.get("schoolUrl"),
    defaultSocialLinks.schoolLabel,
    defaultSocialLinks.schoolUrl,
    "School website",
  );
  if ("error" in school) return school;
  const instagram = namedLink(
    formData.get("instagramLabel"),
    formData.get("instagramUrl"),
    defaultSocialLinks.instagramLabel,
    defaultSocialLinks.instagramUrl,
    "Instagram",
  );
  if ("error" in instagram) return instagram;
  const scixcom = namedLink(
    formData.get("scixcomLabel"),
    formData.get("scixcomInstagramUrl"),
    defaultSocialLinks.scixcomLabel,
    defaultSocialLinks.scixcomInstagramUrl,
    "Council account",
  );
  if ("error" in scixcom) return scixcom;
  const youtube = parseYouTubeSettingsInput(formData);
  if ("error" in youtube) return youtube;
  const extra = parseExtra(formData.get("extraLinks"));
  if ("error" in extra) return extra;
  return {
    links: {
      schoolLabel: school.label,
      schoolUrl: school.url,
      instagramLabel: instagram.label,
      instagramUrl: instagram.url,
      scixcomLabel: scixcom.label,
      scixcomInstagramUrl: scixcom.url,
      youtubeLabel: youtube.youtubeLabel,
      youtubeUrl: youtube.youtubeUrl,
      youtubeDescription: youtube.youtubeDescription,
      youtubeEnabled: youtube.youtubeEnabled,
      extraLinks: extra.links,
    },
  };
}

export type SocialFeedConfig = {
  scixcomFeedUrl: string | null;
  instagramFeedUrl: string | null;
};

export function normalizeExternalFeedUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const classified = classifyNavigationUrl(trimmed);
  if (!classified.ok || classified.host === "local") return null;
  return classified.url;
}

export function normalizeSocialFeedConfig(input: unknown): SocialFeedConfig {
  const record = isRecord(input) ? input : {};
  return {
    scixcomFeedUrl: normalizeExternalFeedUrl(record.scixcomFeedUrl),
    instagramFeedUrl: normalizeExternalFeedUrl(record.instagramFeedUrl),
  };
}

export function parseSocialFeedConfigInput(
  formData: FormData,
): { feeds: SocialFeedConfig } | { error: string } {
  const rawScixcom = String(formData.get("scixcomFeedUrl") ?? "").trim();
  const rawInstagram = String(formData.get("instagramFeedUrl") ?? "").trim();

  const scixcomFeedUrl = rawScixcom ? normalizeExternalFeedUrl(rawScixcom) : null;
  if (rawScixcom && !scixcomFeedUrl) {
    return {
      error: "SciXcom feed URL must be a valid public https:// JSON or RSS feed address.",
    };
  }

  const instagramFeedUrl = rawInstagram ? normalizeExternalFeedUrl(rawInstagram) : null;
  if (rawInstagram && !instagramFeedUrl) {
    return {
      error: "Campus account feed URL must be a valid public https:// JSON or RSS feed address.",
    };
  }

  return {
    feeds: {
      scixcomFeedUrl,
      instagramFeedUrl,
    },
  };
}
