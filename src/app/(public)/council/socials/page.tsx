import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { InstagramMark } from "@/components/brand/instagram-mark";
import { SocialPostCard } from "@/components/council/social-post-card";
import { getPublicSocial, getPublicSocialPosts } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Socials · Student Council",
  description: "Official Instagram posts and accounts from the boys' student council.",
  alternates: { canonical: "/council/socials" },
};

export default async function CouncilSocialsPage() {
  const [social, posts] = await Promise.all([getPublicSocial(), getPublicSocialPosts()]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      {/* Header */}
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Student Council · Boys</p>
        <h1 className="font-display mt-3 text-4xl text-ink sm:text-5xl md:text-6xl">
          Council <span className="italic text-accent">Socials</span>
        </h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Official Instagram handles, event drops, and pinned highlights from the 12th and 11th Student Councils.
        </p>
      </div>

      {/* Top 2 Council Instagram Buttons (12th is SciXcom, 11th is Main) */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {/* 12th Council Button (SciXcom) */}
        <a
          href={social.scixcomInstagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-surface/80 p-5 shadow-lg backdrop-blur-xs transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:bg-wash"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md transition group-hover:scale-105">
              <InstagramMark />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg text-ink group-hover:text-accent transition">
                  12th Student Council
                </span>
                <span className="rounded-full bg-accent/20 border border-accent/30 px-2 py-0.5 text-[10px] font-semibold text-accent">
                  {social.scixcomLabel || "SciXcom"}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                {social.scixcomLabel || "SciXcom"} · @scixcom.27
              </p>
            </div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-ink transition group-hover:bg-accent group-hover:text-[#08274b]">
            <ArrowUpRight size={18} />
          </div>
        </a>

        {/* 11th Council Button */}
        <a
          href={social.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-surface/80 p-5 shadow-lg backdrop-blur-xs transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:bg-wash"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md transition group-hover:scale-105">
              <InstagramMark />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg text-ink group-hover:text-accent transition">
                  11th Student Council
                </span>
                <span className="rounded-full bg-sky/20 border border-sky/30 px-2 py-0.5 text-[10px] font-semibold text-sky">
                  {social.instagramLabel || "Instagram"}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                {social.instagramLabel || "Instagram"} · @iisscampus
              </p>
            </div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-ink transition group-hover:bg-accent group-hover:text-[#08274b]">
            <ArrowUpRight size={18} />
          </div>
        </a>
      </div>

      {/* Pinned Posts Feed */}
      <div className="mt-14">
        <div className="flex items-end justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Pinned Posts</p>
            <h2 className="font-display text-2xl text-ink md:text-3xl">Latest on Instagram</h2>
          </div>
          <span className="text-xs text-muted">{posts.length} {posts.length === 1 ? "post" : "posts"} pinned</span>
        </div>

        {posts.length ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <SocialPostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-white/10 bg-surface/60 p-12 text-center shadow-lg backdrop-blur-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-wash text-muted">
              <InstagramMark size={28} />
            </div>
            <h3 className="mt-4 font-display text-2xl text-ink">No Pinned Posts</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              No pinned posts found in the database. Posts pinned from the admin Content Desk (/manage/socials) will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
