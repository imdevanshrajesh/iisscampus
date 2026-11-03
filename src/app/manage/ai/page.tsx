import type { Metadata } from "next";
import { ManageAiAgent } from "@/components/manage/manage-ai-agent";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { readGrokConfig } from "@/lib/data/file-content";
import { requireWorkspace } from "@/lib/manage/access";

export const metadata: Metadata = {
  title: "AI Content Operations | Manage",
};

export default async function ManageAiPage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;

  const grokConfig = readGrokConfig();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Desk · Operations</p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-ink">AI Content Assistant</h1>
        <p className="mt-1 text-sm text-muted">
          Powered by xAI Grok. Paste raw notes, bullet points, or message drafts to auto-generate content, fill missing descriptions, identify upload requirements, and add records directly to any section.
        </p>
      </div>

      <ManageAiAgent
        initialApiKey={grokConfig.apiKey ?? ""}
        initialModel={grokConfig.model}
        categories={access.workspace.categories}
      />
    </div>
  );
}
