import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  sanitizeFolderName,
  sanitizeFileName,
  getPermanentUrl,
  ALLOWED_MIME_TYPES,
  DEFAULT_UPLOAD_FOLDERS,
} from "../src/lib/media/rustfs.ts";
import { classifyMediaUrl } from "../src/lib/media/url.ts";

describe("RustFS media integration", () => {
  it("sanitizes folder names safely and prevents path traversal", () => {
    assert.equal(sanitizeFolderName("Events"), "Events");
    assert.equal(sanitizeFolderName("../../secret/folder"), "secret/folder");
    assert.equal(sanitizeFolderName("Activities & Sports!"), "ActivitiesSports");
    assert.equal(sanitizeFolderName(""), "General");
    assert.equal(sanitizeFolderName("   "), "General");
  });

  it("sanitizes filenames and generates safe unique keys", () => {
    const filename = sanitizeFileName("Sports Day Final (2026).png");
    assert.ok(filename.startsWith("sports-day-final-2026"));
    assert.ok(filename.endsWith(".png"));
    assert.ok(!filename.includes(" "));
    assert.ok(!filename.includes("("));
  });

  it("constructs clean permanent public CDN URLs", () => {
    const url = getPermanentUrl("Events/annual-sports-day.webp");
    assert.equal(url, "https://cdn.iissboys.com/iissimages/Events/annual-sports-day.webp");
    assert.ok(!url.includes("X-Amz-"));
  });

  it("automatically trusts cdn.iissboys.com as an approved media host", () => {
    // Empty external allowedHosts list: cdn.iissboys.com is trusted out-of-the-box
    const result = classifyMediaUrl(
      "https://cdn.iissboys.com/iissimages/Events/sports-day.webp",
      [],
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.host, "cdn.iissboys.com");
    }
  });

  it("includes all standard school image folders", () => {
    assert.ok(DEFAULT_UPLOAD_FOLDERS.includes("Events"));
    assert.ok(DEFAULT_UPLOAD_FOLDERS.includes("Activities"));
    assert.ok(DEFAULT_UPLOAD_FOLDERS.includes("Gallery"));
  });

  it("validates permitted image MIME types", () => {
    assert.ok(ALLOWED_MIME_TYPES.has("image/jpeg"));
    assert.ok(ALLOWED_MIME_TYPES.has("image/png"));
    assert.ok(ALLOWED_MIME_TYPES.has("image/webp"));
    assert.ok(ALLOWED_MIME_TYPES.has("image/gif"));
    assert.ok(!ALLOWED_MIME_TYPES.has("application/pdf"));
    assert.ok(!ALLOWED_MIME_TYPES.has("text/html"));
  });
});
