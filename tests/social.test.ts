import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeSocialLinks, parseSocialInput } from "../src/lib/social.ts";

describe("site links", () => {
  it("fills the usual labels and addresses when nothing is stored", () => {
    const links = normalizeSocialLinks({
      instagramUrl: "https://www.instagram.com/iisscampus/",
      scixcomInstagramUrl: "https://www.instagram.com/scixcom.27/",
    });
    assert.equal(links.schoolLabel, "iiss.ae");
    assert.equal(links.schoolUrl, "https://iiss.ae");
    assert.equal(links.instagramLabel, "Instagram");
    assert.equal(links.scixcomLabel, "SciXcom");
    assert.deepEqual(links.extraLinks, []);
  });

  it("keeps a renamed council account and drops an unsafe address", () => {
    const links = normalizeSocialLinks({
      scixcomLabel: "SciXcom 28",
      scixcomInstagramUrl: "javascript:alert(1)",
      extraLinks: [{ id: "news", label: "Newsletter", url: "https://example.com/news" }],
    });
    assert.equal(links.scixcomLabel, "SciXcom 28");
    assert.equal(links.scixcomInstagramUrl, "https://www.instagram.com/scixcom.27/");
    assert.equal(links.extraLinks[0]?.label, "Newsletter");
    assert.equal(links.extraLinks[0]?.url, "https://example.com/news");
  });

  it("saves a new label and link for the council account", () => {
    const form = new FormData();
    form.set("scixcomLabel", "SciXcom 28");
    form.set("scixcomInstagramUrl", "https://www.instagram.com/scixcom.28/");
    form.set("extraLinks", JSON.stringify([{ id: "site", label: "Results", url: "https://example.com/results" }]));
    const parsed = parseSocialInput(form);
    assert.equal("error" in parsed, false);
    if ("error" in parsed) return;
    assert.equal(parsed.links.scixcomLabel, "SciXcom 28");
    assert.equal(parsed.links.scixcomInstagramUrl, "https://www.instagram.com/scixcom.28/");
    assert.equal(parsed.links.schoolLabel, "iiss.ae");
    assert.equal(parsed.links.extraLinks[0]?.label, "Results");
  });

  it("rejects an extra link that has a label and no address", () => {
    const form = new FormData();
    form.set("extraLinks", JSON.stringify([{ label: "Results", url: "" }]));
    const parsed = parseSocialInput(form);
    assert.deepEqual(parsed, { error: "Each extra link needs a label and an https:// address." });
  });
});
