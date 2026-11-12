"use client";

import { useState } from "react";
import { InstagramMark } from "@/components/brand/instagram-mark";
import { SocialPostForm } from "@/components/manage/social-post-form";
import type { SocialPost } from "@/lib/types";

type SocialFilter = "all" | "drafts" | "pinned";

export function SocialPostsManager({
  posts,
  defaultAcademicYear,
}: {
  posts: SocialPost[];
  defaultAcademicYear: string | null;
}) {
  const [filter, setFilter] = useState<SocialFilter>("all");

  const draftsCount = posts.filter((post) => !post.pinned).length;
  const pinnedCount = posts.length - draftsCount;

  const visiblePosts =
    filter === "drafts"
      ? posts.filter((post) => !post.pinned)
      : filter === "pinned"
        ? posts.filter((post) => post.pinned)
        : posts;

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer ${
      active
        ? "bg-navy text-white shadow-xs"
        : "border border-line bg-white text-muted hover:text-ink"
    }`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => setFilter("all")} className={tabClass(filter === "all")}>
            <span>All</span>
            <span className="opacity-75">({posts.length})</span>
          </button>
          <button type="button" onClick={() => setFilter("drafts")} className={tabClass(filter === "drafts")}>
            <span>Drafts</span>
            <span className={draftsCount > 0 && filter !== "drafts" ? "font-bold text-amber-700" : "opacity-75"}>
              ({draftsCount})
            </span>
          </button>
          <button type="button" onClick={() => setFilter("pinned")} className={tabClass(filter === "pinned")}>
            <span>Pinned</span>
            <span className="opacity-75">({pinnedCount})</span>
          </button>
        </div>
        <span className="text-xs text-muted">Latest on top · Drafts stay private until pinned</span>
      </div>

      {visiblePosts.length ? (
        <div className="grid gap-4">
          {visiblePosts.map((post) => (
            <SocialPostForm
              key={`${post.id}:${post.pinned}`}
              post={post}
              defaultAcademicYear={defaultAcademicYear}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-line bg-wash/30 p-8 text-center">
          <div className="mx-auto flex justify-center text-muted/60">
            <InstagramMark size={32} />
          </div>
          <p className="mt-3 text-base font-medium text-ink">
            {filter === "drafts"
              ? "No draft posts waiting"
              : filter === "pinned"
                ? "No pinned posts yet"
                : "No social posts yet"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {filter === "drafts"
              ? "Click Auto-pull new posts & reels above to import fresh posts as drafts."
              : "Add an Instagram post on the left or publish a draft."}
          </p>
        </div>
      )}
    </div>
  );
}
