"use client";

import { useActionState, useState } from "react";
import { ImageUrlHint } from "@/components/manage/image-url-hint";
import { saveNewsletter } from "@/lib/manage/actions";
import { IMAGE_URL_EXAMPLE } from "@/lib/media/guide";
import type { Newsletter } from "@/lib/types";

const fieldClass = "mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm";

export function NewsletterForm({ newsletter }: { newsletter: Newsletter | null }) {
  const [state, action, pending] = useActionState(saveNewsletter, {});
  const [title, setTitle] = useState(newsletter?.title ?? "");
  const [pdfUrl, setPdfUrl] = useState(newsletter?.pdfUrl ?? "");
  const [href, setHref] = useState(newsletter?.href ?? "");
  const [published, setPublished] = useState(newsletter?.published ?? false);

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
    <form action={action} onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <label className="block text-sm">
        <span>
          Title <span className="text-red-500 font-bold">*</span>
        </span>
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={fieldClass}
          required
        />
      </label>
      <label className="block text-sm">
        Cover image URL
        <input
          name="imageUrl"
          defaultValue={newsletter?.imageUrl ?? ""}
          className={fieldClass}
          placeholder={IMAGE_URL_EXAMPLE}
        />
      </label>
      <ImageUrlHint />
      <label className="block text-sm">
        <span>
          PDF download URL {published && !href.trim() && <span className="text-red-500 font-bold">*</span>}
        </span>
        <input
          name="pdfUrl"
          value={pdfUrl}
          onChange={(e) => setPdfUrl(e.target.value)}
          placeholder="https://"
          className={fieldClass}
        />
      </label>
      <label className="block text-sm">
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
      </label>
      <p className="text-sm text-muted">
        Publish with a PDF, an alternate link, or both. The public page shows Download PDF when a PDF URL is set.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input
          name="published"
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
        />
        Show on the site
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
        disabled={pending || !isFormValid}
        className="rounded-full bg-navy px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save newsletter"}
      </button>
    </form>
  );
}
