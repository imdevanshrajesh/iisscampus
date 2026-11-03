"use client";

import React, { useState } from "react";
import {
  Sparkles,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Wand2,
} from "lucide-react";
import type { CampusEvent, Category } from "@/lib/types";

type ChecklistItem = {
  item: string;
  required: boolean;
  detail: string;
};

export function EventAiCopilot({
  event,
  categories,
  onApply,
  onOpenPanel,
}: {
  event: CampusEvent | null;
  categories: Category[];
  onApply: (fields: Record<string, any>, checklist: ChecklistItem[]) => void;
  onOpenPanel?: (panelId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);

  const isEditing = Boolean(event);

  const handleEnhanceExisting = () => {
    if (!event) return;
    const notes = [
      `Title: ${event.title}`,
      event.shortDescription ? `Short description: ${event.shortDescription}` : "",
      event.fullDescription ? `Full description: ${event.fullDescription}` : "",
      event.eventDate ? `Date: ${event.eventDate}` : "",
      event.locationName ? `Location: ${event.locationName}` : "",
      event.purpose ? `Purpose: ${event.purpose}` : "",
      event.activities ? `Activities: ${event.activities}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    setPrompt(
      `Please enhance and complete this event details. Auto-generate comprehensive descriptions, refine purpose and activities, suggest a 3-4 item schedule, and tell me what is missing:\n${notes}`,
    );
  };

  const handleAutoFill = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("Please enter event notes, details, or instructions first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if client has local override key
      const clientKey = typeof window !== "undefined" ? localStorage.getItem("iiss_ai_api_key") || localStorage.getItem("iiss_grok_api_key") : null;

      const res = await fetch("/api/manage-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(clientKey ? { "x-ai-api-key": clientKey } : {}),
        },
        body: JSON.stringify({
          action: "fill-event",
          prompt: trimmed,
          targetSection: "event",
          currentEvent: event
            ? {
                title: event.title,
                shortDescription: event.shortDescription,
                fullDescription: event.fullDescription,
                eventDate: event.eventDate,
                locationName: event.locationName,
                categoryId: event.categoryId,
              }
            : null,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok || !json.data?.fields) {
        setError(json.error || "Failed to generate event fields with AI.");
      } else {
        const fields = json.data.fields;
        const generatedChecklist: ChecklistItem[] = Array.isArray(json.data.checklist)
          ? json.data.checklist
          : [];

        // Check if cover image is missing
        if (!event?.coverImageUrl && !fields.coverImageUrl) {
          if (!generatedChecklist.some((c) => c.item.toLowerCase().includes("cover"))) {
            generatedChecklist.unshift({
              item: "Cover Image",
              required: true,
              detail: "No cover image set. Upload a 16:9 banner to Cloudinary and paste the URL in the Cover Image section.",
            });
          }
        }

        // Check if registration is needed
        if (!event?.registrationEnabled && !fields.registrationEnabled) {
          if (!generatedChecklist.some((c) => c.item.toLowerCase().includes("registration"))) {
            generatedChecklist.push({
              item: "Registration Form",
              required: false,
              detail: "Registration is currently off. If students need to sign up, enable registration and add a Google Form link.",
            });
          }
        }

        setChecklist(generatedChecklist);
        setAppliedCount(Object.keys(fields).length);

        // Apply all generated fields to the form
        onApply(fields, generatedChecklist);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error contacting AI service.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-orange-200/90 bg-gradient-to-b from-orange-50/70 to-white p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-950 text-base">
                AI Event Copilot
              </h3>
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-800">
                Auto-Filler
              </span>
            </div>
            <p className="text-xs text-muted">
              {isEditing
                ? `Enhance & fill missing descriptions, schedule, or details for "${event.title}".`
                : "Paste raw notes, WhatsApp messages, or bullet points to auto-populate all event fields."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={handleEnhanceExisting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-800 hover:bg-orange-50 shadow-xs transition-colors"
            >
              <Wand2 className="h-3.5 w-3.5 text-orange-600" />
              <span>Load Current Event into Prompt</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-gray-900 transition-colors"
            title={isOpen ? "Collapse Copilot" : "Expand Copilot"}
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-3 pt-1">
          {/* Prompt Area */}
          <div>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'Inter-house football tournament next Wednesday 18 Nov from 3:30pm to 6pm at main turf for grades 7-12. Knockout rounds, penalties, and trophy. Free entry. Bring house jersey and cleats.'"
              className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-600 focus:outline-hidden shadow-2xs"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-muted">Quick ideas:</span>
            {[
              "⚽ Football Knockout Meet",
              "🔬 Robotics & Innovation Expo",
              "🎭 Annual Arts & Cultural Fest",
              "🏆 Debating Championship",
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() =>
                  setPrompt(
                    `Organizing ${preset} on next month's 15th at school campus auditorium from 9:00 AM to 1:00 PM for Grades 8-12. Generate full descriptions, schedule, and tell me what uploads are needed.`,
                  )
                }
                className="rounded-md border border-gray-200 bg-white/80 px-2.5 py-1 text-[11px] text-gray-700 hover:border-orange-500 hover:text-orange-700 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-orange-200/60 pt-3">
            <p className="text-[11px] text-muted">
              AI automatically fills title, slug, short & full descriptions, dates, category, and schedule.
            </p>
            <button
              type="button"
              onClick={handleAutoFill}
              disabled={loading || !prompt.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Auto-Filling Event Fields...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Auto-Fill Event with AI</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">AI Generation Issue</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Feedback & Missing Uploads Checklist Banner */}
          {appliedCount !== null && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-900 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>
                  Successfully auto-filled {appliedCount} fields in the form below!
                </span>
              </div>

              {checklist.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-emerald-200/80">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                    <UploadCloud className="h-4 w-4 text-amber-600" />
                    <span>What you should add / configure next:</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {checklist.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col justify-between rounded-lg border border-amber-200 bg-white/90 p-2.5 text-xs text-gray-800 shadow-2xs"
                      >
                        <div>
                          <span className="font-semibold text-amber-900">{item.item}:</span>{" "}
                          <span className="text-gray-600">{item.detail}</span>
                        </div>
                        {onOpenPanel && (
                          <div className="mt-2 pt-1 border-t border-gray-100 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const target = item.item.toLowerCase().includes("cover")
                                  ? "cover"
                                  : item.item.toLowerCase().includes("regis")
                                  ? "registration"
                                  : item.item.toLowerCase().includes("schedule") ||
                                    item.item.toLowerCase().includes("doc")
                                  ? "programme"
                                  : "event";
                                onOpenPanel(target);
                              }}
                              className="text-[11px] font-medium text-orange-600 hover:text-orange-700 underline flex items-center gap-1"
                            >
                              <span>Open Section</span>
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
