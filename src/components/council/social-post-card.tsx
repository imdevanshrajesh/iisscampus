"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, Heart, MessageCircle, Share2 } from "lucide-react";
import { InstagramMark } from "@/components/brand/instagram-mark";
import type { SocialPost } from "@/lib/types";

function extractInstagramId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const index = parts.findIndex((p) => p === "p" || p === "reel" || p === "tv");
    if (index !== -1 && parts[index + 1]) {
      return parts[index + 1];
    }
    return parts[0] ?? null;
  } catch {
    return null;
  }
}

export function SocialPostCard({ post }: { post: SocialPost }) {
  const [copied, setCopied] = useState(false);
  const postId = extractInstagramId(post.instagramUrl);
  const is12th = post.councilTag === "12th";
  const is11th = post.councilTag === "11th";
  const customTag = post.councilTag && post.councilTag !== "all" ? post.councilTag : null;
  const councilName = is12th
    ? "12th Council · SciXcom"
    : is11th
      ? "11th Council · IISS"
      : customTag
        ? `Student Council · ${customTag}`
        : "Student Council · Boys";
  const councilHandle = is12th ? "@scixcom.27" : "@iisscampus";
  const embedUrl = postId ? `https://www.instagram.com/p/${postId}/embed` : null;

  const dateFormatted = post.publishedOn
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
        new Date(post.publishedOn),
      )
    : null;

  function copyLink() {
    navigator.clipboard?.writeText(post.instagramUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#0d3560]/90 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-accent/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-4 bg-wash/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-xs">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-surface text-ink">
              <InstagramMark />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-ink">{councilHandle}</span>
              <span
                className={
                  is12th
                    ? "rounded-full bg-accent/20 border border-accent/30 px-1.5 py-0.5 text-[10px] font-semibold text-accent"
                    : is11th
                      ? "rounded-full bg-sky/20 border border-sky/30 px-1.5 py-0.5 text-[10px] font-semibold text-sky"
                      : "rounded-full bg-white/10 border border-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white/90"
                }
              >
                {is12th ? "12th · SciXcom" : is11th ? "11th" : customTag || "Council"}
              </span>
            </div>
            <p className="text-[11px] text-muted">{councilName}</p>
          </div>
        </div>

        <span className="text-xs text-muted tabular-nums">{dateFormatted}</span>
      </div>

      {/* Media or Embed Preview */}
      <div className="relative aspect-square w-full overflow-hidden bg-wash/70">
        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt={post.caption || "Instagram photograph"}
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : embedUrl ? (
          <iframe
            src={embedUrl}
            className="h-full w-full border-0"
            scrolling="no"
            loading="lazy"
            allowTransparency
            title={`Instagram post ${post.id}`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md">
              <InstagramMark />
            </div>
            <p className="text-sm font-medium text-ink">View post on Instagram</p>
            <a
              href={post.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-[#08274b] shadow-sm transition hover:bg-accent/90"
            >
              <span>Open reel / post</span>
              <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>

      {/* Caption & Actions */}
      <div className="flex flex-1 flex-col justify-between p-4.5">
        {post.caption ? (
          <p className="text-sm leading-6 text-ink/90 whitespace-pre-line line-clamp-4">
            {post.caption}
          </p>
        ) : (
          <p className="text-xs italic text-muted">Post pinned from the official council feed.</p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
          <div className="flex items-center gap-3 text-muted">
            <span className="flex items-center gap-1 text-xs">
              <Heart size={15} className="text-rose-400" />
              <span>Pinned</span>
            </span>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1 text-xs text-muted transition hover:text-ink"
              title="Copy post link"
            >
              <Share2 size={14} />
              <span>{copied ? "Copied!" : "Share"}</span>
            </button>
          </div>

          <a
            href={post.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-white/20 hover:text-accent"
          >
            <span>Instagram</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </article>
  );
}
