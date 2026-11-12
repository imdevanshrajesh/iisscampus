import { ArrowUpRight, BellRing, Play } from "lucide-react";
import { YouTubeMark } from "@/components/brand/youtube-mark";
import { extractYouTubeHandle, youtubeSubscribeUrl } from "@/lib/social";
import type { YouTubeChannelOverview } from "@/lib/social-pull";
import type { SocialLinks } from "@/lib/types";

function formatPublishedDate(raw: string): string | null {
  if (!raw) return null;
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(parsed));
  } catch {
    return null;
  }
}

export function YouTubeChannelSection({
  social,
  overview,
}: {
  social: SocialLinks;
  overview: YouTubeChannelOverview | null;
}) {
  const channelUrl = social.youtubeUrl;
  const subscribeHref = youtubeSubscribeUrl(channelUrl);
  const displayTitle = social.youtubeLabel || overview?.title || "IISS Boys";
  const handle = overview?.handle || extractYouTubeHandle(channelUrl);
  const avatarUrl = overview?.avatarUrl || null;
  const subscriberText = overview?.subscriberText || null;
  const description =
    social.youtubeDescription ||
    "Campus highlights, events, council recaps, and student productions on YouTube.";
  const videos = overview?.videos ?? [];

  return (
    <section
      aria-labelledby="youtube-channel-heading"
      className="mt-16 rounded-3xl border border-[rgba(141,180,214,0.22)] bg-[#0c335c]/80 p-6 shadow-[0_14px_36px_-20px_rgba(4,15,32,0.7)] backdrop-blur-md sm:p-8"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4 sm:items-center">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-red-600/20 text-red-400">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${displayTitle} YouTube avatar`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <YouTubeMark size={30} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-red-300">
                <YouTubeMark size={12} />
                YouTube Channel
              </span>
              {handle ? (
                <span className="text-xs font-medium text-muted">{handle}</span>
              ) : null}
              {subscriberText ? (
                <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] font-medium text-muted">
                  {subscriberText}
                </span>
              ) : null}
            </div>

            <h2
              id="youtube-channel-heading"
              className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
            >
              {displayTitle}
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
          <a
            href={subscribeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500"
          >
            <BellRing size={15} />
            <span>Subscribe on YouTube</span>
            <ArrowUpRight size={14} />
          </a>

          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:border-gold hover:bg-white/10 hover:text-white"
          >
            <YouTubeMark size={15} className="text-red-400" />
            <span>Open Channel</span>
          </a>
        </div>
      </div>

      {videos.length > 0 ? (
        <div className="mt-8 border-t border-white/12 pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Latest Uploads
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.slice(0, 6).map((video) => {
              const publishedLabel = formatPublishedDate(video.published);
              return (
                <a
                  key={video.videoId}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group overflow-hidden rounded-2xl border border-white/12 bg-[#08274b]/70 transition hover:border-accent/60"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-wash">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2.5 right-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white transition group-hover:bg-red-600">
                      <Play size={14} fill="currentColor" />
                    </span>
                  </div>
                  <div className="p-3.5">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink transition group-hover:text-accent">
                      {video.title}
                    </p>
                    {publishedLabel ? (
                      <p className="mt-1 text-xs text-muted">{publishedLabel}</p>
                    ) : null}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
