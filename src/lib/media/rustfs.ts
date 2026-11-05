import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const RUSTFS_ENDPOINT = process.env.RUSTFS_ENDPOINT || "https://cdn.iissboys.com";
export const RUSTFS_REGION = process.env.RUSTFS_REGION || "us-east-1";
export const RUSTFS_BUCKET = process.env.RUSTFS_BUCKET || "iissimages";
export const RUSTFS_PUBLIC_BASE_URL = (
  process.env.RUSTFS_PUBLIC_BASE_URL || "https://cdn.iissboys.com/iissimages"
).replace(/\/+$/, "");

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
  });

  return s3ClientInstance;
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
    ContentType: mimeType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  await client.send(command);

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
