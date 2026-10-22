export const SUGGESTION_MIN = 20;
export const SUGGESTION_MAX = 1500;
export const SUGGESTION_EMAIL_LIMIT = 3;
export const SUGGESTION_EMAIL_WINDOW_MS = 24 * 60 * 60 * 1000;
export const SUGGESTION_IP_LIMIT = 8;
export const SUGGESTION_IP_WINDOW_MS = 60 * 60 * 1000;
export const SUGGESTION_MIN_WAIT_MS = 2000;
export const SUGGESTION_MAX_AGE_MS = 2 * 60 * 60 * 1000;

const emailPattern =
  /^[a-z0-9](?:[a-z0-9._%+\-]{0,62}[a-z0-9])?@[a-z0-9](?:[a-z0-9.\-]{0,250}[a-z0-9])?\.[a-z]{2,24}$/;

const allowedDomains = new Set(["gmail.com", "iiss.ae"]);

export type Suggestion = {
  id: string;
  email: string;
  body: string;
  createdAt: string;
};

export type StoredSuggestion = Suggestion & {
  emailKey: string;
  ip: string;
};

export function normalizeSuggestionEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (email.length < 6 || email.length > 254 || !emailPattern.test(email)) return null;
  const at = email.lastIndexOf("@");
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local || local.includes("..") || domain.includes("..") || !allowedDomains.has(domain)) return null;
  return email;
}

export function suggestionRateKey(value: string) {
  const email = normalizeSuggestionEmail(value);
  if (!email) return null;
  const at = email.lastIndexOf("@");
  const domain = email.slice(at + 1);
  let local = email.slice(0, at);
  if (domain === "gmail.com") local = local.split("+")[0].replaceAll(".", "");
  if (!local) return null;
  return `${local}@${domain}`;
}

export function cleanSuggestionBody(value: string): { ok: true; body: string } | { ok: false; error: string } {
  const body = value.replace(/\s+/g, " ").trim();
  if (body.length < SUGGESTION_MIN || body.length > SUGGESTION_MAX) {
    return { ok: false, error: "Write a suggestion between 20 and 1500 characters." };
  }
  const links = body.toLowerCase().match(/https?:\/\//g)?.length ?? 0;
  if (links > 3 || /<\s*script/i.test(body) || /javascript:/i.test(body)) {
    return { ok: false, error: "Remove extra links from the suggestion and try again." };
  }
  return { ok: true, body };
}

export function suggestionTimingOk(openedAtRaw: string, now = Date.now()) {
  const openedAt = Number(openedAtRaw);
  if (!Number.isFinite(openedAt)) return false;
  const elapsed = now - openedAt;
  return elapsed >= SUGGESTION_MIN_WAIT_MS && elapsed <= SUGGESTION_MAX_AGE_MS;
}

export function suggestionWithinLimits(
  rows: { emailKey: string; ip: string; createdAt: string }[],
  emailKey: string,
  ip: string,
  now: number,
) {
  const emailHits = rows.filter(
    (row) => row.emailKey === emailKey && now - Date.parse(row.createdAt) < SUGGESTION_EMAIL_WINDOW_MS,
  ).length;
  if (emailHits >= SUGGESTION_EMAIL_LIMIT) return false;
  if (!ip) return true;
  const ipHits = rows.filter(
    (row) => row.ip === ip && now - Date.parse(row.createdAt) < SUGGESTION_IP_WINDOW_MS,
  ).length;
  return ipHits < SUGGESTION_IP_LIMIT;
}
