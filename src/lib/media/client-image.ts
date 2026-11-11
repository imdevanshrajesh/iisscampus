export const MAX_PROXIED_IMAGE_BYTES = 2.8 * 1024 * 1024; // Safely under Vercel's 4.5 MB limit with multipart overhead

let cachedWebpSupport: boolean | null = null;

/**
 * Checks whether the current browser actually encodes WebP in HTMLCanvasElement.
 * Safari/WebKit on older macOS/iOS falls back to PNG when given "image/webp",
 * which blows up photo sizes to 5-10MB and triggers 413 payload errors.
 */
export function supportsCanvasWebp(): boolean {
  if (cachedWebpSupport !== null) return cachedWebpSupport;
  if (typeof document === "undefined") return false;
  try {
    const probe = document.createElement("canvas");
    probe.width = 2;
    probe.height = 2;
    const dataUrl = probe.toDataURL("image/webp");
    cachedWebpSupport = dataUrl.startsWith("data:image/webp");
  } catch {
    cachedWebpSupport = false;
  }
  return cachedWebpSupport;
}

export function extensionForMime(mimeType: string, fallback = ".webp"): string {
  const normalized = mimeType.toLowerCase();
  if (normalized === "image/webp") return ".webp";
  if (normalized === "image/jpeg" || normalized === "image/jpg") return ".jpg";
  if (normalized === "image/png") return ".png";
  if (normalized === "image/gif") return ".gif";
  if (normalized === "image/svg+xml") return ".svg";
  return fallback;
}

export function replaceFileExtension(fileName: string, mimeType: string): string {
  const ext = extensionForMime(mimeType);
  const base = fileName.replace(/\.[^/.]+$/, "");
  return `${base || "image"}${ext}`;
}

export function computeFitDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxDimension: number,
): { width: number; height: number } {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return { width: 10, height: 10 };
  }
  let width = naturalWidth;
  let height = naturalHeight;
  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      height = Math.max(1, Math.round((maxDimension * height) / width));
      width = maxDimension;
    } else {
      width = Math.max(1, Math.round((maxDimension * width) / height));
      height = maxDimension;
    }
  }
  return { width: Math.max(10, Math.round(width)), height: Math.max(10, Math.round(height)) };
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), mimeType, quality);
    } catch {
      resolve(null);
    }
  });
}

function drawScaledCanvas(source: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement {
  const scaled = document.createElement("canvas");
  scaled.width = Math.max(10, Math.round(width));
  scaled.height = Math.max(10, Math.round(height));
  const ctx = scaled.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, scaled.width, scaled.height);
  }
  return scaled;
}

/**
 * Encodes a canvas into WebP (or JPEG when WebP canvas encoding is unsupported)
 * and iteratively scales quality/dimensions so the resulting blob stays below maxBytes.
 */
export async function encodeCanvasWithinBudget(
  sourceCanvas: HTMLCanvasElement,
  maxBytes = MAX_PROXIED_IMAGE_BYTES,
): Promise<{ blob: Blob; mimeType: string }> {
  const preferWebp = supportsCanvasWebp();
  const candidates = preferWebp ? ["image/webp", "image/jpeg"] : ["image/jpeg"];
  const qualitySteps = [0.85, 0.72, 0.58];
  const scaleSteps = [1, 0.78, 0.6];

  let lastResult: { blob: Blob; mimeType: string } | null = null;

  for (const scale of scaleSteps) {
    const workingCanvas =
      scale === 1
        ? sourceCanvas
        : drawScaledCanvas(sourceCanvas, sourceCanvas.width * scale, sourceCanvas.height * scale);

    for (const targetMime of candidates) {
      for (const quality of qualitySteps) {
        const blob = await canvasToBlob(workingCanvas, targetMime, quality);
        if (!blob) continue;

        // If browser silently ignored requested WebP and returned PNG, skip to JPEG
        const actualMime = blob.type || targetMime;
        if (targetMime === "image/webp" && actualMime !== "image/webp" && blob.size > maxBytes) {
          break;
        }

        lastResult = { blob, mimeType: actualMime };
        if (blob.size <= maxBytes) {
          return lastResult;
        }
      }
    }
  }

  if (lastResult) return lastResult;
  throw new Error("Could not encode image in this browser.");
}

export function createFastImagePreviewUrl(file: Blob): string {
  if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    return URL.createObjectURL(file);
  }
  return "";
}

export function revokeImagePreviewUrl(url: string | null | undefined): void {
  if (!url || !url.startsWith("blob:")) return;
  if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(url);
  }
}

export function deriveAltFromFilename(fileName: string, fallback = "Event photograph"): string {
  const stem = fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!stem) return fallback;
  return stem.charAt(0).toUpperCase() + stem.slice(1);
}

/**
 * Downscales and re-encodes uncropped photographs >700 KB so uploads finish
 * quickly and never exceed serverless proxy limits (4.5 MB on Vercel).
 */
export async function prepareUncroppedImageForUpload(
  file: File,
  sourceUrl?: string,
  maxBytes = MAX_PROXIED_IMAGE_BYTES,
): Promise<{ blob: Blob; fileName: string; mimeType: string }> {
  const lowerType = (file.type || "").toLowerCase();

  // Preserve animated GIFs and vector SVGs when small enough; otherwise let server/presigned handle them
  if (lowerType === "image/svg+xml" || lowerType === "image/gif") {
    return { blob: file, fileName: file.name, mimeType: lowerType };
  }

  if (file.size <= 700 * 1024) {
    return {
      blob: file,
      fileName: file.name,
      mimeType: lowerType || "image/jpeg",
    };
  }

  let bitmap: ImageBitmap | null = null;
  let objectUrl = "";
  try {
    let source: CanvasImageSource | null = null;
    let naturalWidth = 0;
    let naturalHeight = 0;

    if (typeof createImageBitmap === "function") {
      try {
        bitmap = await createImageBitmap(file);
        source = bitmap;
        naturalWidth = bitmap.width;
        naturalHeight = bitmap.height;
      } catch {
        bitmap = null;
      }
    }

    if (!source) {
      objectUrl = createFastImagePreviewUrl(file);
      const urlToLoad = objectUrl || sourceUrl || "";
      if (!urlToLoad) {
        return {
          blob: file,
          fileName: file.name,
          mimeType: lowerType || "image/jpeg",
        };
      }
      const img = new Image();
      img.src = urlToLoad;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Could not decode the selected image."));
      });
      source = img;
      naturalWidth = img.naturalWidth;
      naturalHeight = img.naturalHeight;
    }

    if (!naturalWidth || !naturalHeight) {
      return {
        blob: file,
        fileName: file.name,
        mimeType: lowerType || "image/jpeg",
      };
    }

    const { width, height } = computeFitDimensions(naturalWidth, naturalHeight, 1600);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return {
        blob: file,
        fileName: file.name,
        mimeType: lowerType || "image/jpeg",
      };
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, width, height);

    const encoded = await encodeCanvasWithinBudget(canvas, Math.min(maxBytes, 950 * 1024));
    if (encoded.blob.size >= file.size && file.size <= maxBytes) {
      return {
        blob: file,
        fileName: file.name,
        mimeType: lowerType || "image/jpeg",
      };
    }

    return {
      blob: encoded.blob,
      fileName: replaceFileExtension(file.name, encoded.mimeType),
      mimeType: encoded.mimeType,
    };
  } finally {
    bitmap?.close?.();
    revokeImagePreviewUrl(objectUrl);
  }
}

function parseJsonSafely(text: string): Record<string, unknown> | null {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function formatUploadHttpError(status: number, rawText: string): string {
  if (status === 413) {
    return "Image is too large for the upload server. Please crop it or pick a smaller file.";
  }
  if (status === 504 || status === 502) {
    const parsed = parseJsonSafely(rawText);
    if (typeof parsed?.error === "string" && parsed.error.trim()) {
      return parsed.error.trim();
    }
    return "Upload timed out or storage rejected the request. Please check RustFS config and try again.";
  }
  if (status === 401 || status === 403) {
    return "Your sign-in session expired. Please sign in again and retry.";
  }
  const snippet = rawText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140);
  return snippet
    ? `Upload failed (HTTP ${status || "error"}): ${snippet}`
    : `Upload failed (HTTP ${status || "error"}). Please try again.`;
}

async function tryPresignedDirectUpload(
  fileBlob: Blob | File,
  finalFilename: string,
  targetFolder: string,
): Promise<{ url?: string; error?: string }> {
  try {
    const mimeType = fileBlob.type || "image/jpeg";
    const res = await fetch("/api/manage/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: finalFilename,
        mimeType,
        folder: targetFolder,
      }),
    });
    const data = (await res.json().catch(() => null)) as
      | { uploadUrl?: string; publicUrl?: string; error?: string }
      | null;
    if (!res.ok) {
      return { error: data?.error || formatUploadHttpError(res.status, "") };
    }
    if (!data?.uploadUrl || !data?.publicUrl || data.uploadUrl.startsWith("/")) {
      return {};
    }

    const putRes = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      body: fileBlob,
    });
    if (!putRes.ok) {
      return { error: `Direct storage PUT failed (HTTP ${putRes.status}).` };
    }
    return { url: data.publicUrl };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Direct storage upload failed." };
  }
}

export type UploadPhase = "preparing" | "uploading" | "saving";

export function uploadPreparedBlobWithProgress({
  blob,
  fileName,
  folder,
  onPhase,
  onProgress,
}: {
  blob: Blob | File;
  fileName: string;
  folder: string;
  onPhase?: (phase: UploadPhase) => void;
  onProgress?: (percent: number) => void;
}): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", blob, fileName);
    formData.append("folder", folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/manage/upload");

    onPhase?.("uploading");
    onProgress?.(0);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
        onProgress?.(percent);
        if (event.loaded >= event.total) {
          onPhase?.("saving");
        }
      }
    };

    xhr.upload.onloadend = () => {
      onProgress?.(99);
      onPhase?.("saving");
    };

    xhr.onload = async () => {
      const response = parseJsonSafely(xhr.responseText);
      const uploadedUrl =
        typeof response?.url === "string"
          ? response.url
          : typeof response?.publicUrl === "string"
            ? response.publicUrl
            : null;

      if (xhr.status >= 200 && xhr.status < 300 && uploadedUrl) {
        onProgress?.(100);
        resolve(uploadedUrl);
        return;
      }

      if (xhr.status === 413) {
        const direct = await tryPresignedDirectUpload(blob, fileName, folder);
        if (direct.url) {
          onProgress?.(100);
          resolve(direct.url);
          return;
        }
        if (direct.error) {
          reject(new Error(direct.error));
          return;
        }
      }

      const errorMessage =
        typeof response?.error === "string" && response.error.trim()
          ? response.error.trim()
          : formatUploadHttpError(xhr.status, xhr.responseText);
      reject(new Error(errorMessage));
    };

    xhr.onerror = () => {
      reject(new Error("Network connection failed during upload."));
    };

    xhr.onabort = () => {
      reject(new Error("Upload was cancelled."));
    };

    xhr.send(formData);
  });
}
