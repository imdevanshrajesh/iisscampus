"use client";

import { useState } from "react";
import { ChevronDown, History } from "lucide-react";
import { SocialPostCard } from "@/components/council/social-post-card";
import type { SocialPost } from "@/lib/types";

export function SocialPostsArchive({ posts }: { posts: SocialPost[] }) {
  const [open, setOpen] = useState(false);

  if (!posts.length) return null;

  return (
    <section className="mt-12 overflow-hidden rounded-2xl border border-[rgba(141,180,214,0.22)] bg-[#0c335c]/72 shadow-[0_10px_28px_-18px_rgba(4,15,32,0.65)] transition hover:border-[rgba(127,178,220,0.55)]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.04] sm:px-6"
      >
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
            <History size={14} />
            <span>Previous Terms Archive</span>
          </p>
          <p className="mt-1 font-display text-xl text-ink sm:text-2xl">
            Earlier Instagram Highlights ({posts.length})
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[rgba(158,192,223,0.45)] bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-ink transition group-hover:border-[rgba(127,178,220,0.8)] group-hover:bg-white/[0.16]">
          <span>{open ? "Collapse" : "Expand"}</span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open ? (
        <div className="border-t border-line bg-[#08274b]/65 p-5 sm:p-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <SocialPostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
