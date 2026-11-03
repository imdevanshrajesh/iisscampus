import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveGrokApiKey } from "../src/lib/ai/grok.ts";

describe("grok ai configuration", () => {
  it("resolves api key from parameter and env variables", () => {
    // Direct parameter resolution
    assert.equal(resolveGrokApiKey("xai-parameter-key"), "xai-parameter-key");

    // Parameter takes priority over env
    process.env.GROK_API_KEY = "xai-env-key";
    assert.equal(resolveGrokApiKey("xai-override-key"), "xai-override-key");

    // Environment variable fallback
    assert.equal(resolveGrokApiKey(), "xai-env-key");

    delete process.env.GROK_API_KEY;
    process.env.XAI_API_KEY = "xai-secondary-env-key";
    assert.equal(resolveGrokApiKey(), "xai-secondary-env-key");
    delete process.env.XAI_API_KEY;

    // Blank resolution
    assert.equal(resolveGrokApiKey("   "), null);
    assert.equal(resolveGrokApiKey(null), null);
  });
});
