export type AiProvider = "xai" | "openai" | "openrouter" | "gemini" | "custom";

export type ProviderConfig = {
  id: AiProvider;
  name: string;
  defaultBaseUrl: string;
  defaultModel: string;
  getModelsUrl: (baseUrl: string) => string;
  getChatUrl: (baseUrl: string) => string;
  getHeaders: (apiKey: string) => Record<string, string>;
};

export const PROVIDERS: Record<AiProvider, ProviderConfig> = {
  xai: {
    id: "xai",
    name: "xAI (Grok)",
    defaultBaseUrl: "https://api.x.ai/v1",
    defaultModel: "grok-2-latest",
    getModelsUrl: (base) => `${base.replace(/\/$/, "")}/models`,
    getChatUrl: (base) => `${base.replace(/\/$/, "")}/chat/completions`,
    getHeaders: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key.trim()}`,
    }),
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
    getModelsUrl: (base) => `${base.replace(/\/$/, "")}/models`,
    getChatUrl: (base) => `${base.replace(/\/$/, "")}/chat/completions`,
    getHeaders: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key.trim()}`,
    }),
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "x-ai/grok-2-1212",
    getModelsUrl: (base) => `${base.replace(/\/$/, "")}/models`,
    getChatUrl: (base) => `${base.replace(/\/$/, "")}/chat/completions`,
    getHeaders: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key.trim()}`,
      "HTTP-Referer": "https://campus.buildkre.com",
      "X-Title": "IISS Campus",
    }),
  },
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.0-flash",
    getModelsUrl: (base) => `${base.replace(/\/$/, "")}/models`,
    getChatUrl: (base) => `${base.replace(/\/$/, "")}/chat/completions`,
    getHeaders: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key.trim()}`,
    }),
  },
  custom: {
    id: "custom",
    name: "Custom / Local (OpenAI-compatible)",
    defaultBaseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3",
    getModelsUrl: (base) => `${base.replace(/\/$/, "")}/models`,
    getChatUrl: (base) => `${base.replace(/\/$/, "")}/chat/completions`,
    getHeaders: (key) => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (key && key.trim()) {
        headers.Authorization = `Bearer ${key.trim()}`;
      }
      return headers;
    },
  },
};

export type FetchModelsOptions = {
  provider: AiProvider;
  apiKey: string;
  baseUrl?: string | null;
};

// Filter out non-chat completion models
function isChatModel(id: string): boolean {
  const lower = id.toLowerCase();
  if (
    lower.includes("embedding") ||
    lower.includes("whisper") ||
    lower.includes("dall-e") ||
    lower.includes("tts") ||
    lower.includes("davinci") ||
    lower.includes("babbage") ||
    lower.includes("moderation")
  ) {
    return false;
  }
  return true;
}

export async function fetchProviderModels(
  options: FetchModelsOptions,
): Promise<{ ok: true; models: string[] } | { ok: false; error: string }> {
  const provider = PROVIDERS[options.provider] || PROVIDERS.xai;
  const baseUrl = options.baseUrl?.trim() || provider.defaultBaseUrl;
  const apiKey = options.apiKey?.trim() || "";

  if (options.provider !== "custom" && !apiKey) {
    return { ok: false, error: "Please provide an API key to fetch models." };
  }

  const url = provider.getModelsUrl(baseUrl);
  const headers = provider.getHeaders(apiKey);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const detail =
        errJson?.error?.message ||
        errJson?.error ||
        `HTTP ${res.status}: ${res.statusText}`;
      return { ok: false, error: `Failed to fetch models from ${provider.name}: ${detail}` };
    }

    const data = await res.json();
    let modelIds: string[] = [];

    if (Array.isArray(data.data)) {
      modelIds = data.data
        .map((m: any) => (typeof m === "string" ? m : m.id || m.name))
        .filter(Boolean);
    } else if (Array.isArray(data.models)) {
      modelIds = data.models
        .map((m: any) => (typeof m === "string" ? m : m.name || m.id))
        .filter(Boolean);
    } else if (Array.isArray(data)) {
      modelIds = data.map((m: any) => (typeof m === "string" ? m : m.id || m.name)).filter(Boolean);
    }

    // Filter chat-capable models and sort alphabetically
    const filtered = modelIds.filter(isChatModel).sort((a, b) => a.localeCompare(b));

    if (filtered.length === 0 && modelIds.length > 0) {
      return { ok: true, models: modelIds };
    }

    if (filtered.length === 0) {
      return {
        ok: false,
        error: `No models returned from ${provider.name} endpoint.`,
      };
    }

    return { ok: true, models: filtered };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: "Request timed out while contacting provider /models." };
    }
    const message = err instanceof Error ? err.message : "Network error contacting provider.";
    return { ok: false, error: message };
  }
}

export type AiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type CallAiOptions = {
  provider?: AiProvider;
  apiKey?: string | null;
  model?: string | null;
  baseUrl?: string | null;
  temperature?: number;
  maxTokens?: number;
};

export async function callAiChat(
  messages: AiChatMessage[],
  options: CallAiOptions = {},
): Promise<{ ok: true; content: string } | { ok: false; error: string }> {
  const providerKey = options.provider || "xai";
  const provider = PROVIDERS[providerKey] || PROVIDERS.xai;
  const baseUrl = options.baseUrl?.trim() || provider.defaultBaseUrl;
  const apiKey =
    options.apiKey?.trim() ||
    process.env.AI_API_KEY ||
    (providerKey === "xai"
      ? process.env.GROK_API_KEY || process.env.XAI_API_KEY
      : providerKey === "openai"
      ? process.env.OPENAI_API_KEY
      : providerKey === "openrouter"
      ? process.env.OPENROUTER_API_KEY
      : providerKey === "gemini"
      ? process.env.GEMINI_API_KEY
      : null);

  if (providerKey !== "custom" && !apiKey) {
    return {
      ok: false,
      error: `No API key configured for ${provider.name}. Please enter your key in Settings or Manage AI.`,
    };
  }

  const model = options.model?.trim() || provider.defaultModel;
  const url = provider.getChatUrl(baseUrl);
  const headers = provider.getHeaders(apiKey || "");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 2048,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorText =
        errorData?.error?.message ||
        errorData?.error ||
        `${provider.name} API error (${response.status} ${response.statusText})`;
      return { ok: false, error: String(errorText) };
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content ?? "";
    return { ok: true, content };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : `Network error contacting ${provider.name}.`;
    return { ok: false, error: message };
  }
}
