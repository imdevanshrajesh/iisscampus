"use client";

import { useActionState, useRef, useState } from "react";
import { FileText, CheckCircle2, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { saveCategory, type ActionState } from "@/lib/manage/actions";
import { ImageUrlHint } from "@/components/manage/image-url-hint";
import { ImageUploader } from "@/components/manage/image-uploader";
import { IMAGE_URL_EXAMPLE } from "@/lib/media/guide";
import { classifyMediaUrl } from "@/lib/media/url";
import type { Category } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function CategoryForm({
  category,
  mediaHosts,
}: {
  category: Category | null;
  mediaHosts: string[];
}) {
  const [state, action, pending] = useActionState(saveCategory, {} as ActionState);
  const [title, setTitle] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(category));
  const [imageUrl, setImageUrl] = useState(category?.imageUrl ?? "");
  const [pdfUrl, setPdfUrl] = useState(category?.pdfUrl ?? "");
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const image = classifyMediaUrl(imageUrl, mediaHosts);

  const missingFields: string[] = [];
  if (!title.trim() || title.trim().length < 2) missingFields.push("Name (min 2 chars)");
  if (!slug.trim() || slug.trim().length < 2) missingFields.push("Address slug (min 2 chars)");
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) missingFields.push("Address slug (lowercase, numbers, hyphens only)");

  const isFormValid = missingFields.length === 0;

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPdf(true);
    setPdfError(null);

    try {
      const cleanName = slug || title.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-") || "category";
      const formData = new FormData();
      formData.append("file", file, `category-${cleanName}.pdf`);
      formData.append("folder", "Categories");

      const res = await fetch("/api/manage/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data?.url) {
        setPdfUrl(data.url);
      } else {
        setPdfError(data?.error || "Could not upload category PDF.");
      }
    } catch {
      setPdfError("Error uploading PDF. Please check your network connection.");
    } finally {
      setUploadingPdf(false);
      if (pdfInputRef.current) {
        pdfInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!isFormValid) {
      e.preventDefault();
      setClientError(`Please fill in all required fields marked with * before submitting: ${missingFields.join(", ")}`);
      return;
    }
    setClientError(null);
  };

  return (
    <form action={action} onSubmit={handleSubmit} noValidate className="grid max-w-xl gap-4 rounded-2xl border border-line bg-background p-5">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      {clientError ? <p className="rounded-xl border border-red-300 bg-red-50 text-red-900 px-4 py-3 text-sm font-medium">{clientError}</p> : null}
      {state.error ? <p className="rounded-xl border border-red-300 bg-red-50 text-red-900 px-4 py-3 text-sm font-medium">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent font-medium">{state.ok}</p> : null}
      <label className="grid gap-1.5 text-sm font-medium text-ink">
        <span>Name <span className="text-red-500 font-bold" title="Required">*</span></span>
        <input
          name="name"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (!slugEdited) setSlug(slugify(event.target.value));
          }}
          required
          className={fieldClass}
          placeholder="e.g. Science & Innovation"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-ink">
        <span>Address Slug <span className="text-red-500 font-bold" title="Required">*</span></span>
        <input
          name="slug"
          value={slug}
          onChange={(event) => {
            setSlugEdited(true);
            setSlug(event.target.value);
          }}
          required
          className={fieldClass}
          placeholder="e.g. science-and-innovation"
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        Description
        <textarea name="description" defaultValue={category?.description ?? ""} rows={3} className={fieldClass} />
      </label>
      <label className="grid gap-1.5 text-sm">
        Sort order
        <input type="number" name="sortOrder" defaultValue={category?.sortOrder ?? 0} min={0} className={fieldClass} />
      </label>
      <ImageUploader
        name="imageUrl"
        value={imageUrl}
        onChange={(url) => setImageUrl(url)}
        folder="Categories"
        targetName={`category-${slug || title || "image"}`}
        label="Category Photograph"
        hint="Upload directly to RustFS or frame the image."
        aspectRatio="16:10"
      />
      {imageUrl && !image.ok ? <p className="text-sm text-muted">{image.message}</p> : null}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-ink" htmlFor="cat-pdf-url">
            Category Document / PDF URL (Optional)
          </label>
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            onChange={handlePdfUpload}
            className="hidden"
            id="cat-pdf-upload"
          />
        </div>

        {pdfUrl ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                  <CheckCircle2 size={12} /> Category PDF Attached
                </span>
                <p className="truncate font-mono text-xs text-ink/80 select-all" title={pdfUrl}>
                  {pdfUrl}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink hover:bg-wash"
              >
                <ExternalLink size={12} />
                <span>Open</span>
              </a>
              <button
                type="button"
                disabled={uploadingPdf}
                onClick={() => pdfInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink hover:bg-wash"
              >
                <RefreshCw size={12} className={uploadingPdf ? "animate-spin" : ""} />
                <span>{uploadingPdf ? "Uploading..." : "Replace"}</span>
              </button>
              <button
                type="button"
                onClick={() => setPdfUrl("")}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={12} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            disabled={uploadingPdf}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 p-3.5 text-xs font-bold text-accent hover:bg-accent/10 transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={uploadingPdf ? "animate-spin" : "hidden"} />
            <span>{uploadingPdf ? "Uploading PDF via RustFS..." : "+ Upload Category PDF via RustFS"}</span>
          </button>
        )}

        <input
          id="cat-pdf-url"
          name="pdfUrl"
          value={pdfUrl}
          onChange={(e) => setPdfUrl(e.target.value)}
          placeholder="https://... or upload above"
          className={fieldClass}
        />
        {pdfError && <p className="text-xs text-red-600 font-medium">{pdfError}</p>}
      </div>
      {!isFormValid && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200/80 px-3 py-2 text-xs text-amber-900">
          <span className="font-bold shrink-0">Required (*):</span>
          <span>Fill in {missingFields.join(", ")} to submit.</span>
        </div>
      )}
      <button
        type="submit"
        disabled={pending || !isFormValid}
        className="rounded-md bg-navy px-4 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {pending ? "Saving..." : category ? "Save category" : "Add category"}
      </button>
    </form>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
