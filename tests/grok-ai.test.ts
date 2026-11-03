import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveGrokApiKey } from "../src/lib/ai/grok.ts";
import { PROVIDERS, fetchProviderModels } from "../src/lib/ai/providers.ts";

describe("ai provider architecture & model fetching", () => {
  it("resolves grok api key from parameter and env variables", () => {
    assert.equal(resolveGrokApiKey("xai-parameter-key"), "xai-parameter-key");

    process.env.GROK_API_KEY = "xai-env-key";
    assert.equal(resolveGrokApiKey("xai-override-key"), "xai-override-key");
    assert.equal(resolveGrokApiKey(), "xai-env-key");

    delete process.env.GROK_API_KEY;
    process.env.XAI_API_KEY = "xai-secondary-env-key";
    assert.equal(resolveGrokApiKey(), "xai-secondary-env-key");
    delete process.env.XAI_API_KEY;

    assert.equal(resolveGrokApiKey("   "), null);
    assert.equal(resolveGrokApiKey(null), null);
  });

  it("configures all supported AI providers with correct endpoints", () => {
    const providers = ["xai", "openai", "openrouter", "gemini", "custom"] as const;

    for (const id of providers) {
      const config = PROVIDERS[id];
      assert.ok(config, `Provider ${id} must exist`);
      assert.ok(config.name, `Provider ${id} must have a name`);
      assert.ok(config.defaultBaseUrl, `Provider ${id} must have a defaultBaseUrl`);
      assert.ok(config.defaultModel, `Provider ${id} must have a defaultModel`);

      // Verify URL construction
      const modelsUrl = config.getModelsUrl(config.defaultBaseUrl);
      assert.ok(modelsUrl.endsWith("/models"), `Models URL for ${id} must end with /models`);

      const chatUrl = config.getChatUrl(config.defaultBaseUrl);
      assert.ok(chatUrl.endsWith("/chat/completions"), `Chat URL for ${id} must end with /chat/completions`);

      // Verify headers
      const headers = config.getHeaders("test-key-123");
      assert.ok(headers["Content-Type"] === "application/json");
      if (id !== "custom") {
        assert.ok(headers["Authorization"].includes("test-key-123"));
      }
    }
  });

  it("handles fetchProviderModels validation without crashing", async () => {
    // When no API key is provided for authenticated provider
    const noKeyResult = await fetchProviderModels({
      provider: "xai",
      apiKey: "",
    });
    assert.equal(noKeyResult.ok, false);
    assert.ok(noKeyResult.error?.includes("Please provide an API key"));

    // When invalid URL / unreachable host is provided
    const invalidResult = await fetchProviderModels({
      provider: "custom",
      apiKey: "dummy",
      baseUrl: "http://127.0.0.1:59999/v1",
    });
    assert.equal(invalidResult.ok, false);
  });
});
