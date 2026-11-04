"use client";

import { useActionState, useState, useRef } from "react";
import { UploadCloud, RefreshCw, FileText, CheckCircle2, AlertCircle, ExternalLink, Trash2 } from "lucide-react";
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

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

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

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPdf(true);
    setPdfError(null);

    try {
      const cleanTitle = title.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-") || "issue";
      const formData = new FormData();
      formData.append("file", file, `newsletter-${cleanTitle}.pdf`);
      formData.append("folder", "Newsletter");

      const res = await fetch("/api/manage/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data?.url) {
        setPdfUrl(data.url);
        if (!title.trim()) {
          const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
          setTitle(cleanName);
        }
      } else {
        setPdfError(data?.error || "Could not upload newsletter PDF.");
      }
    } catch {
      setPdfError("Error uploading newsletter PDF. Please check network connection.");
    } finally {
      setUploadingPdf(false);
      if (pdfInputRef.current) {
        pdfInputRef.current.value = "";
      }
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit} className="max-w-xl space-y-5">
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

      {/* PDF Download Section with RustFS Upload */}
      <div className="space-y-2 rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-2xs">
        <label className="block text-sm font-medium text-ink">
          <span className="flex items-center justify-between">
            <span>
              PDF Download URL {published && !href.trim() && <span className="text-red-500 font-bold">*</span>}
            </span>
            {pdfUrl ? (
              <span className="text-xs font-mono text-emerald-700 flex items-center gap-1 font-normal">
                <CheckCircle2 size={12} /> PDF Attached
              </span>
            ) : null}
          </span>
          <input
            name="pdfUrl"
            value={pdfUrl}
            onChange={(e) => setPdfUrl(e.target.value)}
            placeholder="https://cdn.iissboys.com/iissimages/Newsletter/... or upload below"
            className={fieldClass}
          />
        </label>

        {/* PDF Upload / Attached status */}
        <input
          type="file"
          accept=".pdf,application/pdf"
          ref={pdfInputRef}
          className="hidden"
          onChange={handlePdfUpload}
        />

        {pdfUrl ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shadow-2xs">
                <FileText size={22} />
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600/10 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  <CheckCircle2 size={12} /> Newsletter PDF Attached
                </span>
                <p className="mt-1 truncate font-mono text-xs text-ink/80 select-all" title={pdfUrl}>
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
                <span>Open PDF</span>
              </a>
              <button
                type="button"
                disabled={uploadingPdf}
                onClick={() => pdfInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-wash transition"
              >
                <RefreshCw size={13} className={uploadingPdf ? "animate-spin" : ""} />
                <span>{uploadingPdf ? "Uploading..." : "Replace"}</span>
              </button>
              <button
                type="button"
                onClick={() => setPdfUrl("")}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100/60 transition"
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 p-4 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <button
                type="button"
                disabled={uploadingPdf}
                onClick={() => pdfInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-ink hover:opacity-90 active:scale-[0.99] transition shadow-xs cursor-pointer disabled:opacity-60"
              >
                {uploadingPdf ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Uploading Newsletter PDF via RustFS...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={18} />
                    <span>+ Upload Newsletter PDF via RustFS</span>
                  </>
                )}
              </button>
              <p className="text-xs text-muted">
                Directly upload this month&apos;s full PDF edition to the Newsletter folder in RustFS.
              </p>
            </div>
          </div>
        )}

        {pdfError ? (
          <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg mt-1">
            <AlertCircle size={14} className="shrink-0" />
            <span>{pdfError}</span>
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
