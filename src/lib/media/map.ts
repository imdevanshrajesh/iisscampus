const COORD = "-?\\d{1,3}(?:\\.\\d+)?";
const PLACE_PIN = new RegExp(`!3d(${COORD})!4d(${COORD})`, "g");
const CAMERA = new RegExp(`@(${COORD}),(${COORD})(?:,(\\d+(?:\\.\\d+)?)z)?`);
const PAIR = new RegExp(`^(${COORD}),\\s*(${COORD})$`);

function hostName(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function isGoogleMapsHost(hostname: string) {
  const host = hostName(hostname);
  return host === "google.com" || host === "maps.google.com";
}

function isShortMapHost(hostname: string) {
  const host = hostName(hostname);
  return host === "maps.app.goo.gl" || host === "goo.gl";
}

function embedPoint(lat: string, lng: string, zoom?: string | null) {
  const parsed = zoom ? Number(zoom) : 16;
  const z = Number.isFinite(parsed) && parsed >= 1 && parsed <= 21 ? Math.round(parsed) : 16;
  return `https://maps.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=${z}&output=embed`;
}

function embedQuery(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const pair = trimmed.match(PAIR);
  if (pair) return embedPoint(pair[1], pair[2]);
  return `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`;
}

/** Turns a Google Maps link into an embed that pins that place. The venue name is not used. */
export function mapEmbedSrc(mapUrl: string | null | undefined) {
  const raw = mapUrl?.trim();
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || !isGoogleMapsHost(url.hostname)) return null;

  if (url.pathname.includes("/embed") || url.searchParams.get("output") === "embed") {
    return url.toString();
  }

  const decoded = `${url.pathname}${url.search}`;
  const pins = [...decoded.matchAll(new RegExp(PLACE_PIN.source, "g"))];
  const pin = pins.at(-1);
  const camera = decoded.match(CAMERA);
  if (pin) return embedPoint(pin[1], pin[2], camera?.[3]);
  if (camera) return embedPoint(camera[1], camera[2], camera[3]);

  const query =
    url.searchParams.get("q") ||
    url.searchParams.get("query") ||
    url.searchParams.get("ll") ||
    url.searchParams.get("center");
  if (query) {
    const zoom = url.searchParams.get("z");
    const pair = query.trim().match(PAIR);
    if (pair) return embedPoint(pair[1], pair[2], zoom);
    return embedQuery(query);
  }

  const place = url.pathname.match(/\/(?:place|search)\/([^/@]+)/);
  if (place?.[1]) {
    const name = decodeURIComponent(place[1]).replace(/\+/g, " ").trim();
    if (name) return embedQuery(name);
  }

  return null;
}

function isShortMapLink(url: URL) {
  if (url.protocol !== "https:") return false;
  const host = hostName(url.hostname);
  if (host === "maps.app.goo.gl") return true;
  return host === "goo.gl" && url.pathname.startsWith("/maps");
}

/**
 * Share links such as maps.app.goo.gl hide the place. Follow those redirects
 * so the saved link still pins the school. Any other link is left unchanged.
 */
export async function expandMapUrl(raw: string | null, fetchImpl: typeof fetch = fetch) {
  if (!raw) return null;

  let current: URL;
  try {
    current = new URL(raw);
  } catch {
    return raw;
  }
  if (!isShortMapLink(current)) return raw;

  const original = current.toString();
  for (let hop = 0; hop < 5; hop += 1) {
    let response: Response;
    try {
      response = await fetchImpl(current.toString(), {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(4000),
        headers: { Accept: "text/html" },
      });
    } catch {
      return original;
    }

    const location = response.headers.get("location");
    if (!location || response.status < 300 || response.status >= 400) {
      return mapEmbedSrc(current.toString()) ? current.toString() : original;
    }

    let next: URL;
    try {
      next = new URL(location, current);
    } catch {
      return original;
    }
    if (next.protocol !== "https:") return original;
    const host = hostName(next.hostname);
    if (!isGoogleMapsHost(host) && !isShortMapHost(host)) return original;
    if (next.toString().length > 2048) return original;
    current = next;
    if (mapEmbedSrc(current.toString())) return current.toString();
  }

  return mapEmbedSrc(current.toString()) ? current.toString() : original;
}
