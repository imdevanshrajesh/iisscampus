"use client";

import { useActionState, useRef, useState } from "react";
import { FileText, CheckCircle2, ExternalLink, Trash2 } from "lucide-react";
import { FormAutoSave } from "@/components/manage/form-auto-save";
import { ImageUploader } from "@/components/manage/image-uploader";
import { saveNewsletter } from "@/lib/manage/actions";
import type { Newsletter } from "@/lib/types";

const fieldClass = "mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm";

export function NewsletterForm({ newsletter }: { newsletter: Newsletter | null }) {
  const [state, action, pending] = useActionState(saveNewsletter, {});
  const [title, setTitle] = useState(newsletter?.title ?? "");
  const [imageUrl, setImageUrl] = useState(newsletter?.imageUrl ?? "");
  const [pdfUrl, setPdfUrl] = useState(newsletter?.pdfUrl ?? "");
  const [href, setHref] = useState(newsletter?.href ?? "");
  const [published, setPublished] = useState(newsletter?.published ?? false);
  const formRef = useRef<HTMLFormElement>(null);

  const missingFields: string[] = [];
  if (title.trim().length < 2) missingFields.push("Title (at least 2 characters)");
  if (published && !pdfUrl.trim() && !href.trim()) {
    missingFields.push("Either a PDF download URL or an Alternate link (required when publishing)");
  }
  const isFormValid = missingFields.length === 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isFormValid) {
      event.preventDefault();
      alert(`Please fill in required fields: ${missingFields.join(", ")}.`);
    }
  }

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <FormAutoSave
        formRef={formRef}
        draftKey="newsletter:singleton"
        serverAction={saveNewsletter}
        canAutoSaveServer={Boolean(title.trim() && (!published || pdfUrl.trim() || href.trim()))}
        externalSuccess={state.ok}
        externalError={state.error}
        watchValue={{ title, imageUrl, pdfUrl, href, published }}
        onRestoreDraft={(fields) => {
          const first = (key: string) => fields[key]?.[0];
          if (first("title") !== undefined) setTitle(first("title")!);
          if (first("imageUrl") !== undefined) setImageUrl(first("imageUrl")!);
          if (first("pdfUrl") !== undefined) setPdfUrl(first("pdfUrl")!);
          if (first("href") !== undefined) setHref(first("href")!);
          if ("published" in fields) setPublished(fields.published.length > 0);
        }}
      />
      <input type="hidden" name="imageUrl" value={imageUrl} />

      <label className="block text-sm font-medium text-ink">
        <span>
          Issue Title <span className="text-red-500 font-bold">*</span>
        </span>
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. November 2026 Monthly Issue"
          className={fieldClass}
          required
        />
      </label>

      {/* Cover Image Uploader */}
      <div>
        <ImageUploader
          name="newsletterCover"
          value={imageUrl}
          onChange={setImageUrl}
          folder="Newsletter"
          targetName={`newsletter-${title.trim() || "issue"}-cover`}
          label="Newsletter Cover Photograph"
          hint="Front page photograph or cover graphic for the newsletter. RustFS supported."
          aspectRatio="16:10"
        />
      </div>

      {/* PDF / Google Drive Download Section */}
      <div className="space-y-3 rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-2xs">
        <label className="block text-sm font-medium text-ink">
          <span className="flex items-center justify-between">
            <span>
              PDF / Google Drive Download URL {published && !href.trim() && <span className="text-red-500 font-bold">*</span>}
            </span>
            {pdfUrl ? (
              <span className="text-xs font-mono text-emerald-700 flex items-center gap-1 font-normal">
                <CheckCircle2 size={12} /> Link attached
              </span>
            ) : null}
          </span>
          <input
            name="pdfUrl"
            value={pdfUrl}
            onChange={(e) => setPdfUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/... or direct PDF link"
            className={fieldClass}
          />
          <span className="mt-1 block text-xs text-muted">
            Paste your Google Drive sharing link, cloud storage link, or direct PDF document URL.
          </span>
        </label>

        {pdfUrl ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3 sm:p-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shadow-2xs">
                <FileText size={20} />
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600/10 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  <CheckCircle2 size={12} /> Document Link Attached
                </span>
                <p className="mt-0.5 truncate font-mono text-xs text-ink/80 select-all" title={pdfUrl}>
                  {pdfUrl}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-wash transition"
              >
                <ExternalLink size={13} />
                <span>Test Link</span>
              </a>
              <button
                type="button"
                onClick={() => setPdfUrl("")}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100/60 transition cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <label className="block text-sm font-medium text-ink">
        <span>
          Alternate link {published && !pdfUrl.trim() && <span className="text-red-500 font-bold">*</span>}
        </span>
        <input
          name="href"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="https://"
          className={fieldClass}
        />
        <span className="mt-1 block text-xs text-muted">
          External publication link or online flipbook (optional if PDF is set).
        </span>
      </label>

      <p className="text-xs text-muted">
        Publish with a PDF, an alternate link, or both. The public page shows Download PDF when a PDF URL is set.
      </p>

      <label className="flex items-center gap-2 text-sm font-medium text-ink pt-2">
        <input
          name="published"
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
        />
        Show on the site (Published)
      </label>

      {missingFields.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
          <span className="font-semibold">Required:</span> {missingFields.join(", ")}
        </div>
      )}

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-navy/90 transition disabled:opacity-50"
      >
        {pending ? "Saving issue..." : "Save Newsletter Issue"}
      </button>
    </form>
  );
}
