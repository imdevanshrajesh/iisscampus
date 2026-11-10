export type TurnstileVerification =
  | { success: true; hostname: string; action: string }
  | { success: false; error: string; code?: string };

const DEFAULT_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "iissboys.com",
  "www.iissboys.com",
  "campus.buildkre.com",
];

export async function verifyTurnstileToken({
  token,
  expectedAction,
  clientIp,
  clientHost,
  secret = process.env.TURNSTILE_SECRET,
  hostnames = process.env.TURNSTILE_HOSTNAMES,
}: {
  token: unknown;
  expectedAction: string;
  clientIp?: string;
  clientHost?: string;
  secret?: string;
  hostnames?: string;
}): Promise<TurnstileVerification> {
  const configuredList = (hostnames ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  const expectedHostnames = new Set<string>([
    ...DEFAULT_HOSTNAMES.map((h) => h.toLowerCase()),
    ...configuredList,
  ]);

  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > 2048 ||
    expectedHostnames.size === 0
  ) {
    return { success: false, error: "Missing or invalid verification token." };
  }

  if (!secret) {
    console.error(
      "[Turnstile] TURNSTILE_SECRET is not configured! In production (Vercel), add TURNSTILE_SECRET to your environment variables.",
    );
    return { success: false, error: "TURNSTILE_SECRET is not configured." };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  // Cloudflare documentation notes that remoteip is optional.
  // Behind edge proxies (such as Vercel), client IP headers can mismatch
  // the client IP observed by Cloudflare challenge servers, causing false rejections.
  if (clientIp && clientIp !== "local" && process.env.TURNSTILE_VERIFY_IP === "true") {
    body.set("remoteip", clientIp);
  }

  let result: {
    success?: boolean;
    action?: string;
    hostname?: string;
    "error-codes"?: string[];
  };

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body,
    });

    if (!res.ok) {
      console.error(`[Turnstile] siteverify HTTP failure (${res.status})`);
      return { success: false, error: `siteverify failed (${res.status})` };
    }

    result = await res.json();
  } catch (error) {
    console.error("[Turnstile] Network error contacting Cloudflare siteverify:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "siteverify network error",
    };
  }

  if (!result.success) {
    console.error("[Turnstile] Cloudflare siteverify rejected token:", {
      errorCodes: result["error-codes"],
      hostname: result.hostname,
    });
    const firstCode = result["error-codes"]?.[0] ?? "unknown-error";
    return { success: false, error: "Bot verification failed.", code: firstCode };
  }

  if (result.action !== expectedAction) {
    console.error(
      `[Turnstile] Action mismatch: expected "${expectedAction}", got "${result.action}"`,
    );
    return { success: false, error: "Turnstile action mismatch." };
  }

  const returnedHost = (result.hostname || "").toLowerCase().trim();
  const normalizedClean = returnedHost.replace(/^www\./, "");
  const normalizedWithWww = `www.${normalizedClean}`;

  const hostMatches =
    expectedHostnames.has(returnedHost) ||
    expectedHostnames.has(normalizedClean) ||
    expectedHostnames.has(normalizedWithWww) ||
    (Boolean(clientHost) &&
      (returnedHost === clientHost?.toLowerCase() ||
        normalizedClean === clientHost?.toLowerCase().replace(/^www\./, "")));

  if (!returnedHost || !hostMatches) {
    console.error(
      `[Turnstile] Hostname "${returnedHost}" not in approved list:`,
      Array.from(expectedHostnames),
    );
    return { success: false, error: `Turnstile hostname "${returnedHost}" is not approved.` };
  }

  return { success: true, hostname: result.hostname!, action: result.action! };
}
