import {
  canonicalInstagramPostUrl,
  extractInstagramShortcode,
  extractYouTubeHandle,
  normalizeExternalFeedUrl,
  normalizeYouTubeChannelUrl,
  type ConfiguredInstagramAccount,
} from "./social.ts";
import type { SocialPost } from "./types.ts";

export type SocialPullSource = "graph_api" | "feed" | "public_profile";

export type PulledInstagramItem = {
  code: string;
  kind: "post" | "reel";
  instagramUrl: string;
  caption: string | null;
  thumbnailUrl: string | null;
  publishedOn: string | null;
  username: string;
};

export type InstagramFetchResult =
  | {
      ok: true;
      items: PulledInstagramItem[];
      profileFound: boolean;
      source: SocialPullSource;
    }
  | {
      ok: false;
      reason: string;
      source: SocialPullSource;
      blockedByAuthOrRateLimit?: boolean;
    };

export type SocialPullAccountInput = {
  account: ConfiguredInstagramAccount;
  result: InstagramFetchResult;
};

export type PlannedSocialDraft = {
  code: string;
  kind: "post" | "reel";
  instagramUrl: string;
  caption: string | null;
  thumbnailUrl: string | null;
  pinned: false;
  sortOrder: number;
  councilTag: string;
  academicYear: string | null;
  publishedOn: string;
};

export type SocialPullAccountSummary = {
  key: ConfiguredInstagramAccount["key"];
  label: string;
  username: string | null;
  councilTag: ConfiguredInstagramAccount["councilTag"];
  source?: SocialPullSource;
  ok: boolean;
  error?: string;
  fetchedCount: number;
  addedCount: number;
  skippedCount: number;
};

export type YouTubeVideoItem = {
  videoId: string;
  title: string;
  url: string;
  published: string;
  thumbnailUrl: string;
};

export type YouTubeChannelOverview = {
  channelId: string | null;
  title: string | null;
  handle: string | null;
  avatarUrl: string | null;
  subscriberText: string | null;
  videos: YouTubeVideoItem[];
};

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const MAX_CAPTION_LENGTH = 2200;
const MAX_THUMBNAIL_BYTES = 8 * 1024 * 1024;

function cleanCaption(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length <= MAX_CAPTION_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_CAPTION_LENGTH - 3).trimEnd()}...`;
}

export function parseInstagramDateFromAccessibility(caption: unknown): string | null {
  if (typeof caption !== "string" || !caption) return null;
  const match = /\bon ([A-Z][a-z]+)\s+(\d{1,2}),\s+(\d{4})\b/.exec(caption);
  if (!match) return null;
  const monthIdx = MONTHS[match[1].toLowerCase()];
  if (monthIdx === undefined) return null;
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (!Number.isInteger(day) || day < 1 || day > 31 || !Number.isInteger(year) || year < 2010 || year > 2100) {
    return null;
  }
  const timestamp = Date.UTC(year, monthIdx, day, 12, 0, 0);
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function unixSecondsToIso(value: unknown): string | null {
  const num = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(num) || num <= 1_000_000_000) return null;
  const date = new Date(num * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractNodeThumbnail(node: Record<string, unknown>): string | null {
  const candidates: unknown[] = [
    node.display_uri,
    node.display_url,
    node.thumbnail_src,
    node.thumbnail_url,
  ];
  if (isRecord(node.image_versions2) && Array.isArray(node.image_versions2.candidates)) {
    const first = node.image_versions2.candidates[0];
    if (isRecord(first)) candidates.push(first.url);
  }
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.startsWith("https://")) {
      return candidate;
    }
  }
  return null;
}

function extractNodeCaption(node: Record<string, unknown>): string | null {
  if (isRecord(node.caption) && typeof node.caption.text === "string") {
    return cleanCaption(node.caption.text);
  }
  if (typeof node.caption === "string") {
    return cleanCaption(node.caption);
  }
  if (isRecord(node.edge_media_to_caption) && Array.isArray(node.edge_media_to_caption.edges)) {
    const firstEdge = node.edge_media_to_caption.edges[0];
    if (isRecord(firstEdge) && isRecord(firstEdge.node) && typeof firstEdge.node.text === "string") {
      return cleanCaption(firstEdge.node.text);
    }
  }
  return null;
}

function normalizeMediaNode(raw: unknown, fallbackUsername: string): PulledInstagramItem | null {
  if (!isRecord(raw)) return null;
  const rawCode = raw.code ?? raw.shortcode;
  if (typeof rawCode !== "string") return null;
  const code = rawCode.trim();
  if (!/^[A-Za-z0-9_-]{4,40}$/.test(code)) return null;

  const isReel =
    raw.product_type === "clips" ||
    raw.__typename === "XIGPolarisVideoMedia" ||
    raw.__typename === "GraphVideo" ||
    raw.media_type === 2 ||
    raw.is_video === true;
  const kind: "post" | "reel" = isReel ? "reel" : "post";

  const user = isRecord(raw.user) && typeof raw.user.username === "string"
    ? raw.user.username
    : isRecord(raw.owner) && typeof raw.owner.username === "string"
      ? raw.owner.username
      : fallbackUsername;

  const publishedOn =
    unixSecondsToIso(raw.taken_at) ??
    unixSecondsToIso(raw.taken_at_timestamp) ??
    parseInstagramDateFromAccessibility(raw.accessibility_caption);

  return {
    code,
    kind,
    instagramUrl: canonicalInstagramPostUrl(code, kind),
    caption: extractNodeCaption(raw),
    thumbnailUrl: extractNodeThumbnail(raw),
    publishedOn,
    username: user,
  };
}

function collectMediaNodes(obj: unknown, fallbackUsername: string, out: PulledInstagramItem[], seenCodes: Set<string>) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      collectMediaNodes(item, fallbackUsername, out, seenCodes);
    }
    return;
  }

  const record = obj as Record<string, unknown>;
  if ("node" in record && isRecord(record.node)) {
    const parsed = normalizeMediaNode(record.node, fallbackUsername);
    if (parsed && !seenCodes.has(parsed.code)) {
      seenCodes.add(parsed.code);
      out.push(parsed);
    }
  } else if (("code" in record || "shortcode" in record) && ("media_type" in record || "__typename" in record || "display_url" in record || "display_uri" in record)) {
    const parsed = normalizeMediaNode(record, fallbackUsername);
    if (parsed && !seenCodes.has(parsed.code)) {
      seenCodes.add(parsed.code);
      out.push(parsed);
    }
  }

  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      collectMediaNodes(value, fallbackUsername, out, seenCodes);
    }
  }
}

export function parseInstagramProfileHtml(
  html: string,
  fallbackUsername: string,
): {
  items: PulledInstagramItem[];
  hasProfilePayload: boolean;
  hasErrorPage: boolean;
  isPrivate: boolean;
  requiresLogin: boolean;
} {
  const items: PulledInstagramItem[] = [];
  const seenCodes = new Set<string>();
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;

  let hasProfilePayload = false;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html)) !== null) {
    const body = match[1]?.trim();
    if (!body || body[0] !== "{") continue;
    if (
      !body.includes("polaris_ordered_timeline_connection") &&
      !body.includes("edge_owner_to_timeline_media") &&
      !body.includes("xdt_api__v1__feed__user_timeline_graphql_connection") &&
      !body.includes("xig_user_by_username")
    ) {
      continue;
    }

    try {
      const parsed = JSON.parse(body);
      if (body.includes("xig_user_by_username") || body.includes("polaris_ordered_timeline_connection") || body.includes("edge_owner_to_timeline_media")) {
        hasProfilePayload = true;
      }
      collectMediaNodes(parsed, fallbackUsername, items, seenCodes);
    } catch {
      // Ignore malformed script blocks
    }
  }

  const hasErrorPage = html.includes("PolarisErrorRoot") || html.includes("Sorry, this page isn&#39;t available");
  const isPrivate = /"is_private"\s*:\s*true/i.test(html);
  const requiresLogin =
    !hasProfilePayload &&
    items.length === 0 &&
    (html.includes('id="loginForm"') || html.includes('"/accounts/login/'));

  return {
    items,
    hasProfilePayload,
    hasErrorPage,
    isPrivate,
    requiresLogin,
  };
}

export function parseInstagramWebProfileJson(
  json: unknown,
  fallbackUsername: string,
): { items: PulledInstagramItem[]; isPrivate: boolean } {
  const items: PulledInstagramItem[] = [];
  const seenCodes = new Set<string>();
  collectMediaNodes(json, fallbackUsername, items, seenCodes);
  const isPrivate =
    isRecord(json) &&
    isRecord(json.data) &&
    isRecord(json.data.user) &&
    json.data.user.is_private === true;
  return { items, isPrivate };
}

function parseIsoDate(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const parsed = Date.parse(raw.trim());
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

function stripHtmlTags(raw: string): string {
  return decodeXmlEntities(raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseInstagramGraphApiJson(json: unknown, fallbackUsername: string): PulledInstagramItem[] {
  if (!isRecord(json) || !Array.isArray(json.data)) return [];
  const items: PulledInstagramItem[] = [];
  const seenCodes = new Set<string>();

  for (const entry of json.data) {
    if (!isRecord(entry)) continue;
    const permalink = typeof entry.permalink === "string" ? entry.permalink.trim() : "";
    const code = extractInstagramShortcode(permalink);
    if (!code || seenCodes.has(code)) continue;
    seenCodes.add(code);

    const productType = typeof entry.media_product_type === "string" ? entry.media_product_type.toUpperCase() : "";
    const kind: "post" | "reel" =
      productType === "REELS" || /\/(?:reel|reels)\//i.test(permalink) ? "reel" : "post";

    const rawThumb =
      typeof entry.thumbnail_url === "string" && entry.thumbnail_url.startsWith("https://")
        ? entry.thumbnail_url
        : typeof entry.media_url === "string" && entry.media_url.startsWith("https://")
          ? entry.media_url
          : null;

    items.push({
      code,
      kind,
      instagramUrl: canonicalInstagramPostUrl(code, kind),
      caption: cleanCaption(entry.caption),
      thumbnailUrl: rawThumb,
      publishedOn: parseIsoDate(entry.timestamp),
      username: fallbackUsername,
    });
  }

  return items;
}

function extractBeholdThumbnail(entry: Record<string, unknown>): string | null {
  if (isRecord(entry.sizes)) {
    for (const key of ["large", "medium", "full", "small"]) {
      const size = entry.sizes[key];
      if (isRecord(size) && typeof size.mediaUrl === "string" && size.mediaUrl.startsWith("https://")) {
        return size.mediaUrl;
      }
    }
  }
  for (const field of ["thumbnailUrl", "mediaUrl", "image", "image_url"]) {
    const val = entry[field];
    if (typeof val === "string" && val.startsWith("https://")) return val;
  }
  if (Array.isArray(entry.attachments)) {
    for (const att of entry.attachments) {
      if (isRecord(att) && typeof att.url === "string" && att.url.startsWith("https://")) {
        return att.url;
      }
    }
  }
  return null;
}

export function parseExternalSocialFeed(rawBody: string, fallbackUsername: string): PulledInstagramItem[] {
  const trimmed = rawBody.trim();
  if (!trimmed) return [];
  const items: PulledInstagramItem[] = [];
  const seenCodes = new Set<string>();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      const list = Array.isArray(parsed)
        ? parsed
        : isRecord(parsed) && Array.isArray(parsed.posts)
          ? parsed.posts
          : isRecord(parsed) && Array.isArray(parsed.items)
            ? parsed.items
            : isRecord(parsed) && Array.isArray(parsed.data)
              ? parsed.data
              : [];

      for (const entry of list) {
        if (!isRecord(entry)) continue;
        const candidateUrl =
          typeof entry.permalink === "string"
            ? entry.permalink
            : typeof entry.url === "string"
              ? entry.url
              : typeof entry.external_url === "string"
                ? entry.external_url
                : typeof entry.link === "string"
                  ? entry.link
                  : "";
        const code = extractInstagramShortcode(candidateUrl);
        if (!code || seenCodes.has(code)) continue;
        seenCodes.add(code);

        const isReel =
          entry.isReel === true ||
          String(entry.mediaProductType ?? entry.media_product_type ?? "").toUpperCase() === "REELS" ||
          /\/(?:reel|reels)\//i.test(candidateUrl);
        const kind: "post" | "reel" = isReel ? "reel" : "post";

        const rawCaption =
          entry.prunedCaption ??
          entry.caption ??
          entry.content_text ??
          entry.summary ??
          (typeof entry.content_html === "string" ? stripHtmlTags(entry.content_html) : null) ??
          entry.title;

        items.push({
          code,
          kind,
          instagramUrl: canonicalInstagramPostUrl(code, kind),
          caption: cleanCaption(rawCaption),
          thumbnailUrl: extractBeholdThumbnail(entry),
          publishedOn: parseIsoDate(entry.timestamp ?? entry.date_published ?? entry.publishedAt ?? entry.pubDate),
          username: fallbackUsername,
        });
      }
      return items;
    } catch {
      return [];
    }
  }

  // XML RSS 2.0 / Atom fallback
  const blockRegex = /<(?:item|entry)\b[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(trimmed)) !== null) {
    const block = match[1];
    const linkMatch =
      /<link[^>]+href="([^"]+)"/i.exec(block)?.[1] ??
      /<link[^>]*>([\s\S]*?)<\/link>/i.exec(block)?.[1] ??
      /<guid[^>]*>([\s\S]*?)<\/guid>/i.exec(block)?.[1] ??
      "";
    const candidateUrl = stripHtmlTags(linkMatch);
    const code = extractInstagramShortcode(candidateUrl);
    if (!code || seenCodes.has(code)) continue;
    seenCodes.add(code);

    const kind: "post" | "reel" = /\/(?:reel|reels)\//i.test(candidateUrl) ? "reel" : "post";
    const rawDesc =
      /<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i.exec(block)?.[1] ??
      /<description[^>]*>([\s\S]*?)<\/description>/i.exec(block)?.[1] ??
      /<summary[^>]*>([\s\S]*?)<\/summary>/i.exec(block)?.[1] ??
      /<title[^>]*>([\s\S]*?)<\/title>/i.exec(block)?.[1] ??
      "";
    const cleanedDesc = cleanCaption(stripHtmlTags(rawDesc));

    const thumbMatch =
      /<media:thumbnail[^>]+url="([^"]+)"/i.exec(block)?.[1] ??
      /<media:content[^>]+url="([^"]+)"/i.exec(block)?.[1] ??
      /<enclosure[^>]+type="image\/[^"]*"[^>]+url="([^"]+)"/i.exec(block)?.[1] ??
      /<enclosure[^>]+url="([^"]+)"[^>]+type="image\/[^"]*"/i.exec(block)?.[1] ??
      /<img[^>]+src=["']([^"']+)["']/i.exec(decodeXmlEntities(rawDesc))?.[1] ??
      null;

    const pubRaw =
      /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(block)?.[1] ??
      /<published[^>]*>([\s\S]*?)<\/published>/i.exec(block)?.[1] ??
      /<updated[^>]*>([\s\S]*?)<\/updated>/i.exec(block)?.[1] ??
      "";

    items.push({
      code,
      kind,
      instagramUrl: canonicalInstagramPostUrl(code, kind),
      caption: cleanedDesc,
      thumbnailUrl: thumbMatch && thumbMatch.startsWith("https://") ? decodeXmlEntities(thumbMatch) : null,
      publishedOn: parseIsoDate(stripHtmlTags(pubRaw)),
      username: fallbackUsername,
    });
  }

  return items;
}

async function fetchInstagramGraphMedia(accessToken: string, username: string): Promise<InstagramFetchResult> {
  try {
    const endpoint =
      "https://graph.instagram.com/v21.0/me/media?fields=id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp&limit=25";
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      return {
        ok: false,
        source: "graph_api",
        reason: `Instagram Graph API returned HTTP ${response.status} for @${username}. Verify the access token hasn't expired.`,
      };
    }
    const json: unknown = await response.json();
    const items = parseInstagramGraphApiJson(json, username);
    return { ok: true, items, profileFound: true, source: "graph_api" };
  } catch {
    return {
      ok: false,
      source: "graph_api",
      reason: `Could not reach Instagram Graph API for @${username}.`,
    };
  }
}

async function fetchExternalSocialFeed(feedUrl: string, username: string): Promise<InstagramFetchResult> {
  const safeUrl = normalizeExternalFeedUrl(feedUrl);
  if (!safeUrl) {
    return {
      ok: false,
      source: "feed",
      reason: `Invalid Feed URL for @${username}. Use a public https:// JSON or RSS feed link.`,
    };
  }

  try {
    const response = await fetch(safeUrl, {
      headers: {
        "User-Agent": "iisscampus/1.0 (+https://iissboys.com)",
        Accept: "application/json, application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9",
      },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      return {
        ok: false,
        source: "feed",
        reason: `Feed URL for @${username} returned HTTP ${response.status}. Check the feed link in Auto-pull Feed setup.`,
      };
    }
    const body = await response.text();
    const items = parseExternalSocialFeed(body, username);
    if (items.length === 0) {
      return {
        ok: false,
        source: "feed",
        reason: `Feed for @${username} returned no Instagram posts or reels. Verify it is an active Instagram JSON (e.g. Behold) or RSS feed.`,
      };
    }
    return { ok: true, items, profileFound: true, source: "feed" };
  } catch {
    return {
      ok: false,
      source: "feed",
      reason: `Could not fetch the configured feed URL for @${username}.`,
    };
  }
}

export async function fetchInstagramProfilePosts(
  username: string,
  options?: { accessToken?: string | null; feedUrl?: string | null },
): Promise<InstagramFetchResult> {
  const cleanUser = username.trim().replace(/^@/, "");
  if (!cleanUser) {
    return { ok: false, source: "public_profile", reason: "Invalid Instagram account handle." };
  }

  const token = options?.accessToken?.trim();
  if (token) {
    return fetchInstagramGraphMedia(token, cleanUser);
  }

  const feedUrl = options?.feedUrl?.trim();
  if (feedUrl) {
    return fetchExternalSocialFeed(feedUrl, cleanUser);
  }

  const profileUrl = `https://www.instagram.com/${encodeURIComponent(cleanUser)}/`;

  try {
    const response = await fetch(profileUrl, {
      headers: {
        "User-Agent": "iisscampus/1.0 (+https://iissboys.com)",
        Accept: "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });

    if (response.status === 429) {
      return {
        ok: false,
        source: "public_profile",
        blockedByAuthOrRateLimit: true,
        reason: `Instagram rate-limited unauthenticated requests for @${cleanUser}. Connect a Feed URL (e.g. Behold JSON / RSS) or Instagram Graph API token in Feed setup for reliable 1-click sync.`,
      };
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location") ?? "";
      const isLoginGate = location.includes("/accounts/login") || location.includes("/challenge");
      return {
        ok: false,
        source: "public_profile",
        blockedByAuthOrRateLimit: true,
        reason: isLoginGate
          ? `Instagram requires login to view @${cleanUser} from this server. Connect a Feed URL (e.g. Behold JSON / RSS) or Graph API token below.`
          : `Instagram redirected @${cleanUser} (HTTP ${response.status}). Connect a Feed URL or Graph API token below.`,
      };
    }

    if (response.status === 404) {
      return {
        ok: false,
        source: "public_profile",
        reason: `@${cleanUser} could not be found on Instagram. Check the handle in Settings.`,
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        source: "public_profile",
        blockedByAuthOrRateLimit: true,
        reason: `Instagram returned HTTP ${response.status} for @${cleanUser}. Connect a Feed URL or Graph API token below.`,
      };
    }

    const html = await response.text();
    const parsed = parseInstagramProfileHtml(html, cleanUser);
    if (parsed.items.length > 0) {
      return { ok: true, items: parsed.items, profileFound: true, source: "public_profile" };
    }
    if (parsed.isPrivate) {
      return {
        ok: false,
        source: "public_profile",
        blockedByAuthOrRateLimit: true,
        reason: `@${cleanUser} is private. Connect a Feed URL or official Graph API token below to import its posts.`,
      };
    }
    if (parsed.hasProfilePayload && !parsed.hasErrorPage) {
      return { ok: true, items: [], profileFound: true, source: "public_profile" };
    }
    if (parsed.requiresLogin) {
      return {
        ok: false,
        source: "public_profile",
        blockedByAuthOrRateLimit: true,
        reason: `Instagram requested login for @${cleanUser}. Connect a Feed URL (e.g. Behold JSON / RSS) or Graph API token below.`,
      };
    }
    if (parsed.hasErrorPage) {
      return {
        ok: false,
        source: "public_profile",
        blockedByAuthOrRateLimit: true,
        reason: `@${cleanUser} is not accessible to logged-out requests on Instagram. Connect a Feed URL (e.g. Behold JSON / RSS) or Graph API token below, or verify the handle in Settings.`,
      };
    }
  } catch {
    return {
      ok: false,
      source: "public_profile",
      reason: `Could not reach Instagram for @${cleanUser} right now.`,
    };
  }

  return {
    ok: false,
    source: "public_profile",
    blockedByAuthOrRateLimit: true,
    reason: `Instagram did not return public posts for @${cleanUser}. Connect a Feed URL (e.g. Behold JSON / RSS) or Graph API token below.`,
  };
}

function normalizeUrlForDedup(url: string): string {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${host}${path}`;
  } catch {
    return url.trim().replace(/\/+$/, "");
  }
}

export function planSocialPullDrafts({
  existingPosts,
  accountsResults,
  activeTermLabel,
  now = new Date(),
}: {
  existingPosts: Array<Pick<SocialPost, "instagramUrl">>;
  accountsResults: SocialPullAccountInput[];
  activeTermLabel?: string | null;
  now?: Date;
}): {
  draftsToCreate: PlannedSocialDraft[];
  skippedExistingCount: number;
  accountSummaries: SocialPullAccountSummary[];
} {
  const seenCodes = new Set<string>();
  const seenUrls = new Set<string>();

  for (const post of existingPosts) {
    const code = extractInstagramShortcode(post.instagramUrl);
    if (code) seenCodes.add(code);
    if (post.instagramUrl) seenUrls.add(normalizeUrlForDedup(post.instagramUrl));
  }

  const draftsToCreate: PlannedSocialDraft[] = [];
  const accountSummaries: SocialPullAccountSummary[] = [];
  let skippedExistingCount = 0;
  let fallbackIndex = 0;

  for (const { account, result } of accountsResults) {
    if (!result.ok) {
      accountSummaries.push({
        key: account.key,
        label: account.label,
        username: account.username,
        councilTag: account.councilTag,
        source: result.source,
        ok: false,
        error: result.reason,
        fetchedCount: 0,
        addedCount: 0,
        skippedCount: 0,
      });
      continue;
    }

    let addedCount = 0;
    let skippedCount = 0;

    for (const item of result.items) {
      const normalizedUrl = normalizeUrlForDedup(item.instagramUrl);
      if (seenCodes.has(item.code) || seenUrls.has(normalizedUrl)) {
        skippedCount += 1;
        skippedExistingCount += 1;
        continue;
      }

      seenCodes.add(item.code);
      seenUrls.add(normalizedUrl);
      const publishedOn =
        item.publishedOn ?? new Date(now.getTime() - fallbackIndex * 1000).toISOString();
      fallbackIndex += 1;

      draftsToCreate.push({
        code: item.code,
        kind: item.kind,
        instagramUrl: item.instagramUrl,
        caption: item.caption,
        thumbnailUrl: item.thumbnailUrl,
        pinned: false,
        sortOrder: 0,
        councilTag: account.councilTag,
        academicYear: activeTermLabel ?? null,
        publishedOn,
      });
      addedCount += 1;
    }

    accountSummaries.push({
      key: account.key,
      label: account.label,
      username: account.username,
      councilTag: account.councilTag,
      source: result.source,
      ok: true,
      fetchedCount: result.items.length,
      addedCount,
      skippedCount,
    });
  }

  return {
    draftsToCreate,
    skippedExistingCount,
    accountSummaries,
  };
}

export async function mirrorInstagramThumbnail(
  thumbnailUrl: string | null,
  code: string,
): Promise<string | null> {
  const safeImageUrl = normalizeExternalFeedUrl(thumbnailUrl);
  if (!safeImageUrl) return null;

  try {
    const response = await fetch(safeImageUrl, {
      headers: {
        "User-Agent": "iisscampus/1.0 (+https://iissboys.com)",
        Accept: "image/*",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;

    const rawContentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    const mimeType =
      rawContentType === "image/png" ||
      rawContentType === "image/webp" ||
      rawContentType === "image/gif" ||
      rawContentType === "image/jpeg"
        ? rawContentType
        : rawContentType === "image/jpg"
          ? "image/jpeg"
          : null;
    if (!mimeType) return null;

    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer.byteLength || arrayBuffer.byteLength > MAX_THUMBNAIL_BYTES) return null;

    const ext =
      mimeType === "image/png"
        ? ".png"
        : mimeType === "image/webp"
          ? ".webp"
          : mimeType === "image/gif"
            ? ".gif"
            : ".jpg";

    const buffer = Buffer.from(arrayBuffer);
    const filename = `ig-${code}${ext}`;

    const rustfs = await import("./media/rustfs.ts");
    if (rustfs.isRustFSConfigured()) {
      const uploaded = await rustfs.uploadObjectToRustFS({
        buffer,
        filename,
        mimeType,
        folder: "Socials",
      });
      return uploaded.url;
    }

    if (process.env.VERCEL) {
      return null;
    }

    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const cleanFilename = rustfs.sanitizeFileName(filename);
    const uploadDir = path.join(process.cwd(), "public", "uploads", "Socials");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, cleanFilename), buffer);
    return `/uploads/Socials/${cleanFilename}`;
  } catch {
    return null;
  }
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function parseYouTubeRssXml(xml: string): YouTubeVideoItem[] {
  const videos: YouTubeVideoItem[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match: RegExpExecArray | null;
  while ((match = entryRegex.exec(xml)) !== null && videos.length < 6) {
    const entry = match[1];
    const videoId = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(entry)?.[1]?.trim();
    const rawTitle = /<title>([^<]+)<\/title>/.exec(entry)?.[1]?.trim();
    const published = /<published>([^<]+)<\/published>/.exec(entry)?.[1]?.trim() ?? "";
    const thumb =
      /<media:thumbnail[^>]+url="([^"]+)"/.exec(entry)?.[1]?.trim() ??
      (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "");
    if (!videoId || !rawTitle) continue;
    videos.push({
      videoId,
      title: decodeXmlEntities(rawTitle),
      url: `https://www.youtube.com/watch?v=${videoId}`,
      published,
      thumbnailUrl: thumb,
    });
  }
  return videos;
}

export function parseYouTubeChannelHtml(html: string, channelUrl: string): Omit<YouTubeChannelOverview, "videos"> {
  const handle = extractYouTubeHandle(channelUrl);
  const channelId =
    /"externalId":"(UC[a-zA-Z0-9_-]+)"/.exec(html)?.[1] ??
    /"channelId":"(UC[a-zA-Z0-9_-]+)"/.exec(html)?.[1] ??
    null;
  const metaTitle =
    /"channelMetadataRenderer":\{"title":"([^"]+)"/.exec(html)?.[1] ??
    /<meta property="og:title" content="([^"]+)"/.exec(html)?.[1]?.replace(/\s*-\s*YouTube$/i, "") ??
    null;
  const avatarUrl =
    /<meta property="og:image" content="(https:\/\/[^"]+)"/.exec(html)?.[1] ?? null;
  const subscriberText =
    /"subscriberCountText":\{"content":"([^"]*subscriber[^"]*)"/i.exec(html)?.[1] ??
    /"subscriberCountText":\{"simpleText":"([^"]*subscriber[^"]*)"/i.exec(html)?.[1] ??
    null;

  return {
    channelId,
    title: metaTitle ? decodeXmlEntities(metaTitle) : null,
    handle,
    avatarUrl,
    subscriberText,
  };
}

export async function fetchYouTubeChannelOverview(rawUrl: string): Promise<YouTubeChannelOverview | null> {
  const normalized = normalizeYouTubeChannelUrl(rawUrl);
  if (!normalized) return null;

  try {
    const response = await fetch(normalized, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const html = await response.text();
    const overview = parseYouTubeChannelHtml(html, normalized);
    let videos: YouTubeVideoItem[] = [];

    if (overview.channelId && /^UC[a-zA-Z0-9_-]{10,}$/.test(overview.channelId)) {
      try {
        const rss = await fetch(
          `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(overview.channelId)}`,
          {
            next: { revalidate: 3600 },
            signal: AbortSignal.timeout(2500),
          },
        );
        if (rss.ok) {
          videos = parseYouTubeRssXml(await rss.text());
        }
      } catch {
        // Channel has no feed or timed out
      }
    }

    return {
      ...overview,
      videos,
    };
  } catch {
    return null;
  }
}
