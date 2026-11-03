import type { Metadata } from "next";
import { ManageAiAgent } from "@/components/manage/manage-ai-agent";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { readAiConfig } from "@/lib/data/file-content";
import { requireWorkspace } from "@/lib/manage/access";

export const metadata: Metadata = {
  title: "AI Content Operations | Manage",
};

export default async function ManageAiPage() {
  const access = await requireWorkspace();
  if (!access.ready) return <ManageUnavailable />;

  const aiConfig = readAiConfig();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 space-y-6">
      <div className="mb-2">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Desk · Operations</p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-ink">AI Content Assistant</h1>
        <p className="mt-1 text-sm text-muted">
          Future-proof multi-provider copilot (xAI Grok, OpenAI, OpenRouter, Google Gemini, and custom endpoints). Paste raw notes to auto-generate content, fill missing descriptions, identify upload requirements, and add records with 1 click.
        </p>
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
