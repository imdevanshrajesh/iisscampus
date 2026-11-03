"use client";

import React, { useState, useEffect, useRef } from "react";
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
  UploadCloud,
  ChevronRight,
  Trophy,
  Megaphone,
  Award,
  HelpCircle,
  GraduationCap,
  Shield,
  MessageSquare,
  FileText,
  Sliders,
  Send,
  Trash2,
  MapPin,
  Users,
  Check,
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

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  event?: any;
  savedEvent?: {
    id: string;
    section: string;
    title: string;
    editUrl: string;
    viewUrl?: string;
  } | null;
  timestamp?: string;
};

const CHAT_STARTERS = [
  {
    label: "Add Swimming Gala",
    icon: Trophy,
    prompt: "Add an Inter-House Swimming Gala on Nov 28 at the Main Pool from 3:00 PM to 6:00 PM for grades 7 to 12. Free entry. Official house swimwear required.",
  },
  {
    label: "Add Sports Day",
    icon: Calendar,
    prompt: "Create an event called Annual Sports Championship on Dec 12, 2026 at the Main Turf Ground from 8:30 AM to 2:00 PM for grades 5-12.",
  },
  {
    label: "Robotics Workshop",
    icon: Sparkles,
    prompt: "Add an Inter-School Robotics & AI Showcase next Friday from 10:00 AM to 1:30 PM in the STEM Innovation Lab for grades 8 to 12.",
  },
  {
    label: "Debate League",
    icon: Award,
    prompt: "Add an event: Youth Parliamentary Debate Championship this Saturday at 2:30 PM in the Senior Auditorium. Grades 9 to 12.",
  },
  {
    label: "Staff Dismissal Notice",
    icon: Megaphone,
    prompt: "Announcement for Thursday: School will dismiss at 12:30 PM for staff training. Buses depart at 12:45 PM sharp.",
  },
];

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
  const [activeTab, setActiveTab] = useState<"chat" | "studio" | "settings">("chat");

  const [provider, setProvider] = useState<AiProvider>(initialProvider);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [model, setModel] = useState(initialModel);
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your **Campus Operations AI**. You can chat with me to instantly add events, generate notices, or plan activities. Try typing an instruction like: *'Add an Inter-House Swimming Gala next Tuesday at 3 PM at the main pool for grades 7 to 12'*.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [autoAddMode, setAutoAddMode] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [addingEventId, setAddingEventId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Studio / Bulk Form State
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
      const storedKey =
        localStorage.getItem("iiss_ai_api_key") || localStorage.getItem("iiss_grok_api_key");
      if (storedKey && storedKey.trim() && !apiKey) {
        setApiKey(storedKey);
      }
    }
  }, [apiKey]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab, isSendingChat]);

  // Send a chat message
  const handleSendChat = async (userText?: string) => {
    const textToSend = (userText || chatInput).trim();
    if (!textToSend || isSendingChat) return;

    const userMsgId = `user-${Date.now()}`;
    const newHistory = [
      ...chatMessages,
      { id: userMsgId, role: "user" as const, content: textToSend },
    ];
    setChatMessages(newHistory);
    setChatInput("");
    setIsSendingChat(true);

    try {
      const res = await fetch("/api/manage-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-ai-api-key": apiKey } : {}),
        },
        body: JSON.stringify({
          action: "chat",
          message: textToSend,
          history: chatMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          autoAdd: autoAddMode,
          provider,
          apiKey,
          model,
          baseUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: json.error || "Sorry, I encountered an issue processing that. Please try again.",
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: json.reply,
            event: json.event || null,
            savedEvent: json.savedEvent || null,
          },
        ]);
      }
    } catch (err: unknown) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: err instanceof Error ? err.message : "Error connecting to AI assistant.",
        },
      ]);
    } finally {
      setIsSendingChat(false);
      setTimeout(() => chatInputRef.current?.focus(), 50);
    }
  };

  // 1-Click Add Event from Chat
  const handleAddEventFromChat = async (messageId: string, eventData: any) => {
    setAddingEventId(messageId);
    try {
      const res = await autoAddAiRecord({
        section: "event",
        fields: eventData,
      });

      if (res.ok) {
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  savedEvent: res,
                }
              : msg,
          ),
        );
      } else {
        alert(`Error saving event: ${res.error}`);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add event to campus.");
    } finally {
      setAddingEventId(null);
    }
  };

  // Studio / Bulk Generate
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

  // Studio / Auto Add Record
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
      {/* Top Header Card with Provider Badge & Tabs */}
      <div className="rounded-2xl border border-gray-200/90 bg-white p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-xs">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-gray-950 tracking-tight">
                  AI Content Operations Agent
                </h2>
                <span className="rounded-md bg-gray-100 dark:bg-black px-2 py-0.5 text-xs font-mono text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-800">
                  {PROVIDERS[provider]?.name || provider} &bull; {model}
                </span>
                {apiKey.trim() ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> Live LLM
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 border border-sky-200">
                    <Sparkles className="h-3 w-3" /> Built-in Engine Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-1">
                Chat conversationally to create events, or paste bulk bullet notes for instant structuring and 1-click publishing.
              </p>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-black p-1 border border-gray-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "chat"
                  ? "bg-white dark:bg-zinc-900 text-gray-950 dark:text-white shadow-xs"
                  : "text-muted hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 text-orange-600" />
              <span>Interactive Chat</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("studio")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "studio"
                  ? "bg-white dark:bg-zinc-900 text-gray-950 dark:text-white shadow-xs"
                  : "text-muted hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-orange-600" />
              <span>Bulk Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-white dark:bg-zinc-900 text-gray-950 dark:text-white shadow-xs"
                  : "text-muted hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Sliders className="h-3.5 w-3.5 text-orange-600" />
              <span>Configure AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE CHAT MODE */}
      {activeTab === "chat" && (
        <div className="rounded-2xl border border-gray-200/90 bg-white shadow-xs overflow-hidden flex flex-col min-h-[580px]">
          {/* Chat Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-200 bg-gray-50/70">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-gray-900">
                AI Copilot Active
              </span>
              <span className="text-xs text-muted">&bull; Chat to add &amp; manage events</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Auto-Add Toggle */}
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoAddMode}
                  onChange={(e) => setAutoAddMode(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 h-3.5 w-3.5"
                />
                <span>Auto-Add Events Immediately</span>
              </label>

              <button
                type="button"
                onClick={() =>
                  setChatMessages([
                    {
                      id: `welcome-${Date.now()}`,
                      role: "assistant",
                      content:
                        "Chat cleared! What event or announcement would you like to prepare for campus?",
                    },
                  ])
                }
                title="Clear conversation history"
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-rose-600 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Chat Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[520px]">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-xs">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-orange-600 text-white font-medium rounded-tr-xs shadow-xs"
                      : "bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white rounded-tl-xs shadow-xs"
                  }`}
                >
                  {/* Text content with simple formatting */}
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Generated Event Card Embedded inside chat */}
                  {msg.event && (
                    <div className="mt-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-black text-gray-900 dark:text-white shadow-xs space-y-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-orange-800 dark:text-orange-300">
                              Event Draft
                            </span>
                            {msg.event.categoryName && (
                              <span className="rounded-md bg-gray-100 dark:bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:text-zinc-300">
                                {msg.event.categoryName}
                              </span>
                            )}
                          </div>
                          <h4 className="mt-1 text-base font-bold text-gray-950 dark:text-white">
                            {msg.event.title}
                          </h4>
                        </div>

                        {/* Status / Add Button */}
                        {msg.savedEvent ? (
                          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <Check className="h-4 w-4" />
                            <span>Published to Events</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddEventFromChat(msg.id, msg.event)}
                            disabled={addingEventId === msg.id}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {addingEventId === msg.id ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                <span>Adding Event...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add Event to Campus</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Event Meta Badges */}
                      <div className="grid gap-2 text-xs sm:grid-cols-2">
                        {msg.event.eventDate && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                            <span>Date: <strong>{msg.event.eventDate}</strong></span>
                          </div>
                        )}
                        {(msg.event.startTime || msg.event.endTime) && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Clock className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                            <span>
                              Time: <strong>{msg.event.startTime || "TBD"}{msg.event.endTime ? ` - ${msg.event.endTime}` : ""}</strong>
                            </span>
                          </div>
                        )}
                        {msg.event.locationName && (
                          <div className="flex items-center gap-2 text-gray-700 sm:col-span-2">
                            <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                            <span>Venue: <strong>{msg.event.locationName}</strong></span>
                          </div>
                        )}
                        {(msg.event.gradeFrom || msg.event.gradeTo) && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Users className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                            <span>Grades: <strong>{msg.event.gradeFrom || 1} to {msg.event.gradeTo || 12}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Short Description */}
                      {msg.event.shortDescription && (
                        <p className="text-xs text-muted leading-relaxed border-t border-gray-100 pt-2">
                          {msg.event.shortDescription}
                        </p>
                      )}

                      {/* Schedule Timeline Preview */}
                      {Array.isArray(msg.event.schedule) && msg.event.schedule.length > 0 && (
                        <div className="space-y-1.5 border-t border-gray-100 pt-2">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                            Generated Schedule:
                          </p>
                          <div className="space-y-1">
                            {msg.event.schedule.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                                <span className="font-mono font-semibold text-orange-600 shrink-0">{item.time}</span>
                                <span>&bull;</span>
                                <span className="font-medium text-gray-900">{item.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Direct Links when saved */}
                      {msg.savedEvent && (
                        <div className="flex flex-wrap items-center gap-2 border-t border-emerald-100 bg-emerald-50/50 p-2.5 rounded-lg text-xs">
                          <Link
                            href={msg.savedEvent.editUrl}
                            className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950 underline"
                          >
                            <span>Edit in Events Manager</span>
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                          {msg.savedEvent.viewUrl && (
                            <a
                              href={msg.savedEvent.viewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900"
                            >
                              <span>Preview Public Event</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white text-xs font-bold shadow-xs">
                    You
                  </div>
                )}
              </div>
            ))}

            {isSendingChat && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-xs">
                  <Sparkles className="h-4 w-4 animate-spin" />
                </div>
                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 text-xs text-muted flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-orange-600" />
                  <span>AI Copilot is formulating event details and schedule...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Starter Chips */}
          <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Quick Starters:
            </span>
            {CHAT_STARTERS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => handleSendChat(s.prompt)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 hover:border-orange-500 hover:text-orange-700 hover:bg-orange-50/50 transition-colors shadow-2xs cursor-pointer"
              >
                <s.icon className="h-3 w-3 text-orange-600" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="flex items-center gap-2.5"
            >
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask to add an event... e.g.: 'Add an Inter-House Basketball Championship on Friday at 4 PM in the Gym for grades 8-12'"
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-600 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatInput.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700 transition-colors shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <span>Send</span>
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: BULK & NOTE STUDIO */}
      {activeTab === "studio" && (
        <div className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-950 tracking-tight">
                Bulk Notes &amp; Raw Document Studio
              </h3>
            </div>
            <p className="text-sm text-muted mt-1">
              Paste rough notes, email circulars, or WhatsApp messages. Grok will auto-generate descriptions, extract dates, categories, and generate missing assets.
            </p>
          </div>

          {/* Target Section Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
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
                  className={`rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer ${
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
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
              Auto-generates comprehensive descriptions, schedules, and categorizes accurately.
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
                  <span>Processing Content...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Process Content</span>
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

          {/* Studio Results Preview & Auto-Add */}
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
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Auto-Adding to {result.section}...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
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
                  Generated Content Preview &amp; Edit
                </h4>

                {result.section === "event" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Title</label>
                      <input
                        type="text"
                        value={result.fields.title || ""}
                        onChange={(e) =>
                          setResult({
                            ...result,
                            fields: { ...result.fields, title: e.target.value },
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 dark:border-zinc-800 bg-white dark:bg-black px-3.5 py-2 text-sm text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Slug</label>
                      <input
                        type="text"
                        value={result.fields.slug || ""}
                        onChange={(e) =>
                          setResult({
                            ...result,
                            fields: { ...result.fields, slug: e.target.value },
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-sm font-mono text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Category</label>
                      <select
                        value={result.fields.categoryId || ""}
                        onChange={(e) =>
                          setResult({
                            ...result,
                            fields: { ...result.fields, categoryId: e.target.value },
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-sm text-gray-900 dark:text-white"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id} className="bg-white dark:bg-black text-gray-900 dark:text-white">
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                        Short Description
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
                        className="w-full rounded-lg border border-gray-300 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-sm text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                        Full Description (Auto-Generated)
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
                        className="w-full rounded-lg border border-gray-300 dark:border-zinc-800 bg-white dark:bg-black p-3 text-sm text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Event Date</label>
                      <input
                        type="date"
                        value={result.fields.eventDate || ""}
                        onChange={(e) =>
                          setResult({
                            ...result,
                            fields: { ...result.fields, eventDate: e.target.value },
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-sm text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Location</label>
                      <input
                        type="text"
                        value={result.fields.locationName || ""}
                        onChange={(e) =>
                          setResult({
                            ...result,
                            fields: { ...result.fields, locationName: e.target.value },
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONFIGURE AI SETTINGS */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
              AI Backend &amp; Model Credentials
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className="text-xs font-medium text-orange-600 hover:text-orange-700 underline cursor-pointer"
            >
              Return to Chat
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
              setActiveTab("chat");
            }}
          />
        </div>
      )}
    </div>
  );
}
