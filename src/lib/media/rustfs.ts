import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function normalizeS3Endpoint(rawEndpoint: string | undefined, bucket: string): string {
  const cleaned = (rawEndpoint || "https://cdn.iissboys.com").trim().replace(/\/+$/, "");
  try {
    const parsed = new URL(cleaned);
    // Guard against configuring RUSTFS_ENDPOINT with the public bucket path appended (causes double-bucket 404/HTML)
    if (bucket && parsed.pathname === `/${bucket}`) {
      return parsed.origin;
    }
    return cleaned;
  } catch {
    return cleaned;
  }
}

export const RUSTFS_BUCKET = (process.env.RUSTFS_BUCKET || "iissimages").trim();
export const RUSTFS_ENDPOINT = normalizeS3Endpoint(
  process.env.RUSTFS_S3_ENDPOINT || process.env.RUSTFS_ENDPOINT,
  RUSTFS_BUCKET,
);
export const RUSTFS_REGION = (process.env.RUSTFS_REGION || "us-east-1").trim();
export const RUSTFS_PUBLIC_BASE_URL = (
  process.env.RUSTFS_PUBLIC_BASE_URL || "https://cdn.iissboys.com/iissimages"
)
  .trim()
  .replace(/\/+$/, "");

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
]);

export const DEFAULT_UPLOAD_FOLDERS = [
  "Events",
  "Activities",
  "Gallery",
  "Council",
  "Newsletter",
  "Announcements",
  "Notices",
  "Achievements",
  "Houses",
  "Faculty",
  "Students",
  "Documents",
  "Programs",
  "Incharges",
  "Socials",
  "Wellness",
  "Categories",
  "General",
] as const;

export function isRustFSConfigured(): boolean {
  return Boolean(process.env.RUSTFS_ACCESS_KEY && process.env.RUSTFS_SECRET_KEY);
}

let s3ClientInstance: S3Client | null = null;

export function getS3Client(): S3Client {
  if (s3ClientInstance) return s3ClientInstance;

  const accessKey = process.env.RUSTFS_ACCESS_KEY;
  const secretKey = process.env.RUSTFS_SECRET_KEY;

  if (!accessKey || !secretKey) {
    throw new Error(
      "RustFS S3 credentials are missing. Set RUSTFS_ACCESS_KEY and RUSTFS_SECRET_KEY in your environment (.env.local).",
    );
  }

  s3ClientInstance = new S3Client({
    endpoint: RUSTFS_ENDPOINT,
    region: RUSTFS_REGION,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle: true,
    // Disable default SDK v3.729+ CRC32 streaming checksums that cause RustFS / proxies to return HTML errors
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    maxAttempts: 2,
  });

  return s3ClientInstance;
}

type S3RawResponse = {
  statusCode?: number;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

async function readResponseSnippet(body: unknown, limit = 400): Promise<string> {
  if (!body) return "";
  try {
    if (typeof body === "string") return body.slice(0, limit);
    if (body instanceof Uint8Array || Buffer.isBuffer(body)) {
      return Buffer.from(body).toString("utf8").slice(0, limit);
    }
    if (typeof (body as AsyncIterable<unknown>)[Symbol.asyncIterator] === "function") {
      const chunks: Buffer[] = [];
      let total = 0;
      for await (const chunk of body as AsyncIterable<unknown>) {
        const buf = typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk as Uint8Array);
        chunks.push(buf);
        total += buf.length;
        if (total >= limit) break;
      }
      return Buffer.concat(chunks).toString("utf8").slice(0, limit);
    }
  } catch {
    return "";
  }
  return "";
}

export async function describeS3Failure(error: unknown): Promise<string> {
  const errObj = error as { message?: string; name?: string; $response?: S3RawResponse } | null;
  const rawMessage = error instanceof Error ? error.message : String(error || "Storage upload failed.");
  const res = errObj?.$response;

  if (res) {
    const status = res.statusCode ?? "unknown";
    const contentType = String(res.headers?.["content-type"] ?? res.headers?.["Content-Type"] ?? "");
    const server = String(res.headers?.server ?? res.headers?.Server ?? "");
    const bodyText = await readResponseSnippet(res.body);
    const titleMatch = bodyText.match(/<title[^>]*>([^<]+)<\/title>/i);
    const cleanSnippet = (titleMatch?.[1] || bodyText.replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);

    console.error("[RustFS S3 failure]", {
      endpoint: RUSTFS_ENDPOINT,
      bucket: RUSTFS_BUCKET,
      status,
      contentType,
      server,
      snippet: cleanSnippet,
      rawMessage,
    });

    if (status === 523 || status === 521 || status === 522 || status === 520 || status === 524) {
      return `Cloudflare cannot reach the RustFS origin server at ${RUSTFS_ENDPOINT} (HTTP ${status}${cleanSnippet ? `: ${cleanSnippet}` : ""}). Check that your storage server / Cloudflare Tunnel is running and reachable, or set RUSTFS_S3_ENDPOINT to a direct reachable RustFS S3 URL.`;
    }

    if (String(rawMessage).toLowerCase().includes("xml parse error") || contentType.includes("text/html")) {
      return `Storage endpoint (${RUSTFS_ENDPOINT}) returned HTTP ${status} (${contentType || "non-XML"}${server ? ` via ${server}` : ""}${cleanSnippet ? `: ${cleanSnippet}` : ""}). Ensure RUSTFS_ENDPOINT (or RUSTFS_S3_ENDPOINT) points directly to the RustFS S3 API rather than an HTML/Cloudflare page.`;
    }

    if (cleanSnippet) {
      return `Storage error (HTTP ${status}): ${cleanSnippet}`;
    }
    return `Storage request failed with HTTP ${status}: ${rawMessage}`;
  }

  console.error("[RustFS S3 error]", { endpoint: RUSTFS_ENDPOINT, rawMessage });
  return rawMessage;
}

export function sanitizeFolderName(folder: string): string {
  const cleaned = folder
    .trim()
    .replace(/\\+/g, "/")
    .replace(/\.{2,}/g, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9/_-]/g, "");
  return cleaned || "General";
}

export function sanitizeFileName(name: string): string {
  const dotIndex = name.lastIndexOf(".");
  const ext = dotIndex !== -1 ? name.slice(dotIndex).toLowerCase() : "";
  const base = dotIndex !== -1 ? name.slice(0, dotIndex) : name;

  const cleanBase = base
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const fallbackBase = ext === ".pdf" ? "document" : "image";
  const fallbackExt = ext || ".webp";
  return `${cleanBase || fallbackBase}-${timestamp}-${randomSuffix}${fallbackExt}`;
}

export function getPermanentUrl(objectKey: string): string {
  const cleanKey = objectKey.replace(/^\/+/, "");
  return `${RUSTFS_PUBLIC_BASE_URL}/${cleanKey}`;
}

export async function uploadObjectToRustFS({
  buffer,
  filename,
  mimeType,
  folder = "General",
}: {
  buffer: Buffer | Uint8Array;
  filename: string;
  mimeType: string;
  folder?: string;
}): Promise<{ ok: true; key: string; url: string; size: number }> {
  const client = getS3Client();
  const cleanFolder = sanitizeFolderName(folder);
  const cleanFilename = sanitizeFileName(filename);
  const key = `${cleanFolder}/${cleanFilename}`;

  const command = new PutObjectCommand({
    Bucket: RUSTFS_BUCKET,
    Key: key,
    Body: buffer,
    ContentLength: buffer.length,
    ContentType: mimeType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  try {
    await client.send(command, {
      abortSignal: AbortSignal.timeout(18000),
    });
  } catch (error) {
    throw new Error(await describeS3Failure(error));
  }

  return {
    ok: true,
    key,
    url: getPermanentUrl(key),
    size: buffer.length,
  };
}

export async function createPresignedUploadUrl({
  filename,
  mimeType,
  folder = "General",
  expiresInSeconds = 900,
}: {
  filename: string;
  mimeType: string;
  folder?: string;
  expiresInSeconds?: number;
}): Promise<{
  ok: true;
  uploadUrl: string;
  publicUrl: string;
  key: string;
}> {
  const client = getS3Client();
  const cleanFolder = sanitizeFolderName(folder);
  const cleanFilename = sanitizeFileName(filename);
  const key = `${cleanFolder}/${cleanFilename}`;

  const command = new PutObjectCommand({
    Bucket: RUSTFS_BUCKET,
    Key: key,
    ContentType: mimeType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });

  return {
    ok: true,
    uploadUrl,
    publicUrl: getPermanentUrl(key),
    key,
  };
}
