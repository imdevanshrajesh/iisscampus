import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { InstagramMark } from "@/components/brand/instagram-mark";
import { SocialPostCard } from "@/components/council/social-post-card";
import { SocialPostsArchive } from "@/components/council/social-posts-archive";
import { YouTubeChannelSection } from "@/components/council/youtube-channel-section";
import { getPublicCatalog, getPublicSocial, getPublicSocialPosts } from "@/lib/data/queries";
import { extractInstagramUsername } from "@/lib/social";
import { fetchYouTubeChannelOverview } from "@/lib/social-pull";
import { filterSocialPostsForTerm, hasActiveTerm, partitionCouncilYears } from "@/lib/terms";

export const metadata: Metadata = {
  title: "Socials · Student Council",
  description: "Official Instagram posts, reels, YouTube channel, and accounts from the boys' student council.",
  alternates: { canonical: "/council/socials" },
};

export default async function CouncilSocialsPage() {
  const [social, posts, catalog] = await Promise.all([
    getPublicSocial(),
    getPublicSocialPosts(),
    getPublicCatalog(),
  ]);
  const youtubeOverview =
    social.youtubeEnabled && social.youtubeUrl
      ? await fetchYouTubeChannelOverview(social.youtubeUrl)
      : null;
  const scixcomUsername = extractInstagramUsername(social.scixcomInstagramUrl);
  const instagramUsername = extractInstagramUsername(social.instagramUrl);
  const handles = {
    scixcomHandle: scixcomUsername ? `@${scixcomUsername}` : null,
    scixcomLabel: social.scixcomLabel,
    instagramHandle: instagramUsername ? `@${instagramUsername}` : null,
    instagramLabel: social.instagramLabel,
  };

  const { primary, collapsed } = partitionCouncilYears(catalog.councilYears);
  const termConfigured = hasActiveTerm(catalog.activeTerm);
  const currentPosts = termConfigured ? filterSocialPostsForTerm(posts, catalog.activeTerm) : posts;
  const currentIds = new Set(currentPosts.map((post) => post.id));
  const archivedPosts = termConfigured ? posts.filter((post) => !currentIds.has(post.id)) : [];

  const primaryTitle = primary?.label
    ? `${primary.label} Student Council`
    : "Current Student Council";
  const campusTitle = collapsed[0]?.label
    ? `${collapsed[0].label} & Campus Archive`
    : "Campus Student Council";

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      {/* Header */}
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Student Council · Boys</p>
        <h1 className="font-display mt-3 text-4xl text-ink sm:text-5xl md:text-6xl">
          Council <span className="italic text-accent">Socials</span>
        </h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Official Instagram handles, event drops, and pinned highlights from the sitting and previous Student Councils.
        </p>
      </div>

      {/* Top Council Instagram Buttons */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <a
          href={social.scixcomInstagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/12 bg-[#0d3560]/90 p-5 shadow-lg transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:bg-[#113f70]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md transition group-hover:scale-105">
              <InstagramMark />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-lg text-ink group-hover:text-accent transition">
                  {primaryTitle}
                </span>
                <span className="rounded-full bg-accent/20 border border-accent/30 px-2 py-0.5 text-[10px] font-semibold text-accent">
                  {social.scixcomLabel || "SciXcom"}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                {social.scixcomLabel || "Council"} · Official Term Account
              </p>
            </div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-ink transition group-hover:bg-accent group-hover:text-[#08274b]">
            <ArrowUpRight size={18} />
          </div>
        </a>

        <a
          href={social.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/12 bg-[#0d3560]/90 p-5 shadow-lg transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:bg-[#113f70]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md transition group-hover:scale-105">
              <InstagramMark />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-lg text-ink group-hover:text-accent transition">
                  {campusTitle}
                </span>
                <span className="rounded-full bg-sky/20 border border-sky/30 px-2 py-0.5 text-[10px] font-semibold text-sky">
                  {social.instagramLabel || "Instagram"}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                {social.instagramLabel || "Instagram"} · Campus Feed
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
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {termConfigured && catalog.activeTerm.label ? `Pinned Posts · ${catalog.activeTerm.label}` : "Pinned Posts"}
            </p>
            <h2 className="font-display text-2xl text-ink md:text-3xl">Latest on Instagram</h2>
          </div>
          <span className="text-xs text-muted">
            {currentPosts.length} {currentPosts.length === 1 ? "post" : "posts"} pinned
          </span>
        </div>

        {currentPosts.length ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {currentPosts.map((post) => (
              <SocialPostCard key={post.id} post={post} handles={handles} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-white/12 bg-[#0d3560]/80 p-12 text-center shadow-lg">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-wash text-muted">
              <InstagramMark size={28} />
            </div>
            <h3 className="mt-4 font-display text-2xl text-ink">
              {archivedPosts.length
                ? `No Pinned Posts in ${catalog.activeTerm.label || "Current Term"} Yet`
                : "No Pinned Posts"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              Posts pinned for the current term from the Content Desk (/manage/socials) will appear here.
            </p>
          </div>
        )}

        <SocialPostsArchive posts={archivedPosts} handles={handles} />
      </div>

      {social.youtubeEnabled && social.youtubeUrl ? (
        <YouTubeChannelSection social={social} overview={youtubeOverview} />
      ) : null}
    </div>
  );
}
