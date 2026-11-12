"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Link2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { InstagramMark } from "@/components/brand/instagram-mark";
import {
  autoPullSocialPosts,
  saveSocialPullFeeds,
  type ActionState,
  type AutoPullActionState,
} from "@/lib/manage/actions";
import type { ConfiguredInstagramAccount, SocialFeedConfig } from "@/lib/social";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function SocialAutoPullCard({
  accounts,
  feeds,
  hasTokenByKey,
  hasEnvFeedByKey,
}: {
  accounts: ConfiguredInstagramAccount[];
  feeds: SocialFeedConfig;
  hasTokenByKey: Record<ConfiguredInstagramAccount["key"], boolean>;
  hasEnvFeedByKey: Record<ConfiguredInstagramAccount["key"], boolean>;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(autoPullSocialPosts, {} as AutoPullActionState);
  const [feedState, feedAction, savingFeeds] = useActionState(saveSocialPullFeeds, {} as ActionState);
  const [setupOpen, setSetupOpen] = useState(false);
  const [scixcomFeedUrl, setScixcomFeedUrl] = useState(feeds.scixcomFeedUrl ?? "");
  const [instagramFeedUrl, setInstagramFeedUrl] = useState(feeds.instagramFeedUrl ?? "");
  const lastRefreshedPullRef = useRef<string | undefined>(undefined);
  const lastSavedFeedRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (state.pulledAt && state.pulledAt !== lastRefreshedPullRef.current) {
      lastRefreshedPullRef.current = state.pulledAt;
      router.refresh();
    }
  }, [state.pulledAt, router]);

  useEffect(() => {
    if (feedState.ok && feedState.ok !== lastSavedFeedRef.current) {
      lastSavedFeedRef.current = feedState.ok;
      router.refresh();
    }
  }, [feedState.ok, router]);

  const hasAccountFailure = Boolean(state.error || state.accountSummaries?.some((item) => !item.ok));
  const showSetup = setupOpen || hasAccountFailure || Boolean(feedState.error);

  const sourceLabelFor = (accountKey: ConfiguredInstagramAccount["key"]) => {
    if (hasTokenByKey[accountKey]) return "Graph API token";
    const uiFeed = accountKey === "scixcom" ? feeds.scixcomFeedUrl : feeds.instagramFeedUrl;
    if (uiFeed || hasEnvFeedByKey[accountKey]) return "Connected feed URL";
    return "Public profile (no feed connected)";
  };

  return (
    <section
      aria-labelledby="auto-pull-heading"
      className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-accent">
            <Sparkles size={15} />
            <span className="text-xs font-semibold uppercase tracking-wider">One-Click Sync</span>
          </div>
          <h2 id="auto-pull-heading" className="mt-1 text-lg font-medium tracking-tight text-ink">
            Auto-pull posts &amp; reels into Drafts
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
            Pulls recent posts and reels from both configured Instagram accounts. New items are saved as{" "}
            <strong className="font-medium text-ink">Drafts</strong> so you can review before publishing, and anything already saved is skipped automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setSetupOpen((prev) => !prev)}
            aria-expanded={showSetup}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm font-medium text-ink shadow-xs hover:bg-wash cursor-pointer"
          >
            <Link2 size={14} />
            <span>Feed setup</span>
            <ChevronDown size={14} className={`transition-transform ${showSetup ? "rotate-180" : ""}`} />
          </button>

          <form action={action}>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-navy/90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw size={15} className={pending ? "animate-spin" : ""} />
              <span>{pending ? "Pulling new posts..." : "Auto-pull new posts & reels"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Configured Accounts Strip */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {accounts.map((account) => {
          const summary = state.accountSummaries?.find((item) => item.key === account.key);
          return (
            <div
              key={account.key}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-wash/40 px-3.5 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-pink-200/70 bg-pink-50 text-accent">
                  <InstagramMark size={15} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-ink">{account.label}</span>
                    <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
                      {account.councilTag}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted">
                    {account.username ? `@${account.username}` : "Handle missing"} · {sourceLabelFor(account.key)}
                  </p>
                </div>
              </div>

              {summary ? (
                summary.ok ? (
                  <div className="shrink-0 text-right text-xs">
                    <p className="font-semibold text-emerald-700">+{summary.addedCount} drafts</p>
                    <p className="text-[11px] text-muted">
                      {summary.fetchedCount} checked · {summary.skippedCount} skipped
                    </p>
                  </div>
                ) : (
                  <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 border border-amber-200">
                    Needs feed / auth
                  </span>
                )
              ) : (
                <Link
                  href="/manage/settings#links"
                  className="shrink-0 text-xs font-medium text-muted hover:text-ink underline-offset-2 hover:underline"
                >
                  Change
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {state.error ? (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {state.ok ? (
        <div
          role="status"
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-700" />
          <div className="space-y-1">
            <p>{state.ok}</p>
          </div>
        </div>
      ) : null}

      {showSetup ? (
        <div className="mt-5 rounded-xl border border-line bg-wash/30 p-4 sm:p-5">
          <div className="max-w-3xl">
            <h3 className="text-sm font-semibold text-ink">
              Connect Instagram Feed URLs (Recommended for Vercel &amp; Login-Gated Accounts)
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted">
              Instagram blocks unauthenticated server scraping from cloud hosts and restricts some accounts when logged out. Paste a public{" "}
              <strong className="font-medium text-ink">Behold.so</strong> JSON feed URL or{" "}
              <strong className="font-medium text-ink">RSS / JSON feed</strong> URL for each account below so 1-click Auto-Pull never hits rate limits. Alternatively, set official Meta Graph API tokens in server environment variables (
              <code className="font-mono">INSTAGRAM_SCIXCOM_ACCESS_TOKEN</code> and{" "}
              <code className="font-mono">INSTAGRAM_CAMPUS_ACCESS_TOKEN</code>).
            </p>
          </div>

          <form action={feedAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs">
              <span className="font-medium text-ink">
                12th / SciXcom Feed URL ({accounts[0]?.label || "SciXcom"})
              </span>
              <input
                name="scixcomFeedUrl"
                type="url"
                value={scixcomFeedUrl}
                onChange={(e) => setScixcomFeedUrl(e.target.value)}
                placeholder="https://feeds.behold.so/..."
                className={fieldClass}
              />
            </label>

            <label className="grid gap-1 text-xs">
              <span className="font-medium text-ink">
                11th / Campus Feed URL ({accounts[1]?.label || "Instagram"})
              </span>
              <input
                name="instagramFeedUrl"
                type="url"
                value={instagramFeedUrl}
                onChange={(e) => setInstagramFeedUrl(e.target.value)}
                placeholder="https://feeds.behold.so/..."
                className={fieldClass}
              />
            </label>

            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-1">
              <div>
                {feedState.error ? <p className="text-xs font-medium text-red-600">{feedState.error}</p> : null}
                {feedState.ok ? <p className="text-xs font-medium text-emerald-700">{feedState.ok}</p> : null}
              </div>
              <button
                type="submit"
                disabled={savingFeeds}
                className="rounded-md border border-line bg-white px-3.5 py-1.5 text-xs font-medium text-ink shadow-xs hover:bg-wash cursor-pointer disabled:opacity-50"
              >
                {savingFeeds ? "Saving feed URLs..." : "Save feed URLs"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
