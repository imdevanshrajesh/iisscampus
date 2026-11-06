import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { verifyTurnstileToken } from "../src/lib/turnstile.ts";

describe("turnstile verification", () => {
  it("rejects invalid or missing tokens without network call", async () => {
    const emptyResult = await verifyTurnstileToken({
      token: "",
      expectedAction: "suggestion",
      secret: "dummy-secret",
    });
    assert.equal(emptyResult.success, false);

    const nullResult = await verifyTurnstileToken({
      token: null,
      expectedAction: "suggestion",
      secret: "dummy-secret",
    });
    assert.equal(nullResult.success, false);

    const longToken = "x".repeat(2049);
    const longResult = await verifyTurnstileToken({
      token: longToken,
      expectedAction: "suggestion",
      secret: "dummy-secret",
    });
    assert.equal(longResult.success, false);
  });

  it("rejects when secret is not configured", async () => {
    const result = await verifyTurnstileToken({
      token: "valid-looking-token",
      expectedAction: "suggestion",
      secret: "",
    });
    assert.equal(result.success, false);
    assert.match(result.error, /secret/i);
  });

  it("validates successful token with matching action and hostname", async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (url, init) => {
        assert.equal(String(url), "https://challenges.cloudflare.com/turnstile/v0/siteverify");
        assert.equal(init?.method, "POST");
        return new Response(
          JSON.stringify({
            success: true,
            action: "suggestion",
            hostname: "localhost",
            "challenge_ts": new Date().toISOString(),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      };

      const result = await verifyTurnstileToken({
        token: "mock-token",
        expectedAction: "suggestion",
        clientIp: "127.0.0.1",
        secret: "dummy-secret",
        hostnames: "localhost,campus.buildkre.com",
      });

      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.hostname, "localhost");
        assert.equal(result.action, "suggestion");
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("rejects token when action mismatches", async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            success: true,
            action: "login",
            hostname: "localhost",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      };

      const result = await verifyTurnstileToken({
        token: "mock-token",
        expectedAction: "suggestion",
        secret: "dummy-secret",
        hostnames: "localhost",
      });

      assert.equal(result.success, false);
      assert.match(result.error, /action mismatch/i);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("rejects token when hostname is not in expected list", async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            success: true,
            action: "suggestion",
            hostname: "evil.com",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      };

      const result = await verifyTurnstileToken({
        token: "mock-token",
        expectedAction: "suggestion",
        secret: "dummy-secret",
        hostnames: "localhost,campus.buildkre.com",
      });

      assert.equal(result.success, false);
      assert.match(result.error, /hostname/i);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("handles Cloudflare error codes on failed verification", async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            success: false,
            "error-codes": ["timeout-or-duplicate"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      };

      const result = await verifyTurnstileToken({
        token: "replayed-token",
        expectedAction: "suggestion",
        secret: "dummy-secret",
        hostnames: "localhost",
      });

      assert.equal(result.success, false);
      assert.equal(result.code, "timeout-or-duplicate");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
