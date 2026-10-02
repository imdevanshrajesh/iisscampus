import { classifyNavigationUrl } from "../media/url.ts";

function originOf(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isAllowedReturnUrl(
  raw: string | null | undefined,
  siteOrigin: string,
  arigoOrigin: string | null,
) {
  if (!raw?.trim()) return false;
  if (raw.startsWith("//") || raw.includes("\\")) return false;

  const site = originOf(siteOrigin);
  const arigo = originOf(arigoOrigin);
  if (!site) return false;

  if (raw.startsWith("/") && !raw.startsWith("//")) {
    try {
      const url = new URL(raw, site);
      return url.origin === site;
    } catch {
      return false;
    }
  }

  const classified = classifyNavigationUrl(raw);
  if (!classified.ok) return false;
  const target = new URL(classified.url);
  if (target.origin === site) return true;
  if (arigo && target.origin === arigo) return true;
  return false;
}
