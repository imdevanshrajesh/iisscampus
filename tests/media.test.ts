import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyMediaUrl, classifyNavigationUrl, parseMediaHostList } from "../src/lib/media/url.ts";
import { presentVideo } from "../src/lib/media/video.ts";

const hosts = ["images.example.com"];

describe("media urls", () => {
  it("accepts an allowlisted https image", () => {
    const result = classifyMediaUrl("https://images.example.com/photo.jpg", hosts);
    assert.equal(result.ok, true);
  });

  it("rejects javascript, data, and http urls", () => {
    assert.equal(classifyMediaUrl("javascript:alert(1)", hosts).ok, false);
    assert.equal(classifyMediaUrl("data:text/html,hi", hosts).ok, false);
    assert.equal(classifyNavigationUrl("http://images.example.com/a.jpg").ok, false);
  });

  it("rejects Google Drive sharing links without rewriting them", () => {
    const shared = classifyMediaUrl("https://drive.google.com/file/d/abc/view", hosts);
    assert.equal(shared.ok, false);
    if (!shared.ok) assert.equal(shared.code, "drive");
    assert.equal(shared.ok ? shared.url : shared.message.includes("direct HTTPS"), true);
  });

  it("rejects hosts that are not approved, including if Drive is added", () => {
    const blocked = classifyMediaUrl("https://cdn.example.net/a.jpg", hosts);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.equal(blocked.code, "allowlist");
    const drive = classifyMediaUrl("https://drive.google.com/uc?id=1", ["drive.google.com"]);
    assert.equal(drive.ok, false);
    if (!drive.ok) assert.equal(drive.code, "drive");
  });

  it("rejects credential and port urls", () => {
    assert.equal(classifyMediaUrl("https://user:pass@images.example.com/a.jpg", hosts).ok, false);
    assert.equal(classifyMediaUrl("https://images.example.com:8443/a.jpg", hosts).ok, false);
  });

  it("rejects unsafe hostnames in the allowlist editor", () => {
    const parsed = parseMediaHostList("images.example.com\ndrive.google.com\nhttps://evil.test\n*");
    assert.deepEqual(parsed.hosts, ["images.example.com"]);
    assert.ok(parsed.errors.length >= 2);
  });

  it("builds a youtube embed only from a known watch url", () => {
    const video = presentVideo("https://www.youtube.com/watch?v=abcdefghijk");
    assert.equal(video?.kind, "youtube");
    if (video?.kind === "youtube") {
      assert.equal(video.src, "https://www.youtube-nocookie.com/embed/abcdefghijk");
    }
    assert.equal(presentVideo("javascript:alert(1)"), null);
  });
});
