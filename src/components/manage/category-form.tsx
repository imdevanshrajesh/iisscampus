"use client";

import { useActionState, useState } from "react";
import { saveCategory, type ActionState } from "@/lib/manage/actions";
import { ImageUrlHint } from "@/components/manage/image-url-hint";
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
  const image = classifyMediaUrl(imageUrl, mediaHosts);

  return (
    <form action={action} className="grid max-w-xl gap-4 rounded-2xl border border-line bg-background p-5">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      {state.error ? <p className="text-sm">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
      <label className="grid gap-1.5 text-sm">
        Name
        <input
          name="name"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (!slugEdited) setSlug(slugify(event.target.value));
          }}
          required
          className={fieldClass}
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        Address
        <input
          name="slug"
          value={slug}
          onChange={(event) => {
            setSlugEdited(true);
            setSlug(event.target.value);
          }}
          required
          className={fieldClass}
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
      <label className="grid gap-1.5 text-sm">
        Image URL
        <input
          name="imageUrl"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder={IMAGE_URL_EXAMPLE}
          className={fieldClass}
        />
      </label>
      <ImageUrlHint />
      {imageUrl && !image.ok ? <p className="text-sm text-muted">{image.message}</p> : null}
      {image.ok ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.url} alt="" className="aspect-[4/3] max-w-xs rounded-xl object-cover" />
      ) : null}
      <label className="grid gap-1.5 text-sm">
        PDF URL
        <input name="pdfUrl" defaultValue={category?.pdfUrl ?? ""} placeholder="https://" className={fieldClass} />
      </label>
      <button type="submit" disabled={pending} className="rounded-md bg-navy px-4 py-2 text-sm text-white">
        {pending ? "Saving" : category ? "Save category" : "Add category"}
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
