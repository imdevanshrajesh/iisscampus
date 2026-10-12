import { defaultSocialLinks } from "./config.ts";
import { classifyNavigationUrl } from "./media/url.ts";
import type { ExtraSiteLink, SocialLinks } from "./types.ts";

const LABEL_MAX = 60;
const EXTRA_MAX = 12;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanLabel(value: unknown, fallback: string) {
  const label = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!label || label.length > LABEL_MAX) return fallback;
  return label;
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

export function normalizeSocialLinks(input: unknown): SocialLinks {
  const record = isRecord(input) ? input : {};
  return {
    schoolLabel: cleanLabel(record.schoolLabel, defaultSocialLinks.schoolLabel),
    schoolUrl: cleanUrl(record.schoolUrl, defaultSocialLinks.schoolUrl),
    instagramLabel: cleanLabel(record.instagramLabel, defaultSocialLinks.instagramLabel),
    instagramUrl: cleanUrl(record.instagramUrl, defaultSocialLinks.instagramUrl),
    scixcomLabel: cleanLabel(record.scixcomLabel, defaultSocialLinks.scixcomLabel),
    scixcomInstagramUrl: cleanUrl(record.scixcomInstagramUrl, defaultSocialLinks.scixcomInstagramUrl),
    extraLinks: extraFromUnknown(record.extraLinks),
  };
}

export function linkHostIsInstagram(url: string) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "") === "instagram.com";
  } catch {
    return false;
  }
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
      extraLinks: extra.links,
    },
  };
}
