"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Key,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Plus,
  RefreshCw,
  FileCheck,
  UploadCloud,
  ChevronRight,
  Trophy,
  Megaphone,
  Award,
  HelpCircle,
  GraduationCap,
  Shield,
} from "lucide-react";
import { autoAddAiRecord } from "@/lib/manage/ai-actions";
import { AiSettingsManager } from "@/components/manage/ai-settings-manager";
import { PROVIDERS, type AiProvider } from "@/lib/ai/providers";
import type { Category } from "@/lib/types";

type ChecklistItem = {
  item: string;
  required: boolean;
  detail: string;
};

type GeneratedData = {
  section: "event" | "announcement" | "achievement" | "faq" | "marquee" | "wellness" | "incharge" | "program" | "house";
  summary: string;
  checklist: ChecklistItem[];
  fields: Record<string, any>;
};

const PRESET_EXAMPLES = [
  {
    label: "Football Tournament",
    icon: Trophy,
    section: "event",
    text: "Organizing an Inter-House Football Championship on November 28, 2026 at the Main Turf Ground from 3:00 PM to 6:30 PM. For grades 7 to 12. Free entry. Boys need to wear official house jerseys and bring water bottles. Knockout matches, penalty shootouts, and house trophy presentation. Refreshments provided.",
  },
  {
    label: "School Incharge Profile",
    icon: GraduationCap,
    section: "incharge",
    text: "Add Mr. Tariq Mansoor as Senior Section Incharge for Boys Secondary (Grades 11-12). He has been mentoring students for 12 years with a focus on student leadership, board examination preparations, and house council mentoring. Email: tariq.m@iissboys.com",
  },
  {
    label: "Mango Day Celebration",
    icon: Sparkles,
    section: "program",
    text: "Annual Mango Day celebration & tropical nutrition awareness program held in campus central courtyard for grades 5-12. Features fresh mango carving, smoothie stalls, eco-friendly packaging awareness, and inter-class fruit trivia.",
  },
  {
    label: "House Points Update",
    icon: Shield,
    section: "house",
    text: "Update Ruby House standings: Add 150 points for winning the inter-house volleyball championship and 100% attendance during sports week. Incharge: Mr. Tariq Mansoor, Captain: ZAYAN JASSEER, Vice Captain: DANIAL POULOSE. Motto: Courage, Passion & Strength.",
  },
  {
    label: "Early Dismissal Notice",
    icon: Megaphone,
    section: "announcement",
    text: "Announcement for upcoming Thursday: School will dismiss at 12:30 PM due to scheduled staff professional development workshops. School transport buses will depart at 12:45 PM sharp. After-school clubs will be rescheduled.",
  },
  {
    label: "Inter-School Debate Award",
    icon: Award,
    section: "achievement",
    text: "Our debate team won 1st Place in the UAE Inter-School Youth Parliamentary Debating League 2026. Lead speaker Ryan Mathew was awarded Best Speaker in the senior division. Academic year 2026-27.",
  },
  {
    label: "Club Registrations FAQ",
    icon: HelpCircle,
    section: "faq",
    text: "Question about how students join after-school activities and CCA clubs: Students can register for up to two after-school clubs at the start of each term via the student portal or by visiting the CCA coordinator room during break.",
  },
];

export function ManageAiAgent({
  initialProvider = "xai",
  initialApiKey = "",
  initialModel = "grok-2-latest",
  initialBaseUrl = "",
  categories = [],
}: {
  initialProvider?: AiProvider;
  initialApiKey?: string;
  initialModel?: string;
  initialBaseUrl?: string;
  categories?: Category[];
}) {
  const [provider, setProvider] = useState<AiProvider>(initialProvider);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [model, setModel] = useState(initialModel);
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);
  const [showConfig, setShowConfig] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [targetSection, setTargetSection] = useState("auto");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<GeneratedData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<{
    id: string;
    section: string;
    title: string;
    editUrl: string;
    viewUrl?: string;
  } | null>(null);

  // Load API key from localStorage on mount if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("iiss_ai_api_key") || localStorage.getItem("iiss_grok_api_key");
      if (storedKey && storedKey.trim() && !apiKey) {
        setApiKey(storedKey);
      }
    }
  }, [apiKey]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    setSaveSuccess(null);

    try {
      const res = await fetch("/api/manage-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-ai-api-key": apiKey } : {}),
        },
        body: JSON.stringify({
          action: "generate",
          prompt,
          targetSection,
          provider,
          apiKey,
          model,
          baseUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || `Failed to generate content with ${PROVIDERS[provider]?.name || "AI"}.`);
      } else {
        setResult(json.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error connecting to AI service.";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleAutoAdd = async () => {
    if (!result) return;
    setSaving(true);
    setError(null);

    try {
      const res = await autoAddAiRecord({
        section: result.section,
        fields: result.fields,
      });

      if (!res.ok) {
        setError(res.error);
      } else {
        setSaveSuccess(res);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to auto-add record.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Provider & Settings Box */}
      {showConfig ? (
        <div className="space-y-2">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="text-xs font-medium text-orange-600 hover:text-orange-700 underline cursor-pointer"
            >
              Done configuring · Hide Settings
            </button>
          </div>
          <AiSettingsManager
            initialProvider={provider}
            initialApiKey={apiKey}
            initialModel={model}
            initialBaseUrl={baseUrl}
            onSaved={(saved) => {
              setProvider(saved.provider);
              setApiKey(saved.apiKey);
              setModel(saved.model);
              setBaseUrl(saved.baseUrl);
            }}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600 text-white shadow-xs">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 text-base">
                    AI Backend: {PROVIDERS[provider]?.name || provider}
                  </h3>
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700 border border-gray-200">
                    {model}
                  </span>
                  {apiKey.trim() ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" /> Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200">
                      <AlertCircle className="h-3 w-3" /> Key Needed
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {apiKey.trim()
                    ? `Saved in database. Dynamic model querying active.`
                    : "No API key configured. Click 'Configure AI' to enter your key and fetch live models."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowConfig(true)}
              className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition-colors cursor-pointer"
            >
              Configure AI & Fetch Models
            </button>
          </div>
        </div>
      )}

      {/* Main Content Generator Card */}
      <div className="rounded-xl border border-gray-200/90 bg-white p-6 shadow-xs space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
              AI Content Operations Agent
            </h2>
          </div>
          <p className="text-sm text-muted mt-1">
            Send raw notes, messages, or drafts. Grok will auto-generate descriptions when missing, extract dates & venues, identify required uploads, and format everything for 1-click addition.
          </p>
        </div>

        {/* Target Section Filter */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-muted mb-2">
            Target Section
          </label>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { id: "auto", label: "Auto Detect (Recommended)" },
              { id: "event", label: "Campus Event" },
              { id: "announcement", label: "Council Notice" },
              { id: "incharge", label: "School Incharge" },
              { id: "program", label: "Program & Activity" },
              { id: "house", label: "House Points" },
              { id: "achievement", label: "Achievement" },
              { id: "faq", label: "FAQ" },
              { id: "marquee", label: "Marquee Ticker" },
              { id: "wellness", label: "Wellness Resource" },
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setTargetSection(sec.id)}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  targetSection === sec.id
                    ? "bg-orange-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Details */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-muted mb-2">
            Event / Content Details
          </label>
          <textarea
            rows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Paste rough details here... e.g.: 'Inter-school athletics carnival on Nov 25 at the sports complex from 9am to 2pm for grades 6-12. House competitions, 100m, relay, high jump. Medals and certificates for winners.'"
            className="w-full rounded-xl border border-gray-300 p-3.5 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-600 focus:outline-hidden"
          />
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted font-medium">Quick examples:</span>
          {PRESET_EXAMPLES.map((ex) => {
            const Icon = ex.icon;
            return (
              <button
                key={ex.label}
                type="button"
                onClick={() => {
                  setPrompt(ex.text);
                  setTargetSection(ex.section);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700 hover:border-orange-500 hover:text-orange-700 hover:bg-orange-50/50 transition-colors cursor-pointer"
              >
                <Icon className="h-3 w-3 text-orange-600 shrink-0" />
                <span>{ex.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <p className="text-xs text-muted">
            Grok will generate comprehensive descriptions, schedules, and categorize automatically.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Generating with Grok...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Process with Grok</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Generation Error</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-xs animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-emerald-950 text-base">
                  Record Created Successfully!
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  &ldquo;{saveSuccess.title}&rdquo; has been added to your {saveSuccess.section} workspace.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={saveSuccess.editUrl}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 shadow-xs transition-colors"
              >
                <span>Edit in Workspace</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              {saveSuccess.viewUrl && (
                <a
                  href={saveSuccess.viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100/50 shadow-xs transition-colors"
                >
                  <span>View Public Page</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results & Auto-Add View */}
      {result && (
        <div className="rounded-xl border border-gray-200/90 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-800 uppercase tracking-wider">
                  {result.section}
                </span>
                <h3 className="font-semibold text-gray-900 text-lg">
                  {result.fields.title || result.fields.question || result.fields.message || "Generated Draft"}
                </h3>
              </div>
              <p className="text-xs text-muted mt-1">{result.summary}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoAdd}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#12141c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1c2438] disabled:opacity-50 transition-all shadow-xs cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Auto-Adding to {result.section}...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 text-orange-400" />
                    <span>Auto-Add to {result.section}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action & Upload Checklist */}
          {result.checklist && result.checklist.length > 0 && (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-amber-700" />
                <h4 className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
                  Needs to be Uploaded / Configured Next
                </h4>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {result.checklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-white/80 p-2.5 text-xs text-amber-950"
                  >
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                    <div>
                      <span className="font-semibold">{item.item}:</span>{" "}
                      <span className="text-muted">{item.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editable Fields Summary */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">
              Generated Content Preview & Edit
            </h4>

            {result.section === "event" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={result.fields.title || ""}
                    onChange={(e) =>
                      setResult({
                        ...result,
                        fields: { ...result.fields, title: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={result.fields.slug || ""}
                    onChange={(e) =>
                      setResult({
                        ...result,
                        fields: { ...result.fields, slug: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={result.fields.categoryId || ""}
                    onChange={(e) =>
                      setResult({
                        ...result,
                        fields: { ...result.fields, categoryId: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Short Description (Generated)
                  </label>
                  <input
                    type="text"
                    value={result.fields.shortDescription || ""}
                    onChange={(e) =>
                      setResult({
                        ...result,
                        fields: { ...result.fields, shortDescription: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Full Description (Auto-Generated by Grok)
                  </label>
                  <textarea
                    rows={4}
                    value={result.fields.fullDescription || ""}
                    onChange={(e) =>
                      setResult({
                        ...result,
                        fields: { ...result.fields, fullDescription: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Event Date</label>
                  <input
                    type="date"
                    value={result.fields.eventDate || ""}
                    onChange={(e) =>
                      setResult({
                        ...result,
                        fields: { ...result.fields, eventDate: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={result.fields.locationName || ""}
                    onChange={(e) =>
                      setResult({
                        ...result,
                        fields: { ...result.fields, locationName: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="HH:MM"
                      value={result.fields.startTime || ""}
                      onChange={(e) =>
                        setResult({
                          ...result,
                          fields: { ...result.fields, startTime: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                    <span className="text-muted text-xs">to</span>
                    <input
                      type="text"
                      placeholder="HH:MM"
                      value={result.fields.endTime || ""}
                      onChange={(e) =>
                        setResult({
                          ...result,
                          fields: { ...result.fields, endTime: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Grades</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="From"
                      value={result.fields.gradeFrom || ""}
                      onChange={(e) =>
                        setResult({
                          ...result,
                          fields: { ...result.fields, gradeFrom: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                    <span className="text-muted text-xs">to</span>
                    <input
                      type="number"
                      placeholder="To"
                      value={result.fields.gradeTo || ""}
                      onChange={(e) =>
                        setResult({
                          ...result,
                          fields: { ...result.fields, gradeTo: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </div>
                </div>

                {/* Schedule Items */}
                {Array.isArray(result.fields.schedule) && result.fields.schedule.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Proposed Schedule
                    </label>
                    <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50/60 p-3">
                      {result.fields.schedule.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 text-xs">
                          <span className="font-semibold text-gray-900 w-14 shrink-0">
                            {item.time}
                          </span>
                          <span className="font-medium text-gray-800">{item.title}</span>
                          {item.detail && <span className="text-muted">— {item.detail}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {result.section === "announcement" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={result.fields.title || ""}
                    onChange={(e) =>
                      setResult({
                        ...result,
                        fields: { ...result.fields, title: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Announcement Body (Markdown)
                  </label>
                  <textarea
                    rows={5}
                    value={result.fields.body || ""}
                    onChange={(e) =>
                      setResult({
                        ...result,
                        fields: { ...result.fields, body: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 font-mono"
                  />
                </div>
              </div>
            )}

            {result.section === "achievement" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={result.fields.title || ""}
                    onChange={(e) =>
                      setResult({
                        ...result,
                        fields: { ...result.fields, title: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Competition Name
                  </label>
                  <input
                    type="text"
                    value={result.fields.competitionName || ""}
                    onChange={(e) =>
                      setResult({
                        ...result,
                        fields: { ...result.fields, competitionName: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Winner / Team Name
                  </label>
                  <input
                    type="text"
                    value={result.fields.winnerName || ""}
                    onChange={(e) =>
                      setResult({
                        ...result,
                        fields: { ...result.fields, winnerName: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Award</label>
                  <input
                    type="text"
                    value={result.fields.award || ""}
                    onChange={(e) =>
                      setResult({
                        ...result,
                        fields: { ...result.fields, award: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>
              </div>
            )}

            {result.section === "faq" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Question</label>
                  <input
                    type="text"
                    value={result.fields.question || ""}
                    onChange={(e) =>
                      setResult({
                        ...result,
                        fields: { ...result.fields, question: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Answer</label>
                  <textarea
                    rows={4}
                    value={result.fields.answer || ""}
                    onChange={(e) =>
                      setResult({
                        ...result,
                        fields: { ...result.fields, answer: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom auto-add CTA */}
          <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
            <span className="text-xs text-muted">
              Ready to publish or save as draft to your workspace.
            </span>
            <button
              type="button"
              onClick={handleAutoAdd}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Confirm & Auto-Add Record</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
