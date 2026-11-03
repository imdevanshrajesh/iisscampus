"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, X, Maximize2 } from "lucide-react";
import { ManageAiAgent } from "@/components/manage/manage-ai-agent";
import type { AiProvider } from "@/lib/ai/providers";
import type { Category } from "@/lib/types";

export function FloatingManageAi({
  initialProvider,
  initialApiKey,
  initialModel,
  initialBaseUrl,
  categories = [],
}: {
  initialProvider?: AiProvider;
  initialApiKey?: string;
  initialModel?: string;
  initialBaseUrl?: string;
  categories?: Category[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // If already on the dedicated full-screen /manage/ai page, hide floating button to avoid redundancy
  const isDedicatedAiPage = pathname === "/manage/ai";

  // Keyboard shortcut: Cmd + K / Ctrl + K opens/closes AI copilot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (isDedicatedAiPage) return null;

  return (
    <>
      {/* Floating Pill Trigger */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex items-center gap-2.5 rounded-full bg-gradient-to-r from-navy via-indigo-950 to-navy text-white px-4 py-2.5 shadow-2xl hover:shadow-[0_10px_30px_rgba(20,27,56,0.35)] border border-white/20 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          aria-label="Open AI Assistant"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-accent group-hover:rotate-12 transition-transform">
            <Sparkles size={13} className="text-amber-300 animate-pulse" />
          </div>
          <span className="text-xs font-semibold tracking-wide">AI Assistant</span>
          <kbd className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/15 text-white/80 border border-white/10">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Slide-over Drawer Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        />
      )}

      {/* Slide-over Off-Canvas Panel */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl border-l border-line flex flex-col transform transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#fcfbf9] dark:bg-[#141926] dark:border-[#273347]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-950 dark:text-gray-100">
                AI Copilot &bull; Chat &amp; Add Events
              </h2>
              <p className="text-[11px] text-muted">
                Create events, notices, houses, wellness, or FAQs with 1-click
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/manage/ai"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-ink hover:bg-gray-100 dark:hover:bg-zinc-900 transition cursor-pointer"
              title="Open full page"
            >
              <Maximize2 size={15} />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-ink hover:bg-gray-100 dark:hover:bg-zinc-900 transition cursor-pointer"
              aria-label="Close drawer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Drawer Body (Scrollable Agent) */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <ManageAiAgent
            initialProvider={initialProvider}
            initialApiKey={initialApiKey}
            initialModel={initialModel}
            initialBaseUrl={initialBaseUrl}
            categories={categories}
          />
        </div>
      </aside>
    </>
  );
}
