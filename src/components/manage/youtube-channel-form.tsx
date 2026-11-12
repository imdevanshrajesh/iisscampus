"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, BellRing } from "lucide-react";
import { YouTubeMark } from "@/components/brand/youtube-mark";
import { saveYouTubeSettings, type ActionState } from "@/lib/manage/actions";
import { extractYouTubeHandle, youtubeSubscribeUrl } from "@/lib/social";
import type { YouTubeChannelOverview } from "@/lib/social-pull";
import type { SocialLinks } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function YouTubeChannelForm({
  social,
  overview,
}: {
  social: SocialLinks;
  overview?: YouTubeChannelOverview | null;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveYouTubeSettings, {} as ActionState);
  const [url, setUrl] = useState(social.youtubeUrl);
  const [label, setLabel] = useState(social.youtubeLabel);
  const [description, setDescription] = useState(social.youtubeDescription);
  const [enabled, setEnabled] = useState(social.youtubeEnabled);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  const previewTitle = label.trim() || overview?.title || "IISS Boys";
  const previewHandle = extractYouTubeHandle(url) || overview?.handle || "@iissboys";
  const subscribeHref = youtubeSubscribeUrl(url || social.youtubeUrl);
  const openHref = url.trim() || social.youtubeUrl;

  return (
    <section
      id="youtube-channel"
      aria-labelledby="manage-youtube-heading"
      className="mt-12 rounded-2xl border border-line bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col gap-5 border-b border-line pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3.5 sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-red-200/80 bg-red-50 text-red-600">
            {overview?.avatarUrl ? (
              <img
                src={overview.avatarUrl}
                alt={`${previewTitle} YouTube avatar`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <YouTubeMark size={24} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 border border-red-200/80">
                <YouTubeMark size={11} /> YouTube Channel
              </span>
              <span className="text-xs font-medium text-muted">{previewHandle}</span>
              {overview?.subscriberText ? (
                <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">
                  {overview.subscriberText}
                </span>
              ) : null}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  enabled
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                    : "bg-amber-50 text-amber-800 border border-amber-200/70"
                }`}
              >
                {enabled ? "Shown on Socials page" : "Hidden on Socials page"}
              </span>
            </div>
            <h2 id="manage-youtube-heading" className="mt-1 text-lg font-medium tracking-tight text-ink">
              {previewTitle}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Displayed at the bottom of the Council Socials page with a direct Subscribe button.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <a
            href={subscribeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-red-500"
          >
            <BellRing size={15} />
            <span>Subscribe on YouTube</span>
            <ArrowUpRight size={14} />
          </a>
          <a
            href={openHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink shadow-xs hover:bg-wash"
          >
            <YouTubeMark size={15} className="text-red-600" />
            <span>Open Channel</span>
          </a>
        </div>
      </div>

      <form action={action} className="mt-5 grid max-w-2xl gap-4">
        <input type="hidden" name="youtubeFormPresent" value="1" />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Channel Link</span>
            <input
              name="youtubeUrl"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/@iissboys"
              className={fieldClass}
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Display Name</span>
            <input
              name="youtubeLabel"
              type="text"
              maxLength={60}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="IISS Boys"
              className={fieldClass}
            />
          </label>
        </div>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Channel Description</span>
          <textarea
            name="youtubeDescription"
            rows={2}
            maxLength={240}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Subscribe for campus highlights, events, and student council videos."
            className={fieldClass}
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="youtubeEnabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-line"
          />
          <span className="font-medium">Show YouTube Channel &amp; Subscribe section at the bottom of /council/socials</span>
        </label>

        {state.error ? <p className="text-sm font-medium text-red-600">{state.error}</p> : null}
        {state.ok ? <p className="text-sm font-medium text-accent">{state.ok}</p> : null}

        <div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy/90 cursor-pointer disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save YouTube channel"}
          </button>
        </div>
      </form>
    </section>
  );
}
