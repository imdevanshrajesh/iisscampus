import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAllowedReturnUrl } from "../src/lib/auth/redirect.ts";
import { registrationState } from "../src/lib/registration.ts";

const base = {
  registrationEnabled: true,
  registrationUrl: "https://arigo.example/events/fifa",
  registrationLabel: null,
  registrationProvider: "Arigo",
  registrationDeadline: null,
};

describe("registration and redirects", () => {
  it("hides registration when it is off", () => {
    assert.deepEqual(registrationState({ ...base, registrationEnabled: false }), { state: "hidden" });
  });

  it("opens an allowlisted-style https registration link", () => {
    const state = registrationState(base, "2026-01-01");
    assert.equal(state.state, "open");
    if (state.state === "open") {
      assert.equal(state.href, "https://arigo.example/events/fifa");
      assert.equal(state.label, "Register through Arigo");
    }
  });

  it("does not offer a button when the registration url is missing or unsafe", () => {
    assert.equal(registrationState({ ...base, registrationUrl: null }).state, "unavailable");
    assert.equal(registrationState({ ...base, registrationUrl: "javascript:alert(1)" }).state, "unavailable");
  });

  it("closes registration after the deadline", () => {
    assert.equal(
      registrationState({ ...base, registrationDeadline: "2026-01-01" }, "2026-01-02").state,
      "closed",
    );
  });

  it("allows only the site and the configured Arigo origin", () => {
    assert.equal(isAllowedReturnUrl("/events/fifa-fever", "https://iisscampus.com", "https://arigo.example"), true);
    assert.equal(isAllowedReturnUrl("https://arigo.example/login", "https://iisscampus.com", "https://arigo.example"), true);
    assert.equal(isAllowedReturnUrl("https://evil.example", "https://iisscampus.com", "https://arigo.example"), false);
    assert.equal(isAllowedReturnUrl("//evil.example", "https://iisscampus.com", "https://arigo.example"), false);
    assert.equal(isAllowedReturnUrl("javascript:alert(1)", "https://iisscampus.com", null), false);
  });
});
