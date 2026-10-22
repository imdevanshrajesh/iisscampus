import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cleanSuggestionBody,
  normalizeSuggestionEmail,
  suggestionRateKey,
  suggestionTimingOk,
  suggestionWithinLimits,
} from "../src/lib/suggestions.ts";

const suggestion = "The library could stay open a little later on Thursdays.";

describe("suggestion guardrails", () => {
  it("accepts gmail and school addresses only", () => {
    assert.equal(normalizeSuggestionEmail(" Student@IISS.ae "), "student@iiss.ae");
    assert.equal(normalizeSuggestionEmail("name@gmail.com"), "name@gmail.com");
    assert.equal(normalizeSuggestionEmail("name@googlemail.com"), null);
    assert.equal(normalizeSuggestionEmail("name@student.iiss.ae"), null);
    assert.equal(normalizeSuggestionEmail("name@gmail.com.evil.com"), null);
    assert.equal(suggestionRateKey("A.B+tag@Gmail.com"), "ab@gmail.com");
    assert.equal(suggestionRateKey("a.b@iiss.ae"), "a.b@iiss.ae");
  });

  it("limits length, links, and how fast a form can be sent", () => {
    assert.equal(cleanSuggestionBody(`  ${suggestion}  `).ok, true);
    assert.equal(cleanSuggestionBody("too short").ok, false);
    assert.equal(cleanSuggestionBody(`${suggestion} https://a.test https://b.test https://c.test`).ok, true);
    assert.equal(cleanSuggestionBody(`${suggestion} https://a.test https://b.test https://c.test https://d.test`).ok, false);
    const now = 1_000_000;
    assert.equal(suggestionTimingOk(String(now - 2500), now), true);
    assert.equal(suggestionTimingOk(String(now - 500), now), false);
    assert.equal(suggestionTimingOk("nope", now), false);
  });

  it("stops repeated suggestions from the same address or network", () => {
    const now = Date.parse("2026-10-22T12:00:00Z");
    const rows = [
      { emailKey: "ab@gmail.com", ip: "1.1.1.1", createdAt: new Date(now - 1000).toISOString() },
      { emailKey: "ab@gmail.com", ip: "1.1.1.1", createdAt: new Date(now - 2000).toISOString() },
    ];
    assert.equal(suggestionWithinLimits(rows, "ab@gmail.com", "8.8.8.8", now), true);
    rows.push({ emailKey: "ab@gmail.com", ip: "9.9.9.9", createdAt: new Date(now - 3000).toISOString() });
    assert.equal(suggestionWithinLimits(rows, "ab@gmail.com", "8.8.8.8", now), false);
  });
});
