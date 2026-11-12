import Link from "next/link";
import { SocialAutoPullCard } from "@/components/manage/social-auto-pull-card";
import { SocialPostForm } from "@/components/manage/social-post-form";
import { SocialPostsManager } from "@/components/manage/social-posts-manager";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { YouTubeChannelForm } from "@/components/manage/youtube-channel-form";
import { getEditableSocialPosts, getPublicSocial } from "@/lib/data/queries";
import { requireAdministrator } from "@/lib/manage/access";
import { resolveConfiguredInstagramAccounts } from "@/lib/social";
import { fetchYouTubeChannelOverview } from "@/lib/social-pull";
import { Settings, ExternalLink } from "lucide-react";
import { InstagramMark } from "@/components/brand/instagram-mark";

export default async function ManageSocialsPage() {
  const access = await requireAdministrator();
  if (!access.ready) return <ManageUnavailable />;

  const [posts, social] = await Promise.all([
    getEditableSocialPosts(),
    getPublicSocial(),
  ]);
  const [accounts, youtubeOverview] = await Promise.all([
    Promise.resolve(resolveConfiguredInstagramAccounts(social)),
    social.youtubeUrl ? fetchYouTubeChannelOverview(social.youtubeUrl) : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-accent">
            <InstagramMark size={20} />
            <span className="text-xs font-semibold uppercase tracking-wider">Social Feed</span>
          </div>
          <h1 className="mt-1 text-3xl font-medium tracking-tight text-ink">Social Posts &amp; YouTube</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Auto-pull recent Instagram posts and reels into Drafts, pin highlights to the public Council Socials page, and manage your YouTube channel subscribe card.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/council/socials"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink shadow-xs hover:bg-wash"
          >
            <span>View page</span>
            <ExternalLink size={14} />
          </Link>
          <Link
            href="/manage/settings#links"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink shadow-xs hover:bg-wash"
          >
            <Settings size={14} />
            <span>Council links</span>
          </Link>
        </div>
      </div>

      <SocialAutoPullCard accounts={accounts} />

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="text-lg font-medium tracking-tight text-ink mb-3">Add Instagram Post</h2>
          <SocialPostForm post={null} defaultAcademicYear={access.workspace.activeTerm.label} />
        </div>

        <div className="lg:col-span-7">
          <h2 className="text-lg font-medium tracking-tight text-ink mb-3">
            Manage Posts ({posts.length})
          </h2>
          <SocialPostsManager
            posts={posts}
            defaultAcademicYear={access.workspace.activeTerm.label}
          />
        </div>
      </div>

      <YouTubeChannelForm social={social} overview={youtubeOverview} />
    </div>
  );
}
