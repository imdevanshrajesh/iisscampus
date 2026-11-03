export type GrokChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GrokChatOptions = {
  apiKey?: string | null;
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

const XAI_API_ENDPOINT = "https://api.x.ai/v1/chat/completions";
export const DEFAULT_GROK_MODEL = "grok-2-latest";

export function resolveGrokApiKey(overrideKey?: string | null): string | null {
  if (overrideKey && overrideKey.trim()) {
    return overrideKey.trim();
  }
  return process.env.GROK_API_KEY || process.env.XAI_API_KEY || null;
}

export async function testGrokApiKey(
  apiKey: string,
  model = DEFAULT_GROK_MODEL,
): Promise<{ ok: boolean; message: string }> {
  try {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      return { ok: false, message: "Please provide an API key." };
    }
    const response = await fetch(XAI_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${trimmed}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Ping" }],
        max_tokens: 5,
      }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const detail =
        errorJson?.error?.message ||
        errorJson?.error ||
        `xAI returned HTTP ${response.status}: ${response.statusText}`;
      return { ok: false, message: detail };
    }

    return { ok: true, message: "Grok API key is valid and connected." };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to connect to xAI Grok API.";
    return { ok: false, message };
  }
}

export async function callGrokChat(
  messages: GrokChatMessage[],
  options: GrokChatOptions = {},
): Promise<{ ok: true; content: string } | { ok: false; error: string }> {
  const apiKey = resolveGrokApiKey(options.apiKey);
  if (!apiKey) {
    return {
      ok: false,
      error:
        "No Grok API key found. Please configure your Grok / xAI API key in the manage page or set GROK_API_KEY.",
    };
  }

  const model = options.model || DEFAULT_GROK_MODEL;
  const temperature = options.temperature ?? 0.3;
  const maxTokens = options.maxTokens ?? 2048;

  try {
    const response = await fetch(XAI_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorText =
        errorData?.error?.message ||
        errorData?.error ||
        `xAI Grok API error (${response.status} ${response.statusText})`;
      return { ok: false, error: String(errorText) };
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content ?? "";
    return { ok: true, content };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Network error contacting xAI Grok API.";
    return { ok: false, error: message };
  }
}
