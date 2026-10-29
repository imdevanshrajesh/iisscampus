"use client";

import { useActionState, useState } from "react";
import { deleteSocialPost, saveSocialPost, type ActionState } from "@/lib/manage/actions";
import type { SocialPost } from "@/lib/types";
import { ExternalLink } from "lucide-react";
import { InstagramMark } from "@/components/brand/instagram-mark";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function SocialPostForm({ post }: { post: SocialPost | null }) {
  const [state, action, pending] = useActionState(saveSocialPost, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteSocialPost, {} as ActionState);
  const [url, setUrl] = useState(post?.instagramUrl ?? "");

  return (
    <div className="grid gap-4 rounded-xl border border-line p-5 bg-white shadow-xs">
      <form action={action} className="grid gap-3">
        {post ? <input type="hidden" name="id" value={post.id} /> : null}

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium flex items-center gap-1.5">
            <span className="text-accent"><InstagramMark size={15} /></span> Instagram Post or Reel Link
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
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
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

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Preview Image URL (optional)</span>
            <input
              name="imageUrl"
              defaultValue={post?.imageUrl ?? ""}
              className={fieldClass}
              placeholder="https://images.example.com/cover.jpg"
            />
          </label>
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

        <button
          type="submit"
          disabled={pending}
          className="justify-self-start mt-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy/90"
        >
          {post ? "Save changes" : "Pin new post"}
        </button>
      </form>

      {post ? (
        <form action={deleteAction} className="flex flex-wrap items-center gap-3 border-t border-line/70 pt-3">
          <input type="hidden" name="id" value={post.id} />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="confirm" value="yes" className="h-4 w-4 rounded border-line" />
            Confirm delete
          </label>
          <button
            type="submit"
            disabled={deleting}
            className="rounded-md border border-line px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
          >
            Delete post
          </button>
          {deleteState.error ? <p className="text-xs text-red-600">{deleteState.error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
