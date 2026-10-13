"use client";

import { useActionState, useState } from "react";
import { ImageUrlHint } from "@/components/manage/image-url-hint";
import { deleteWellnessItem, saveWellnessItem, type ActionState } from "@/lib/manage/actions";
import { IMAGE_URL_EXAMPLE } from "@/lib/media/guide";
import { classifyMediaUrl } from "@/lib/media/url";
import type { WellnessItem } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

const orientationClass: Record<WellnessItem["imageOrientation"], string> = {
  auto: "max-h-64 w-auto max-w-full object-contain",
  portrait: "aspect-[3/4] max-w-xs object-cover",
  landscape: "aspect-[16/10] max-w-md object-cover",
  square: "aspect-square max-w-xs object-cover",
};

export function WellnessItemForm({
  item,
  mediaHosts,
}: {
  item: WellnessItem | null;
  mediaHosts: string[];
}) {
  const [state, action, pending] = useActionState(saveWellnessItem, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteWellnessItem, {} as ActionState);
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [orientation, setOrientation] = useState<WellnessItem["imageOrientation"]>(
    item?.imageOrientation ?? "auto",
  );
  const image = classifyMediaUrl(imageUrl, mediaHosts);

  return (
    <div className="grid gap-4 rounded-xl border border-line p-4">
      <form action={action} className="grid gap-3">
        {item ? <input type="hidden" name="id" value={item.id} /> : null}
        <label className="grid gap-1.5 text-sm">
          Title
          <input name="title" defaultValue={item?.title ?? ""} required className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm">
          Text
          <textarea name="body" defaultValue={item?.body ?? ""} rows={4} className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm">
          Section
          <input
            name="section"
            defaultValue={item?.section ?? ""}
            placeholder="e.g. Mindfulness, Resources"
            className={fieldClass}
          />
        </label>
        <p className="text-xs text-muted">
          Items with the same section name are grouped together on the public page. Leave blank for ungrouped items.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid max-w-32 gap-1.5 text-sm">
            Order
            <input type="number" name="sortOrder" defaultValue={item?.sortOrder ?? 0} className={fieldClass} />
          </label>
          <label className="grid gap-1.5 text-sm">
            Image layout
            <select
              name="imageOrientation"
              value={orientation}
              onChange={(event) => setOrientation(event.target.value as WellnessItem["imageOrientation"])}
              className={fieldClass}
            >
              <option value="auto">Auto</option>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
              <option value="square">Square</option>
            </select>
          </label>
        </div>
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
          <img src={image.url} alt="" className={`rounded-xl border border-line ${orientationClass[orientation]}`} />
        ) : null}
        <label className="grid gap-1.5 text-sm">
          Image description
          <input name="imageAlt" defaultValue={item?.imageAlt ?? ""} className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm">
          PDF URL
          <input name="pdfUrl" defaultValue={item?.pdfUrl ?? ""} placeholder="https://" className={fieldClass} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={item?.published ?? false} />
          Published
        </label>
        {state.error ? <p className="text-sm">{state.error}</p> : null}
        {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
        <button type="submit" disabled={pending} className="justify-self-start rounded-md bg-navy px-4 py-2 text-sm text-white">
          {pending ? "Saving" : item ? "Save" : "Add item"}
        </button>
      </form>
      {item ? (
        <form action={deleteAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={item.id} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="confirm" value="yes" />
            Confirm delete
          </label>
          <button type="submit" disabled={deleting} className="rounded-md border border-line px-3 py-1.5 text-sm">
            Delete
          </button>
          {deleteState.error ? <p className="text-sm">{deleteState.error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
