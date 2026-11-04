"use client";

import { useActionState, useState } from "react";
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
  const [clientError, setClientError] = useState<string | null>(null);
  const image = classifyMediaUrl(imageUrl, mediaHosts);

  const missingFields: string[] = [];
  if (!title.trim() || title.trim().length < 2) missingFields.push("Name (min 2 chars)");
  if (!slug.trim() || slug.trim().length < 2) missingFields.push("Address slug (min 2 chars)");
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) missingFields.push("Address slug (lowercase, numbers, hyphens only)");

  const isFormValid = missingFields.length === 0;

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
        folder="General"
        label="Category Photograph"
        hint="Upload directly to RustFS or frame the image."
        aspectRatio="16:10"
      />
      {imageUrl && !image.ok ? <p className="text-sm text-muted">{image.message}</p> : null}
      <label className="grid gap-1.5 text-sm">
        PDF URL
        <input name="pdfUrl" defaultValue={category?.pdfUrl ?? ""} placeholder="https://" className={fieldClass} />
      </label>
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
