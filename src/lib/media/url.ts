const MAX_URL_LENGTH = 2048;

const BLOCKED_IMAGE_HOSTS = new Set([
  "drive.google.com",
  "docs.google.com",
  "drive.usercontent.google.com",
  "docs.usercontent.google.com",
]);

/** Self-hosted RustFS CDN hosts trusted by default */
const BUILTIN_TRUSTED_IMAGE_HOSTS = new Set([
  "cdn.iissboys.com",
]);

export type UrlFailureCode =
  | "empty"
  | "invalid"
  | "scheme"
  | "credentials"
  | "port"
  | "host"
  | "drive"
  | "allowlist"
  | "length";

export type UrlClassification =
  | { ok: true; url: string; host: string }
  | { ok: false; code: UrlFailureCode; message: string };

function fail(code: UrlFailureCode, message: string): UrlClassification {
  return { ok: false, code, message };
}

function isIpHost(host: string) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function blockedImageHost(host: string) {
  return BLOCKED_IMAGE_HOSTS.has(host);
}

function parseHttps(raw: string): UrlClassification {
  const trimmed = raw.trim();
  if (!trimmed) {
    return fail("empty", "Enter an image URL.");
  }
  if (trimmed.length > MAX_URL_LENGTH) {
    return fail("length", "That URL is too long.");
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return fail("invalid", "Enter a valid URL.");
  }

  if (url.protocol === "javascript:" || url.protocol === "data:") {
    return fail("scheme", "That URL scheme is not allowed.");
  }

  if (url.protocol !== "https:") {
    return fail("scheme", "Image URLs must start with https://.");
  }

  if (url.username || url.password) {
    return fail("credentials", "URLs must not include a username or password.");
  }

  if (url.port) {
    return fail("port", "URLs must not include a custom port.");
  }

  const host = url.hostname.toLowerCase();
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    isIpHost(host)
  ) {
    return fail("host", "That image host is not allowed.");
  }

  url.hash = "";
  return { ok: true, url: url.toString(), host };
}

export function classifyNavigationUrl(raw: string | null | undefined): UrlClassification {
  if (!raw?.trim()) {
    return fail("empty", "Enter a URL.");
  }
  const parsed = parseHttps(raw);
  if (!parsed.ok && parsed.code === "scheme") {
    return fail("scheme", "Links must start with https://.");
  }
  return parsed;
}

export function classifyMediaUrl(
  raw: string | null | undefined,
  allowedHosts: readonly string[],
): UrlClassification {
  if (!raw?.trim()) {
    return fail("empty", "Enter an image URL.");
  }

  const parsed = parseHttps(raw);
  if (!parsed.ok) return parsed;

  if (blockedImageHost(parsed.host)) {
    return fail(
      "drive",
      "Google Drive sharing links cannot be displayed as images. Use a direct HTTPS image address from an approved host.",
    );
  }

  const allowed = new Set(allowedHosts.map((host) => host.toLowerCase()));
  if (!allowed.has(parsed.host) && !BUILTIN_TRUSTED_IMAGE_HOSTS.has(parsed.host)) {
    return fail(
      "allowlist",
      "This host is not on the approved image list. An administrator can add it in content settings.",
    );
  }

  return parsed;
}

export function normalizeMediaHost(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed.length > 253) return null;
  if (trimmed.includes("://") || trimmed.includes("/") || trimmed.includes("*")) {
    return null;
  }
  if (!/^[a-z0-9.-]+$/.test(trimmed)) return null;
  if (trimmed.startsWith(".") || trimmed.endsWith(".") || trimmed.includes("..")) {
    return null;
  }
  if (blockedImageHost(trimmed) || isIpHost(trimmed) || trimmed === "localhost") {
    return null;
  }
  return trimmed;
}

export function parseMediaHostList(raw: string) {
  const hosts: string[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const line of raw.split(/\r?\n/)) {
    const value = line.trim();
    if (!value) continue;
    const host = normalizeMediaHost(value);
    if (!host) {
      errors.push(`“${value}” is not an approved image host.`);
      continue;
    }
    if (seen.has(host)) continue;
    seen.add(host);
    hosts.push(host);
  }

  if (hosts.length > 40) {
    errors.push("Use 40 hosts or fewer.");
  }

  return { hosts: hosts.slice(0, 40), errors };
}
