import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Megaphone, ArrowLeft, Shield } from "lucide-react";
import { ManageAiAgent } from "@/components/manage/manage-ai-agent";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { ManageThemeToggle } from "@/components/manage/manage-theme";
import { getAiConfig } from "@/lib/data/queries";
import { requireWorkspace } from "@/lib/manage/access";

export const metadata: Metadata = {
  title: "AI Content Operations | Manage",
};

export default async function ManageAiPage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;

  const aiConfig = await getAiConfig();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/manage"
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Desk &bull; Operations</span>
            </Link>
            <span className="text-muted text-xs">&bull;</span>
            <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-orange-800">
              Copilot Engine
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            AI Content Assistant &amp; Event Planner
          </h1>
          <p className="mt-1 text-sm text-muted max-w-2xl">
            Chat conversationally to create and publish campus events, announcements, and house points in real-time. Works automatically out of the box with optional Grok, OpenAI, or Gemini backends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ManageThemeToggle variant="default" />
          <Link
            href="/manage/events"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 dark:border-zinc-800 bg-white dark:bg-black px-3.5 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors shadow-xs"
          >
            <Calendar className="h-4 w-4" />
            <span>Events Workspace</span>
          </Link>
          <Link
            href="/manage/announcements"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 dark:border-zinc-800 bg-white dark:bg-black px-3.5 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors shadow-xs"
          >
            <Megaphone className="h-4 w-4" />
            <span>Notices</span>
          </Link>
        </div>
      </div>

      <ManageAiAgent
        initialProvider={aiConfig.provider}
        initialApiKey={aiConfig.apiKey ?? ""}
        initialModel={aiConfig.model}
        initialBaseUrl={aiConfig.baseUrl ?? ""}
        categories={access.workspace.categories}
      />
    </div>
  );
}
