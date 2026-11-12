import Link from "next/link";
import { SocialPostForm } from "@/components/manage/social-post-form";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { getEditableSocialPosts } from "@/lib/data/queries";
import { requireAdministrator } from "@/lib/manage/access";
import { Settings, ExternalLink } from "lucide-react";
import { InstagramMark } from "@/components/brand/instagram-mark";

export default async function ManageSocialsPage() {
  const access = await requireAdministrator();
  if (!access.ready) return <ManageUnavailable />;
  const posts = await getEditableSocialPosts();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-accent">
            <InstagramMark size={20} />
            <span className="text-xs font-semibold uppercase tracking-wider">Social Feed</span>
          </div>
          <h1 className="mt-1 text-3xl font-medium tracking-tight text-ink">Pinned Social Posts</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Pin Instagram posts and reels to display on the Council Socials page. The latest posts are shown on top by default, or customize order with numbers.
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
            href="/manage/settings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink shadow-xs hover:bg-wash"
          >
            <Settings size={14} />
            <span>Council links</span>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="text-lg font-medium tracking-tight text-ink mb-3">Add Instagram Post</h2>
          <SocialPostForm post={null} defaultAcademicYear={access.workspace.activeTerm.label} />
        </div>

        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium tracking-tight text-ink">
              Pinned Posts ({posts.length})
            </h2>
            <span className="text-xs text-muted">Latest on top</span>
          </div>

          {posts.length ? (
            <div className="grid gap-4">
              {posts.map((post) => (
                <SocialPostForm key={post.id} post={post} defaultAcademicYear={access.workspace.activeTerm.label} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line p-8 text-center bg-wash/30">
              <div className="mx-auto flex justify-center text-muted/60">
                <InstagramMark size={32} />
              </div>
              <p className="mt-3 text-base font-medium text-ink">No pinned posts yet</p>
              <p className="mt-1 text-sm text-muted">
                Add your first Instagram post or reel link using the form on the left.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
