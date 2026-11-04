"use client";

import {
  FileText,
  Video,
  Link2,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  Plus,
  ExternalLink,
} from "lucide-react";
import type { ContentResource, ResourceKind } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function ResourceRepeater({
  resources,
  onChange,
  folder: _folder = "Documents",
}: {
  resources: ContentResource[];
  onChange: (resources: ContentResource[]) => void;
  folder?: string;
}) {
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
                  {isPdf ? "PDF / Document Link (Google Drive)" : isVideo ? "Video Stream URL" : "Link URL"}
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
                    ? "https://drive.google.com/file/d/... or direct document link"
                    : isVideo
                      ? "https://www.youtube.com/watch?v=... or https://youtu.be/... or Vimeo"
                      : "https://"
                }
                className={fieldClass}
              />
              {isPdf ? (
                <span className="text-xs text-muted">
                  Paste a Google Drive sharing link, cloud document link, or direct PDF link.
                </span>
              ) : null}
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

            {/* Attached PDF / Document Preview */}
            {isPdf && item.href ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3 sm:p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shadow-2xs">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600/10 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                      <CheckCircle2 size={12} /> Document Link Attached
                    </span>
                    <p className="mt-0.5 truncate font-mono text-xs text-ink/80 select-all" title={item.href}>
                      {item.href}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-wash transition"
                  >
                    <ExternalLink size={13} />
                    <span>Open Link</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => update(index, { href: null })}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100/60 transition cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
