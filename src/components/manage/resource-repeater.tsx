"use client";

import { useState, useRef } from "react";
import {
  FileText,
  Video,
  Link2,
  UploadCloud,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import type { ContentResource, ResourceKind } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function ResourceRepeater({
  resources,
  onChange,
  folder = "Documents",
}: {
  resources: ContentResource[];
  onChange: (resources: ContentResource[]) => void;
  folder?: string;
}) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<{ index: number; message: string } | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  function update(index: number, patch: Partial<ContentResource>) {
    onChange(resources.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function move(index: number, delta: number) {
    const next = index + delta;
    if (next < 0 || next >= resources.length) return;
    const copy = [...resources];
    const [item] = copy.splice(index, 1);
    if (!item) return;
    copy.splice(next, 0, item);
    onChange(copy);
  }

  const handlePdfUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      formData.append("folder", folder);

      const res = await fetch("/api/manage/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data?.url) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
        const currentItem = resources[index];
        update(index, {
          href: data.url,
          kind: "pdf",
          title: currentItem?.title?.trim() ? currentItem.title : cleanName,
          detail: currentItem?.detail?.trim() ? currentItem.detail : "Official PDF Document",
        });
      } else {
        setUploadError({ index, message: data?.error || "Could not upload PDF document." });
      }
    } catch {
      setUploadError({ index, message: "Error uploading PDF document. Please check network connection." });
    } finally {
      setUploadingIndex(null);
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index]!.value = "";
      }
    }
  };

  return (
    <div className="grid gap-3 border-t border-line pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-ink">Cards, Documents &amp; Video Links</h2>
          <p className="text-xs text-muted">
            Cards, web links, PDF downloads, and videos appear on the page and in the side preview in this order.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-white transition shadow-2xs"
          onClick={() => onChange([...resources, { title: "", detail: null, href: null, kind: "card" }])}
        >
          <Plus size={14} />
          <span>Add card / download</span>
        </button>
      </div>

      {resources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-wash/30 p-6 text-center text-xs text-muted">
          No cards, PDFs, or video links added yet. Click &ldquo;Add card / download&rdquo; above to attach documents or links.
        </div>
      ) : null}

      {resources.map((item, index) => {
        const isPdf = item.kind === "pdf";
        const isVideo = item.kind === "video";
        const isUploading = uploadingIndex === index;
        const err = uploadError?.index === index ? uploadError.message : null;

        return (
          <div key={index} className="grid gap-3 rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-2xs">
            {/* Top row: index indicator & reorder actions */}
            <div className="flex items-center justify-between border-b border-line/50 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                {isPdf ? (
                  <FileText size={14} className="text-accent" />
                ) : isVideo ? (
                  <Video size={14} className="text-accent" />
                ) : (
                  <Link2 size={14} className="text-accent" />
                )}
                <span>Resource #{index + 1} &bull; {item.kind.toUpperCase()}</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  title="Move up"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="rounded p-1 text-muted hover:bg-wash hover:text-ink disabled:opacity-30 transition"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  title="Move down"
                  disabled={index === resources.length - 1}
                  onClick={() => move(index, 1)}
                  className="rounded p-1 text-muted hover:bg-wash hover:text-ink disabled:opacity-30 transition"
                >
                  <ArrowDown size={14} />
                </button>
                <span className="h-3 w-px bg-line/80 mx-1" />
                <button
                  type="button"
                  title="Remove resource"
                  onClick={() => onChange(resources.filter((_, itemIndex) => itemIndex !== index))}
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                >
                  <Trash2 size={13} />
                  <span>Remove</span>
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium text-ink">
                <span>Title *</span>
                <input
                  value={item.title}
                  onChange={(event) => update(index, { title: event.target.value })}
                  placeholder="e.g. Official Tournament Rulebook"
                  className={fieldClass}
                />
              </label>

              <label className="grid gap-1.5 text-sm">
                Resource Kind
                <select
                  value={item.kind}
                  onChange={(event) => update(index, { kind: event.target.value as ResourceKind })}
                  className={fieldClass}
                >
                  <option value="card">Card (Notice / Informational)</option>
                  <option value="link">Web Link</option>
                  <option value="pdf">PDF Document (Download)</option>
                  <option value="video">Video Link (YouTube / Vimeo / MP4)</option>
                </select>
              </label>
            </div>

            <label className="grid gap-1.5 text-sm">
              Description / Notes (Optional)
              <textarea
                value={item.detail ?? ""}
                onChange={(event) => update(index, { detail: event.target.value || null })}
                rows={2}
                placeholder="Brief information shown under the title..."
                className={fieldClass}
              />
            </label>

            {/* URL input */}
            <div className="grid gap-1.5 text-sm">
              <span className="font-medium text-ink flex items-center justify-between">
                <span>
                  {isPdf ? "PDF Document URL" : isVideo ? "Video Stream URL" : "Link URL"}
                </span>
                {item.href ? (
                  <span className="text-[11px] font-mono text-emerald-700 flex items-center gap-1 font-normal">
                    <CheckCircle2 size={12} /> Link attached
                  </span>
                ) : null}
              </span>
              <input
                value={item.href ?? ""}
                onChange={(event) => update(index, { href: event.target.value || null })}
                placeholder={
                  isPdf
                    ? "https://cdn.iissboys.com/iissimages/Documents/rulebook.pdf or upload below"
                    : isVideo
                      ? "https://www.youtube.com/watch?v=... or https://youtu.be/... or Vimeo"
                      : "https://"
                }
                className={fieldClass}
              />
            </div>

            {/* Video guidance box */}
            {isVideo ? (
              <div className="rounded-xl border border-line/80 bg-wash/40 p-3 text-xs text-muted flex items-start gap-2">
                <Video size={16} className="text-accent shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-ink">Video Link Support</p>
                  <p>
                    Supports YouTube watch &amp; short links (<code className="bg-white px-1 py-0.5 rounded border border-line">youtube.com/watch?v=...</code>, <code className="bg-white px-1 py-0.5 rounded border border-line">youtu.be/...</code>), Vimeo videos, and direct MP4 streams.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Prominent RustFS PDF Upload Button for PDF Kind */}
            {isPdf ? (
              <div className="rounded-2xl border-2 border-dashed border-accent/40 bg-accent/5 p-4 sm:p-5 text-center">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  ref={(el) => {
                    fileInputRefs.current[index] = el;
                  }}
                  className="hidden"
                  onChange={(e) => handlePdfUpload(index, e)}
                />

                <div className="flex flex-col items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRefs.current[index]?.click()}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-ink hover:opacity-90 active:scale-[0.99] transition shadow-xs cursor-pointer disabled:opacity-60"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Uploading PDF via RustFS...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={18} />
                        <span>+ Upload PDF via RustFS</span>
                      </>
                    )}
                  </button>

                  <p className="text-xs text-muted max-w-sm">
                    Upload official campus circulars, directives, permission slips, or rulebooks directly to RustFS.
                  </p>

                  {err ? (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg mt-1">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{err}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
