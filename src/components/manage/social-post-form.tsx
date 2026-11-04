"use client";

import { useActionState, useState } from "react";
import { deleteSocialPost, saveSocialPost, type ActionState } from "@/lib/manage/actions";
import type { SocialPost } from "@/lib/types";
import { ChevronDown, ExternalLink, Pin, Trash2 } from "lucide-react";
import { InstagramMark } from "@/components/brand/instagram-mark";
import { ImageUploader } from "@/components/manage/image-uploader";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function SocialPostForm({ post }: { post: SocialPost | null }) {
  const [state, action, pending] = useActionState(saveSocialPost, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteSocialPost, {} as ActionState);
  const [url, setUrl] = useState(post?.instagramUrl ?? "");
  const [imageUrl, setImageUrl] = useState(post?.imageUrl ?? "");
  const [clientError, setClientError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(!post); // Collapsed by default for existing posts

  const isFormValid = url.trim().length >= 5 && (url.includes("instagram.com") || url.includes("instagr.am"));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!isFormValid) {
      e.preventDefault();
      setClientError("Please enter a valid Instagram post or reel address before saving.");
      return;
    }
    setClientError(null);
  };

  // Extract a readable Instagram snippet
  const captionPreview = post?.caption?.trim() || post?.instagramUrl || "Instagram Post";
  const postCode = post?.instagramUrl?.match(/\/(?:p|reel)\/([A-Za-z0-9_-]+)/)?.[1] ?? "";

  return (
    <div className="rounded-xl border border-line bg-white shadow-xs overflow-hidden transition-all duration-200">
      {/* Collapsible Accordion Bar for Existing Posts */}
      {post ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left hover:bg-wash/40 transition cursor-pointer select-none border-b border-transparent data-[open=true]:border-line/70"
          data-open={isOpen}
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-50 border border-pink-200/60 text-accent">
              <InstagramMark size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-ink truncate">
                  {postCode ? `Post #${postCode}` : "Instagram Post"}
                </span>
                <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-navy/10 text-navy">
                  {post.councilTag}
                </span>
                {post.pinned ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                    <Pin size={10} className="fill-emerald-600" /> Pinned
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-muted bg-gray-100 px-2 py-0.5 rounded-full">
                    Hidden
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted truncate max-w-md">
                {captionPreview}
              </p>
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

      {/* Expanded Form Content */}
      <div className={`p-4 sm:p-5 ${post && !isOpen ? "hidden" : "block"}`}>
        <form action={action} onSubmit={handleSubmit} noValidate className="grid gap-3.5">
          {post ? <input type="hidden" name="id" value={post.id} /> : null}

          {clientError ? <p className="rounded-xl border border-red-300 bg-red-50 text-red-900 px-4 py-3 text-sm font-medium">{clientError}</p> : null}

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium flex items-center gap-1.5">
              <span className="text-accent">
                <InstagramMark size={15} />
              </span>{" "}
              Instagram Post or Reel Link <span className="text-red-500 font-bold" title="Required">*</span>
            </span>
            <input
              name="instagramUrl"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className={fieldClass}
              placeholder="https://www.instagram.com/p/DB123456789/ or https://www.instagram.com/reel/..."
            />
          </label>
          <p className="text-xs text-muted">
            Paste the direct Instagram post or reel link. Pinned posts will appear in the Socials page.
          </p>

          {url && (
            <div className="flex items-center gap-2 text-xs text-accent">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                <span>Test link in Instagram</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Caption / Note (optional)</span>
            <textarea
              name="caption"
              defaultValue={post?.caption ?? ""}
              rows={2}
              maxLength={1000}
              className={fieldClass}
              placeholder="Event highlights, victory celebration, or announcement text..."
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Council Tag</span>
              <select name="councilTag" defaultValue={post?.councilTag ?? "12th"} className={fieldClass}>
                <option value="12th">12th Student Council (SciXcom)</option>
                <option value="11th">11th Student Council</option>
                <option value="all">General / Campus</option>
              </select>
            </label>

            <div className="space-y-1">
              <input type="hidden" name="imageUrl" value={imageUrl} />
              <ImageUploader
                name="socialImageUpload"
                value={imageUrl}
                onChange={setImageUrl}
                folder="Socials"
                targetName={`social-${postCode || "instagram-post"}`}
                label="Preview Photograph (Optional)"
                hint="Upload a social preview image to the Socials folder or enter URL."
                aspectRatio="1:1"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <label className="grid max-w-32 gap-1 text-sm">
              <span className="font-medium">Order</span>
              <input
                type="number"
                name="sortOrder"
                defaultValue={post?.sortOrder ?? 0}
                className={fieldClass}
                placeholder="0 (lowest first)"
              />
            </label>

            <label className="flex items-center gap-2 text-sm pt-4">
              <input
                type="checkbox"
                name="pinned"
                defaultChecked={post?.pinned ?? true}
                className="h-4 w-4 rounded border-line"
              />
              <span className="font-medium">Pinned on Socials page</span>
            </label>
          </div>

          {state.error ? <p className="text-sm text-red-600 font-medium">{state.error}</p> : null}
          {state.ok ? <p className="text-sm text-accent font-medium">{state.ok}</p> : null}

          {!isFormValid && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200/80 px-3 py-2 text-xs text-amber-900">
              <span className="font-bold shrink-0">Required (*):</span>
              <span>Enter a valid Instagram link to pin.</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <button
              type="submit"
              disabled={pending || !isFormValid}
              className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? "Saving..." : post ? "Save changes" : "Pin new post"}
            </button>
            {post && (
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

        {post ? (
          <form
            action={deleteAction}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 mt-4 pt-3.5"
          >
            <input type="hidden" name="id" value={post.id} />
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" name="confirm" value="yes" className="h-3.5 w-3.5 rounded border-line" />
              <span>Confirm delete post</span>
            </label>
            <button
              type="submit"
              disabled={deleting}
              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={12} />
              <span>{deleting ? "Deleting..." : "Delete post"}</span>
            </button>
            {deleteState.error ? <p className="text-xs text-red-600 w-full">{deleteState.error}</p> : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}
