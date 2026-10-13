import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { expandMapUrl, mapEmbedSrc } from "../src/lib/media/map.ts";

const school =
  "https://www.google.com/maps/place/India+International+School/@25.276987,55.296249,17z/data=!3m1!4b1!4m6!3m5!1s0x3e5f:0xabc!8m2!3d25.118800!4d55.201200";

describe("venue maps", () => {
  it("does not search the venue name", () => {
    assert.equal(mapEmbedSrc(null), null);
    assert.equal(mapEmbedSrc(""), null);
  });

  it("keeps a google embed address", () => {
    const embed = "https://www.google.com/maps/embed?pb=abc";
    assert.equal(mapEmbedSrc(embed), embed);
  });

  it("uses the place query from a google maps link", () => {
    assert.equal(
      mapEmbedSrc("https://www.google.com/maps?q=IISS+Dubai"),
      "https://maps.google.com/maps?q=IISS%20Dubai&output=embed",
    );
  });

  it("pins the school from a place link instead of the room name", () => {
    assert.equal(
      mapEmbedSrc(school),
      "https://maps.google.com/maps?q=25.118800%2C55.201200&z=17&output=embed",
    );
  });

  it("pins coordinates from the map camera when the place pin is missing", () => {
    assert.equal(
      mapEmbedSrc("https://www.google.com/maps/@25.276987,55.296249,15z"),
      "https://maps.google.com/maps?q=25.276987%2C55.296249&z=15&output=embed",
    );
  });

  it("pins a coordinate query", () => {
    assert.equal(
      mapEmbedSrc("https://www.google.com/maps?q=25.10,55.20&z=14"),
      "https://maps.google.com/maps?q=25.10%2C55.20&z=14&output=embed",
    );
  });

  it("uses the place name in the link when there are no coordinates", () => {
    assert.equal(
      mapEmbedSrc("https://www.google.com/maps/place/India+International+School/"),
      "https://maps.google.com/maps?q=India%20International%20School&output=embed",
    );
  });

  it("ignores links that are not google maps", () => {
    assert.equal(mapEmbedSrc("https://example.com/maps?q=School"), null);
  });

  it("follows a share link to the place url", async () => {
    const place = "https://www.google.com/maps/place/India+International+School/@25.1,55.2,16z";
    const fetchImpl: typeof fetch = async () =>
      new Response(null, { status: 302, headers: { location: place } });
    assert.equal(
      await expandMapUrl("https://maps.app.goo.gl/school", fetchImpl),
      place,
    );
  });

  it("leaves a full maps link unchanged", async () => {
    assert.equal(await expandMapUrl(school, async () => {
      throw new Error("should not fetch");
    }), school);
  });
});
