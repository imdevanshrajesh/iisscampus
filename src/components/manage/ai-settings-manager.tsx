"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Key,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Globe,
  Save,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { PROVIDERS, type AiProvider } from "@/lib/ai/providers";

export function AiSettingsManager({
  initialProvider = "xai",
  initialApiKey = "",
  initialModel = "grok-2-latest",
  initialBaseUrl = "",
  onSaved,
}: {
  initialProvider?: AiProvider;
  initialApiKey?: string;
  initialModel?: string;
  initialBaseUrl?: string;
  onSaved?: (config: { provider: AiProvider; apiKey: string; model: string; baseUrl: string }) => void;
}) {
  const [provider, setProvider] = useState<AiProvider>(initialProvider);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [model, setModel] = useState(initialModel);
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl || PROVIDERS[initialProvider]?.defaultBaseUrl || "");
  const [showKey, setShowKey] = useState(false);

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelsFetched, setModelsFetched] = useState(false);

  const [saving, setSaving] = useState(false);
  const [autoSaveNote, setAutoSaveNote] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const readyRef = useRef(false);
  const dirtyRef = useRef(false);
  const lastSavedKeyRef = useRef(
    JSON.stringify({
      provider: initialProvider,
      apiKey: initialApiKey.trim(),
      model: initialModel.trim(),
      baseUrl: (initialBaseUrl || PROVIDERS[initialProvider]?.defaultBaseUrl || "").trim(),
    }),
  );

  // Sync provider change with default base URL and default model if not custom
  const handleProviderChange = (newProvider: AiProvider) => {
    setProvider(newProvider);
    const config = PROVIDERS[newProvider] || PROVIDERS.xai;
    setBaseUrl(config.defaultBaseUrl);
    setModel(config.defaultModel);
    setAvailableModels([]);
    setModelsFetched(false);
    setStatusMessage(null);
  };

  // Fetch models dynamically from provider endpoint
  const handleFetchModels = async () => {
    if (!apiKey.trim() && provider !== "custom") {
      setStatusMessage({
        type: "error",
        text: `Please enter an API key for ${PROVIDERS[provider]?.name || provider} to fetch models.`,
      });
      return;
    }

    setFetchingModels(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/manage-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fetch-models",
          provider,
          apiKey: apiKey.trim(),
          baseUrl: baseUrl.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok && Array.isArray(data.models)) {
        setAvailableModels(data.models);
        setModelsFetched(true);
        setStatusMessage({
          type: "success",
          text: `Fetched ${data.models.length} live models from ${PROVIDERS[provider]?.name || provider}!`,
        });

        // If current model is not in the list, set to the first model
        if (!data.models.includes(model) && data.models.length > 0) {
          setModel(data.models[0]);
        }
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "Failed to fetch models from provider.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error contacting models endpoint.";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setFetchingModels(false);
    }
  };

  // Save to database
  const handleSaveSettings = async () => {
    setSaving(true);
    setStatusMessage(null);

    // Save locally in browser for instant availability
    if (typeof window !== "undefined") {
      if (apiKey.trim()) {
        localStorage.setItem("iiss_ai_api_key", apiKey.trim());
        if (provider === "xai") {
          localStorage.setItem("iiss_grok_api_key", apiKey.trim());
        }
      }
    }

    try {
      const res = await fetch("/api/manage-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-settings",
          provider,
          apiKey: apiKey.trim() || null,
          model: model.trim(),
          baseUrl: baseUrl.trim() || null,
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        lastSavedKeyRef.current = JSON.stringify({
          provider,
          apiKey: apiKey.trim(),
          model: model.trim(),
          baseUrl: baseUrl.trim(),
        });
        dirtyRef.current = false;
        try {
          window.localStorage.removeItem("campus:manage-draft:v1:ai-settings");
        } catch {
          // ignore storage errors
        }
        setAutoSaveNote(
          `Auto-saved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        );
        setStatusMessage({
          type: "success",
          text: "AI configuration saved to database successfully. It will persist across all sessions.",
        });
        if (onSaved) {
          onSaved({ provider, apiKey, model, baseUrl });
        }
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "Failed to save configuration to database.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving to database.";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const initTimer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem("campus:manage-draft:v1:ai-settings");
        if (raw) {
          const parsed = JSON.parse(raw) as {
            provider?: AiProvider;
            model?: string;
            baseUrl?: string;
          };
          if (parsed.provider && parsed.provider in PROVIDERS && !initialApiKey) {
            setProvider(parsed.provider);
          }
          if (parsed.model && parsed.model !== initialModel) setModel(parsed.model);
          if (parsed.baseUrl && parsed.baseUrl !== initialBaseUrl) setBaseUrl(parsed.baseUrl);
        }
      } catch {
        // ignore invalid cached draft
      }
      readyRef.current = true;
    }, 80);

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.clearTimeout(initTimer);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [initialApiKey, initialBaseUrl, initialModel]);

  useEffect(() => {
    if (!readyRef.current) return;
    const signature = JSON.stringify({
      provider,
      apiKey: apiKey.trim(),
      model: model.trim(),
      baseUrl: baseUrl.trim(),
    });
    if (signature === lastSavedKeyRef.current) {
      dirtyRef.current = false;
      return;
    }

    dirtyRef.current = true;
    try {
      window.localStorage.setItem(
        "campus:manage-draft:v1:ai-settings",
        JSON.stringify({ provider, model: model.trim(), baseUrl: baseUrl.trim() }),
      );
    } catch {
      // ignore storage quota errors
    }

    if (!model.trim()) return;

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/manage-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save-settings",
            provider,
            apiKey: apiKey.trim() || null,
            model: model.trim(),
            baseUrl: baseUrl.trim() || null,
          }),
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.ok) {
          lastSavedKeyRef.current = signature;
          dirtyRef.current = false;
          try {
            window.localStorage.removeItem("campus:manage-draft:v1:ai-settings");
          } catch {
            // ignore storage errors
          }
          setAutoSaveNote(
            `Auto-saved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
          );
          if (onSaved) {
            onSaved({ provider, apiKey, model, baseUrl });
          }
        }
      } catch {
        // leave dirtyRef true so user can save manually
      }
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [apiKey, baseUrl, model, onSaved, provider]);

  return (
    <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-xs">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-base">AI Provider & Model Settings</h3>
            <p className="text-xs text-muted">
              Configure your AI backend. Saves directly to the database so you don&apos;t have to re-enter it.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {apiKey.trim() ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3 w-3" /> Key Configured
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
              <AlertCircle className="h-3 w-3" /> No Key Set
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Provider Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
            AI Provider
          </label>
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value as AiProvider)}
            className="w-full rounded-xl border border-gray-300 dark:border-zinc-800 bg-white dark:bg-black px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:border-orange-600 focus:outline-hidden"
          >
            {Object.values(PROVIDERS).map((p) => (
              <option key={p.id} value={p.id} className="bg-white dark:bg-black text-gray-900 dark:text-white">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Base URL (editable for custom) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
            API Base URL
          </label>
          <div className="relative">
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api..."
              className="w-full rounded-xl border border-gray-300 dark:border-zinc-800 bg-white dark:bg-black px-3.5 py-2.5 text-sm font-mono text-gray-900 dark:text-white focus:border-orange-600 focus:outline-hidden"
            />
            <Globe className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* API Key Input */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
            {PROVIDERS[provider]?.name || "Provider"} API Key
          </label>
          <div className="relative flex items-center">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setModelsFetched(false);
              }}
              placeholder={`Enter your ${PROVIDERS[provider]?.name} key (saved to database)`}
              className="w-full rounded-xl border border-gray-300 dark:border-zinc-800 bg-white dark:bg-black px-3.5 py-2.5 pr-20 text-sm font-mono text-gray-900 dark:text-white focus:border-orange-600 focus:outline-hidden"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowKey((prev) => !prev)}
              className="absolute right-2.5 rounded-lg p-1.5 text-gray-400 hover:text-gray-200"
              title={showKey ? "Hide key" : "Show key"}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-muted">
            Stored securely in database table <code className="font-mono text-gray-700 dark:text-zinc-300">campus_settings</code>.
          </p>
        </div>

        {/* Dynamic Model Fetching & Selector */}
        <div className="sm:col-span-2 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Selected Model
            </label>
            <button
              type="button"
              onClick={handleFetchModels}
              disabled={fetchingModels || (!apiKey.trim() && provider !== "custom")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-zinc-800 bg-white dark:bg-black px-3 py-1 text-xs font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-900 disabled:opacity-50 transition-colors shadow-xs"
            >
              <RefreshCw className={`h-3 w-3 ${fetchingModels ? "animate-spin text-orange-600" : ""}`} />
              <span>{fetchingModels ? "Fetching live models..." : "Fetch Live Models from Provider"}</span>
            </button>
          </div>

          {modelsFetched && availableModels.length > 0 ? (
            <div className="space-y-1">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-xl border border-emerald-500/60 dark:border-emerald-500/60 bg-white dark:bg-black px-3.5 py-2.5 text-sm font-mono text-gray-900 dark:text-white focus:border-orange-600 focus:outline-hidden"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m} className="bg-white dark:bg-black text-gray-900 dark:text-white">
                    {m}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <Check className="h-3 w-3" /> Showing {availableModels.length} models fetched directly from {PROVIDERS[provider]?.name}.
              </p>
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={PROVIDERS[provider]?.defaultModel || "Enter model name"}
                className="w-full rounded-xl border border-gray-300 dark:border-zinc-800 bg-white dark:bg-black px-3.5 py-2.5 text-sm font-mono text-gray-900 dark:text-white focus:border-orange-600 focus:outline-hidden"
              />
              <p className="mt-1 text-[11px] text-muted">
                Default: <span className="font-mono text-gray-700 dark:text-zinc-300">{PROVIDERS[provider]?.defaultModel}</span>. Click &ldquo;Fetch Live Models from Provider&rdquo; above to query the provider API dynamically.
              </p>
            </div>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`rounded-xl p-3 text-xs font-medium flex items-center gap-2 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4">
        <div className="space-y-0.5">
          <p className="text-xs text-muted">
            Settings persist in the database and power both the manage copilot and public chat.
          </p>
          {autoSaveNote ? (
            <p className="text-[11px] font-medium text-emerald-700">{autoSaveNote}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Saving to database...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save AI Configuration to Database</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
