import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { councilMemberSlugs, councilMembersOnBoard } from "../src/lib/data/catalog.ts";
import {
  MAX_PROXIED_IMAGE_BYTES,
  computeFitDimensions,
  deriveAltFromFilename,
  encodeCanvasWithinBudget,
  extensionForMime,
  prepareUncroppedImageForUpload,
  replaceFileExtension,
  supportsCanvasWebp,
} from "../src/lib/media/client-image.ts";
import {
  describeS3Failure,
  getPermanentUrl,
  normalizeS3Endpoint,
  sanitizeFileName,
  sanitizeFolderName,
} from "../src/lib/media/rustfs.ts";
import type { CouncilMember } from "../src/lib/types.ts";

describe("client image budget and upload formatting", () => {
  it("stays well under the 4.5 MB serverless body limit", () => {
    assert.ok(MAX_PROXIED_IMAGE_BYTES < 3 * 1024 * 1024);
  });

  it("maps MIME types to expected file extensions and replaces filenames cleanly", () => {
    assert.equal(extensionForMime("image/webp"), ".webp");
    assert.equal(extensionForMime("image/jpeg"), ".jpg");
    assert.equal(extensionForMime("image/jpg"), ".jpg");
    assert.equal(extensionForMime("image/png"), ".png");
    assert.equal(extensionForMime("application/octet-stream", ".bin"), ".bin");

    assert.equal(replaceFileExtension("Head Boy Portrait.HEIC", "image/jpeg"), "Head Boy Portrait.jpg");
    assert.equal(replaceFileExtension("banner.png", "image/webp"), "banner.webp");
    assert.equal(replaceFileExtension("noext", "image/jpeg"), "noext.jpg");
  });

  it("fits oversized images inside max dimensions while preserving aspect ratio", () => {
    assert.deepEqual(computeFitDimensions(4000, 2000, 1920), { width: 1920, height: 960 });
    assert.deepEqual(computeFitDimensions(2000, 4000, 1920), { width: 960, height: 1920 });
    assert.deepEqual(computeFitDimensions(1200, 800, 1920), { width: 1200, height: 800 });
    assert.deepEqual(computeFitDimensions(0, -5, 1920), { width: 10, height: 10 });
  });

  it("returns false for WebP support in non-DOM environments without throwing", () => {
    assert.equal(supportsCanvasWebp(), false);
  });

  it("falls back to JPEG and scales down when WebP is unsupported and PNG exceeds budget", async () => {
    type FakeCanvas = {
      width: number;
      height: number;
      toDataURL: (mime?: string) => string;
      getContext: () => {
        imageSmoothingEnabled: boolean;
        imageSmoothingQuality: string;
        drawImage: () => void;
      };
      toBlob: (cb: (b: Blob | null) => void, mimeType?: string, quality?: number) => void;
    };

    const createFakeCanvas = (): FakeCanvas => {
      const canvas: FakeCanvas = {
        width: 3000,
        height: 2000,
        toDataURL: () => "data:image/png;base64,iVBORw0KGgo=", // Safari WebKit fallback
        getContext: () => ({
          imageSmoothingEnabled: false,
          imageSmoothingQuality: "low",
          drawImage: () => undefined,
        }),
        toBlob: (cb, mimeType = "image/png", quality = 0.9) => {
          if (mimeType === "image/webp") {
            // Simulate Safari silently producing a huge PNG instead of WebP
            cb(new Blob([new Uint8Array(4 * 1024 * 1024)], { type: "image/png" }));
            return;
          }
          const pixelFactor = (canvas.width * canvas.height) / (3000 * 2000);
          const byteSize = Math.round(3.4 * 1024 * 1024 * pixelFactor * quality);
          cb(new Blob([new Uint8Array(byteSize)], { type: "image/jpeg" }));
        },
      };
      return canvas;
    };

    const prevDocument = globalThis.document;
    try {
      globalThis.document = {
        createElement: () => createFakeCanvas(),
      } as unknown as Document;

      const sourceCanvas = createFakeCanvas() as unknown as HTMLCanvasElement;
      const encoded = await encodeCanvasWithinBudget(sourceCanvas, 1.8 * 1024 * 1024);

      assert.equal(encoded.mimeType, "image/jpeg");
      assert.ok(encoded.blob.size <= 1.8 * 1024 * 1024);
    } finally {
      globalThis.document = prevDocument;
    }
  });

  it("keeps small images untouched when under 700 KB threshold in prepareUncroppedImageForUpload", async () => {
    const smallFile = new File([new Uint8Array(256 * 1024)], "captain.jpg", { type: "image/jpeg" });
    const prepared = await prepareUncroppedImageForUpload(smallFile, "data:image/jpeg;base64,AA==");
    assert.equal(prepared.fileName, "captain.jpg");
    assert.equal(prepared.mimeType, "image/jpeg");
    assert.equal(prepared.blob.size, 256 * 1024);
  });

  it("derives readable alt text from filenames", () => {
    assert.equal(deriveAltFromFilename("science_fair-award-photo.JPG"), "Science fair award photo");
    assert.equal(deriveAltFromFilename("...", "Campus event"), "Campus event");
  });

  it("compresses large uncropped images under proxy limits when > 700 KB", async () => {
    const prevDocument = globalThis.document;
    const prevCreateBitmap = globalThis.createImageBitmap;
    let closed = false;

    try {
      const fakeBitmap = {
        width: 3200,
        height: 2400,
        close: () => {
          closed = true;
        },
      };
      globalThis.createImageBitmap = (async () => fakeBitmap) as unknown as typeof createImageBitmap;

      const createFakeCanvas = () => {
        const canvas = {
          width: 1600,
          height: 1200,
          toDataURL: () => "data:image/jpeg;base64,AA==",
          getContext: () => ({
            imageSmoothingEnabled: false,
            imageSmoothingQuality: "low",
            drawImage: () => undefined,
          }),
          toBlob: (cb: (b: Blob | null) => void, mimeType = "image/jpeg") => {
            const type = mimeType === "image/webp" ? "image/png" : "image/jpeg";
            cb(new Blob([new Uint8Array(220 * 1024)], { type }));
          },
        };
        return canvas;
      };

      globalThis.document = {
        createElement: () => createFakeCanvas(),
      } as unknown as Document;

      const largeFile = new File([new Uint8Array(2.5 * 1024 * 1024)], "annual-day.JPG", {
        type: "image/jpeg",
      });
      const prepared = await prepareUncroppedImageForUpload(largeFile);
      assert.equal(closed, true);
      assert.equal(prepared.mimeType, "image/jpeg");
      assert.equal(prepared.fileName, "annual-day.jpg");
      assert.ok(prepared.blob.size < 300 * 1024);
    } finally {
      globalThis.document = prevDocument;
      globalThis.createImageBitmap = prevCreateBitmap;
    }
  });

  it("normalizes council folder names and filenames for uploads", () => {
    assert.equal(sanitizeFolderName("Council"), "Council");
    const keyName = sanitizeFileName("Vice Captain.webp");
    assert.ok(keyName.startsWith("vice-captain"));
    assert.ok(keyName.endsWith(".webp"));
    assert.equal(
      getPermanentUrl("Council/vice-captain.webp"),
      "https://cdn.iissboys.com/iissimages/Council/vice-captain.webp",
    );
  });

  it("normalizes S3 endpoints and extracts actionable HTTP diagnostics from AWS SDK $response errors", async () => {
    assert.equal(normalizeS3Endpoint("https://s3.example.com/iissimages/", "iissimages"), "https://s3.example.com");
    assert.equal(normalizeS3Endpoint("https://s3.example.com/", "iissimages"), "https://s3.example.com");
    assert.equal(normalizeS3Endpoint(undefined, "iissimages"), "https://cdn.iissboys.com");

    const xmlParseErr = Object.assign(
      new Error(
        "Deserialization error: to see the raw response, inspect the hidden field {error}.$response on this object.",
      ),
      {
        $response: {
          statusCode: 403,
          body: Buffer.from("<html><body><h1>403 Forbidden - Cloud WAF blocked PUT</h1></body></html>"),
        },
      },
    );
    const summary = await describeS3Failure(xmlParseErr);
    assert.match(summary, /403/);
    assert.match(summary, /Cloud WAF blocked PUT/);
    assert.doesNotMatch(summary, /inspect the hidden field/i);

    const originUnreachableErr = Object.assign(new Error("XML parse error: unexpected content."), {
      $response: {
        statusCode: 523,
        headers: { "content-type": "text/plain; charset=UTF-8", server: "cloudflare" },
        body: Buffer.from("error code: 523"),
      },
    });
    const cfSummary = await describeS3Failure(originUnreachableErr);
    assert.match(cfSummary, /Cloudflare cannot reach/i);
    assert.match(cfSummary, /523/);
  });
});

describe("council board helpers for independent card saving", () => {
  it("separates main council and junior council while generating unique member slugs", () => {
    const members: CouncilMember[] = [
      {
        id: "m1",
        role: "Head Boy",
        name: "Aarav Sharma",
        board: "main",
        sortOrder: 0,
      },
      {
        id: "m2",
        role: "Junior Head Boy",
        name: "Kabir Verma",
        board: "junior",
        sortOrder: 1,
      },
      {
        id: "m3",
        role: "Teacher in charge",
        name: "Meera Nair",
        board: "main",
        sortOrder: 2,
      },
    ];

    const slugs = councilMemberSlugs(members);
    assert.equal(slugs[0], "aarav-sharma");
    assert.equal(slugs[1], "kabir-verma");
    assert.equal(slugs[2], "meera-nair");

    const mainBoard = councilMembersOnBoard(members, "main");
    const juniorBoard = councilMembersOnBoard(members, "junior");
    assert.deepEqual(
      mainBoard.map((m) => m.id),
      ["m1", "m3"],
    );
    assert.deepEqual(
      juniorBoard.map((m) => m.id),
      ["m2"],
    );
  });
});
