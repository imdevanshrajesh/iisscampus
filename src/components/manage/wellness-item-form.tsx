"use client";

import { useActionState, useState } from "react";
import { ImageUploader } from "@/components/manage/image-uploader";
import { deleteWellnessItem, saveWellnessItem, type ActionState } from "@/lib/manage/actions";
import { IMAGE_URL_EXAMPLE } from "@/lib/media/guide";
import { classifyMediaUrl } from "@/lib/media/url";
import type { WellnessCategory, WellnessItem } from "@/lib/types";
import { ChevronDown, HeartHandshake, Paperclip, Trash2, CheckCircle2, ExternalLink, FileText } from "lucide-react";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

const orientationClass: Record<WellnessItem["imageOrientation"], string> = {
  auto: "max-h-64 w-auto max-w-full object-contain",
  portrait: "aspect-[3/4] max-w-xs object-cover",
  landscape: "aspect-[16/10] max-w-md object-cover",
  square: "aspect-square max-w-xs object-cover",
};

export function WellnessItemForm({
  item,
  categories,
  mediaHosts,
}: {
  item: WellnessItem | null;
  categories: WellnessCategory[];
  mediaHosts: string[];
}) {
  const [state, action, pending] = useActionState(saveWellnessItem, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteWellnessItem, {} as ActionState);
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [pdfUrl, setPdfUrl] = useState(item?.pdfUrl ?? "");
  const [orientation, setOrientation] = useState<WellnessItem["imageOrientation"]>(
    item?.imageOrientation ?? "auto",
  );
  const [isOpen, setIsOpen] = useState(!item); // Collapsed by default for existing items

  const defaultCategoryId =
    item?.categoryId && categories.some((category) => category.id === item.categoryId)
      ? item.categoryId
      : categories[0]?.id ?? "";

  const [title, setTitle] = useState(item?.title ?? "");
  const [categoryId, setCategoryId] = useState(defaultCategoryId);

  const image = classifyMediaUrl(imageUrl, mediaHosts);

  const missingFields: string[] = [];
  if (!categoryId) missingFields.push("Category");
  if (title.trim().length < 2) missingFields.push("Title (at least 2 characters)");
  const isFormValid = missingFields.length === 0 && categories.length > 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isFormValid) {
      event.preventDefault();
      alert(`Please fill in required fields: ${missingFields.join(", ")}.`);
    }
  }

  const categoryName = categories.find((c) => c.id === (categoryId || item?.categoryId))?.name ?? "Wellness";

  return (
    <div className="rounded-xl border border-line bg-white shadow-xs overflow-hidden transition-all duration-200">
      {item ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left hover:bg-wash/40 transition cursor-pointer select-none border-b border-transparent data-[open=true]:border-line/70"
          data-open={isOpen}
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 border border-teal-200/60 text-teal-700">
              <HeartHandshake size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-ink truncate">
                  {item.title}
                </span>
                <span className="inline-block text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100/70 text-teal-800">
                  {categoryName}
                </span>
                {item.published ? (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                    Published
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-muted bg-gray-100 px-2 py-0.5 rounded-full">
                    Draft
                  </span>
                )}
                {item.pdfUrl ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                    <Paperclip size={9} /> PDF
                  </span>
                ) : null}
              </div>
              {item.body && (
                <p className="mt-0.5 text-xs text-muted truncate max-w-md">
                  {item.body}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-navy/75 hover:text-navy hidden sm:inline">
              {isOpen ? "Close" : "Edit"}
            </span>
            <ChevronDown
              size={16}
              className={`text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </button>
      ) : null}

      <div className={`p-4 sm:p-5 ${item && !isOpen ? "hidden" : "block"}`}>
        <form action={action} onSubmit={handleSubmit} className="grid gap-3.5">
          {item ? <input type="hidden" name="id" value={item.id} /> : null}
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">
              Category <span className="text-red-500 font-bold">*</span>
            </span>
            <select
              name="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className={fieldClass}
            >
              {!categories.length ? <option value="">Add a category first</option> : null}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">
              Title <span className="text-red-500 font-bold">*</span>
            </span>
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Text / Guidance</span>
            <textarea name="body" defaultValue={item?.body ?? ""} rows={4} className={fieldClass} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid max-w-32 gap-1.5 text-sm">
              <span className="font-medium">Order</span>
              <input type="number" name="sortOrder" defaultValue={item?.sortOrder ?? 0} className={fieldClass} />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Image layout</span>
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
          <ImageUploader
            name="imageUrl"
            value={imageUrl}
            onChange={setImageUrl}
            folder="Wellness"
            targetName={`wellness-${title.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-") || "photo"}`}
            label="Photograph / Illustration"
            hint="Upload image directly to RustFS or enter a trusted URL."
            aspectRatio={orientation === "portrait" ? "4:3" : orientation === "landscape" ? "16:10" : orientation === "square" ? "1:1" : "free"}
          />
          {imageUrl && !image.ok ? <p className="text-sm text-muted">{image.message}</p> : null}
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Image description</span>
            <input name="imageAlt" defaultValue={item?.imageAlt ?? ""} className={fieldClass} />
          </label>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-ink" htmlFor={`wellness-pdf-${item?.id ?? "new"}`}>
              PDF / Google Drive Document URL (Optional)
            </label>
            <input
              id={`wellness-pdf-${item?.id ?? "new"}`}
              name="pdfUrl"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/... or direct document link"
              className={fieldClass}
            />
            <span className="text-xs text-muted">
              Paste a Google Drive sharing link, cloud document link, or direct PDF link.
            </span>

            {pdfUrl ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                      <CheckCircle2 size={12} /> Document Attached
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
                    onClick={() => setPdfUrl("")}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <label className="flex items-center gap-2 text-sm pt-1">
            <input type="checkbox" name="published" defaultChecked={item?.published ?? false} />
            <span className="font-medium">Show on the wellness page</span>
          </label>
          {missingFields.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
              <span className="font-semibold">Required fields missing:</span> {missingFields.join(", ")}
            </div>
          )}
          {state.error ? <p className="text-sm text-red-600 font-medium">{state.error}</p> : null}
          {state.ok ? <p className="text-sm text-accent font-medium">{state.ok}</p> : null}
          <div className="flex items-center gap-2 mt-2">
            <button
              type="submit"
              disabled={pending || !isFormValid}
              className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 transition cursor-pointer disabled:opacity-50"
            >
              {pending ? "Saving..." : item ? "Save item" : "Add item"}
            </button>
            {item && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-line px-3 py-2 text-sm text-ink hover:bg-zinc-50 cursor-pointer"
              >
                Done
              </button>
            )}
          </div>
        </form>
        {item ? (
          <form
            action={deleteAction}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 mt-4 pt-3.5"
          >
            <input type="hidden" name="id" value={item.id} />
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" name="confirm" value="yes" className="h-3.5 w-3.5 rounded border-line" />
              <span>Confirm delete item</span>
            </label>
            <button
              type="submit"
              disabled={deleting}
              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-600 hover:bg-red-100 transition cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={11} />
              <span>{deleting ? "Deleting..." : "Delete item"}</span>
            </button>
            {deleteState.error ? <p className="text-xs text-red-600 w-full">{deleteState.error}</p> : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}
