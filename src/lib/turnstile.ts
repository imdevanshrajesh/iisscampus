export type TurnstileVerification =
  | { success: true; hostname: string; action: string }
  | { success: false; error: string; code?: string };

export async function verifyTurnstileToken({
  token,
  expectedAction,
  clientIp,
  secret = process.env.TURNSTILE_SECRET,
  hostnames = process.env.TURNSTILE_HOSTNAMES ?? "localhost,127.0.0.1,campus.buildkre.com",
}: {
  token: unknown;
  expectedAction: string;
  clientIp?: string;
  secret?: string;
  hostnames?: string;
}): Promise<TurnstileVerification> {
  const expectedHostnames = new Set(
    hostnames
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean),
  );

  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > 2048 ||
    expectedHostnames.size === 0
  ) {
    return { success: false, error: "Missing or invalid verification token." };
  }

  if (!secret) {
    return { success: false, error: "TURNSTILE_SECRET is not configured." };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (clientIp && clientIp !== "local") {
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
      return { success: false, error: `siteverify failed (${res.status})` };
    }

    result = await res.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "siteverify network error",
    };
  }

  if (!result.success) {
    const firstCode = result["error-codes"]?.[0] ?? "unknown-error";
    return { success: false, error: "Bot verification failed.", code: firstCode };
  }

  if (result.action !== expectedAction) {
    return { success: false, error: "Turnstile action mismatch." };
  }

  if (!result.hostname || !expectedHostnames.has(result.hostname)) {
    return { success: false, error: "Turnstile hostname is not approved." };
  }

  return { success: true, hostname: result.hostname, action: result.action };
}
