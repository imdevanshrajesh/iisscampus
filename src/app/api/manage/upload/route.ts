import { NextResponse } from "next/server";
import { getCampusSession } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/config";
import {
  isRustFSConfigured,
  uploadObjectToRustFS,
  createPresignedUploadUrl,
  ALLOWED_MIME_TYPES,
  RUSTFS_BUCKET,
  RUSTFS_ENDPOINT,
  RUSTFS_PUBLIC_BASE_URL,
} from "@/lib/media/rustfs";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

async function authorizeRequest() {
  if (!isSupabaseConfigured()) {
    // Local / file development mode allows testing uploads
    return { ok: true, role: "administrator" as const };
  }
  const session = await getCampusSession();
  if (session.status !== "ok") {
    return { ok: false, error: "Sign in is required to upload photographs." };
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

    if (!isRustFSConfigured()) {
      return NextResponse.json(
        {
          error:
            "RustFS is not configured yet. Please add RUSTFS_ACCESS_KEY and RUSTFS_SECRET_KEY to .env.local on the website.",
        },
        { status: 503 },
      );
    }

    const contentType = request.headers.get("content-type") || "";

    // Flow 1: Direct JSON request for presigned upload URL
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== "object") {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
      }

      const { filename, mimeType, folder = "General" } = body;
      if (!filename || typeof filename !== "string") {
        return NextResponse.json({ error: "Filename is required." }, { status: 400 });
      }
      if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
        return NextResponse.json(
          { error: `Unsupported file type (${mimeType}). Allowed: JPEG, PNG, WebP, GIF, SVG, and PDF.` },
          { status: 400 },
        );
      }

      const presigned = await createPresignedUploadUrl({
        filename,
        mimeType,
        folder: typeof folder === "string" ? folder : "General",
      });

      return NextResponse.json(presigned);
    }

    // Flow 2: Multipart FormData upload (Proxied server-to-server to avoid browser CORS)
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

      const filename = (file as File).name || "image.webp";
      let mimeType = file.type;
      if (!mimeType && filename.toLowerCase().endsWith(".pdf")) {
        mimeType = "application/pdf";
      }
      if (!mimeType) {
        mimeType = "image/jpeg";
      }

      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        return NextResponse.json(
          { error: `Unsupported file format (${mimeType}). Allowed: JPEG, PNG, WebP, GIF, SVG, and PDF.` },
          { status: 400 },
        );
      }
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploaded = await uploadObjectToRustFS({
        buffer,
        filename,
        mimeType,
        folder,
      });

      return NextResponse.json(uploaded);
    }

    return NextResponse.json(
      { error: "Content-Type must be application/json or multipart/form-data." },
      { status: 400 },
    );
  } catch (error) {
    console.error("RustFS upload error:", error);
    const message = error instanceof Error ? error.message : "Image upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
