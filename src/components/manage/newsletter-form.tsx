"use client";

import { useActionState } from "react";
import { ImageUrlHint } from "@/components/manage/image-url-hint";
import { saveNewsletter } from "@/lib/manage/actions";
import { IMAGE_URL_EXAMPLE } from "@/lib/media/guide";
import type { Newsletter } from "@/lib/types";

const fieldClass = "mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm";

export function NewsletterForm({ newsletter }: { newsletter: Newsletter | null }) {
  const [state, action, pending] = useActionState(saveNewsletter, {});

  return (
    <form action={action} className="max-w-xl space-y-4">
      <label className="block text-sm">
        Title
        <input name="title" defaultValue={newsletter?.title ?? ""} className={fieldClass} required />
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
        PDF download URL
        <input
          name="pdfUrl"
          defaultValue={newsletter?.pdfUrl ?? ""}
          placeholder="https://"
          className={fieldClass}
        />
      </label>
      <label className="block text-sm">
        Alternate link
        <input name="href" defaultValue={newsletter?.href ?? ""} placeholder="https://" className={fieldClass} />
      </label>
      <p className="text-sm text-muted">
        Publish with a PDF, an alternate link, or both. The public page shows Download PDF when a PDF URL is set.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input name="published" type="checkbox" defaultChecked={newsletter?.published ?? false} />
        Show on the site
      </label>
      {state.error ? <p className="text-sm text-accent">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-ink">{state.ok}</p> : null}
      <button type="submit" disabled={pending} className="rounded-full bg-navy px-4 py-2 text-sm text-white">
        {pending ? "Saving" : "Save newsletter"}
      </button>
    </form>
  );
}
