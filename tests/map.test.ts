import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapEmbedSrc } from "../src/lib/media/map.ts";

describe("venue maps", () => {
  it("builds an embed from a venue name", () => {
    assert.equal(
      mapEmbedSrc("School hall", null),
      "https://maps.google.com/maps?q=School%20hall&output=embed",
    );
  });

  it("keeps a google embed address", () => {
    const embed = "https://www.google.com/maps/embed?pb=abc";
    assert.equal(mapEmbedSrc("Hall", embed), embed);
  });

  it("uses the place query from a google maps link", () => {
    assert.equal(
      mapEmbedSrc("Hall", "https://www.google.com/maps?q=IISS+Dubai"),
      "https://maps.google.com/maps?q=IISS%20Dubai&output=embed",
    );
  });
});
