import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { getCampusSession, sessionActionError } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/config";
import {
  isRustFSConfigured,
  uploadObjectToRustFS,
  createPresignedUploadUrl,
  describeS3Failure,
  ALLOWED_MIME_TYPES,
  RUSTFS_BUCKET,
  RUSTFS_ENDPOINT,
  RUSTFS_PUBLIC_BASE_URL,
  sanitizeFolderName,
  sanitizeFileName,
} from "@/lib/media/rustfs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

async function authorizeRequest() {
  if (process.env.NODE_ENV === "development" || !isSupabaseConfigured()) {
    // Local development mode allows seamless staff uploads
    return { ok: true, role: "administrator" as const };
  }
  const session = await getCampusSession();
  const denied = sessionActionError(session);
  if (denied || session.status !== "ok") {
    return { ok: false, error: denied || "Sign in is required to upload files." };
  }
  return { ok: true, role: session.actor.role };
}

export async function GET() {
  const auth = await authorizeRequest();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  return NextResponse.json({
    configured: isRustFSConfigured(),
    endpoint: RUSTFS_ENDPOINT,
    bucket: RUSTFS_BUCKET,
    publicBaseUrl: RUSTFS_PUBLIC_BASE_URL,
  });
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeRequest();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";

    // Flow 1: Direct JSON request for presigned upload URL
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== "object") {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
      }

      const { filename, folder = "General" } = body;
      let mimeType = body.mimeType;

      if (!filename || typeof filename !== "string") {
        return NextResponse.json({ error: "Filename is required." }, { status: 400 });
      }

      if (filename.toLowerCase().endsWith(".pdf") || (mimeType && mimeType.includes("pdf"))) {
        mimeType = "application/pdf";
      }

      if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
        return NextResponse.json(
          { error: `Unsupported file type (${mimeType}). Allowed: JPEG, PNG, WebP, GIF, SVG, and PDF.` },
          { status: 400 },
        );
      }

      if (isRustFSConfigured()) {
        try {
          const presigned = await createPresignedUploadUrl({
            filename,
            mimeType,
            folder: typeof folder === "string" ? folder : "General",
          });
          return NextResponse.json(presigned);
        } catch (presignError) {
          const message = await describeS3Failure(presignError);
          console.error("Presigned URL creation failed:", presignError);
          return NextResponse.json({ error: message }, { status: 502 });
        }
      }

      // If RustFS credentials aren't set yet, return local upload URL
      const cleanFolder = sanitizeFolderName(typeof folder === "string" ? folder : "General");
      const cleanFilename = sanitizeFileName(filename);
      return NextResponse.json({
        ok: true,
        uploadUrl: `/api/manage/upload`,
        publicUrl: `/uploads/${cleanFolder}/${cleanFilename}`,
        key: `${cleanFolder}/${cleanFilename}`,
      });
    }

    // Flow 2: Multipart FormData upload (Proxied server-to-server)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const folder = (formData.get("folder") as string) || "General";

      if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ error: "No media or document file provided." }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max size is 20MB.` },
          { status: 400 },
        );
      }

      const filename = (file as File).name || "document.pdf";
      let mimeType = file.type;
      if (filename.toLowerCase().endsWith(".pdf") || (mimeType && mimeType.includes("pdf"))) {
        mimeType = "application/pdf";
      }
      if (!mimeType) {
        mimeType = filename.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg";
      }

      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        return NextResponse.json(
          { error: `Unsupported file format (${mimeType}). Allowed: JPEG, PNG, WebP, GIF, SVG, and PDF.` },
          { status: 400 },
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // If RustFS is configured with S3 keys, upload to RustFS bucket
      if (isRustFSConfigured()) {
        const uploaded = await uploadObjectToRustFS({
          buffer,
          filename,
          mimeType,
          folder,
        });
        return NextResponse.json(uploaded);
      }

      // Fallback: Store locally in public/uploads for local development
      if (process.env.VERCEL) {
        return NextResponse.json(
          {
            error:
              "RustFS storage credentials (RUSTFS_ACCESS_KEY and RUSTFS_SECRET_KEY) are not configured on the deployment.",
          },
          { status: 503 },
        );
      }

      const cleanFolder = sanitizeFolderName(folder);
      const cleanFilename = sanitizeFileName(filename);
      const uploadDir = path.join(process.cwd(), "public", "uploads", cleanFolder);
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, cleanFilename), buffer);

      return NextResponse.json({
        ok: true,
        key: `${cleanFolder}/${cleanFilename}`,
        url: `/uploads/${cleanFolder}/${cleanFilename}`,
        size: buffer.length,
      });
    }

    return NextResponse.json(
      { error: "Content-Type must be application/json or multipart/form-data." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Upload error:", error);
    const message = await describeS3Failure(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
