"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, RefreshCw, Sparkles, AlertTriangle } from "lucide-react";
import { InstagramMark } from "@/components/brand/instagram-mark";
import { autoPullSocialPosts, type AutoPullActionState } from "@/lib/manage/actions";
import type { ConfiguredInstagramAccount } from "@/lib/social";

export function SocialAutoPullCard({
  accounts,
}: {
  accounts: ConfiguredInstagramAccount[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(autoPullSocialPosts, {} as AutoPullActionState);
  const lastRefreshedPullRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (state.pulledAt && state.pulledAt !== lastRefreshedPullRef.current) {
      lastRefreshedPullRef.current = state.pulledAt;
      router.refresh();
    }
  }, [state.pulledAt, router]);

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

        <form action={action} className="shrink-0">
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
                    {account.username ? `@${account.username}` : "Handle missing — update in Settings"}
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
                    Unavailable
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
          <span>{state.ok}</span>
        </div>
      ) : null}
    </section>
  );
}
