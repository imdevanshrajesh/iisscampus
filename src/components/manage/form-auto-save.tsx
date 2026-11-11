"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { AlertCircle, CheckCircle2, Cloud, Loader2, RotateCcw, X } from "lucide-react";
import type { ActionState } from "@/lib/manage/actions";

type AutoSaveStatus = "idle" | "local" | "saving" | "saved" | "error";

export type FormDraftEntryList = [string, string][];

type StoredDraft = {
  savedAt: string;
  entries: FormDraftEntryList;
};

type FormAutoSaveProps = {
  formRef: RefObject<HTMLFormElement | null>;
  draftKey: string;
  serverAction?: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  recordId?: string;
  canAutoSaveServer?: boolean;
  disabled?: boolean;
  debounceMs?: number;
  watchValue?: unknown;
  externalSuccess?: string;
  externalError?: string;
  compact?: boolean;
  onCreatedId?: (id: string) => void;
  onRestoreDraft?: (fields: Record<string, string[]>) => void;
  className?: string;
};

const DRAFT_PREFIX = "campus:manage-draft:v1:";
const IGNORED_KEYS = new Set(["id", "intent", "_autosave", "confirmArchive"]);

function readFormEntries(form: HTMLFormElement): FormDraftEntryList {
  const fd = new FormData(form);
  const out: FormDraftEntryList = [];
  for (const [key, value] of fd.entries()) {
    if (IGNORED_KEYS.has(key)) continue;
    if (typeof value === "string") {
      out.push([key, value]);
    }
  }
  return out;
}

function entriesToMap(entries: FormDraftEntryList): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const [key, value] of entries) {
    if (!map[key]) map[key] = [];
    map[key].push(value);
  }
  return map;
}

function applyEntriesToDomForm(form: HTMLFormElement, fieldMap: Record<string, string[]>) {
  for (const rawEl of Array.from(form.elements)) {
    if (
      !(rawEl instanceof HTMLInputElement) &&
      !(rawEl instanceof HTMLTextAreaElement) &&
      !(rawEl instanceof HTMLSelectElement)
    ) {
      continue;
    }

    const name = rawEl.name;
    if (!name || IGNORED_KEYS.has(name) || rawEl.disabled) continue;

    if (rawEl instanceof HTMLInputElement) {
      if (rawEl.type === "file" || rawEl.type === "hidden" || rawEl.type === "submit" || rawEl.type === "button") {
        continue;
      }
      if (rawEl.type === "checkbox") {
        const expectedValue = rawEl.value || "on";
        const values = fieldMap[name] ?? [];
        rawEl.checked = values.includes(expectedValue);
        continue;
      }
      if (rawEl.type === "radio") {
        const values = fieldMap[name] ?? [];
        rawEl.checked = values.includes(rawEl.value);
        continue;
      }
      if (name in fieldMap) {
        rawEl.value = fieldMap[name][0] ?? "";
      }
      continue;
    }

    if (rawEl instanceof HTMLSelectElement) {
      if (!(name in fieldMap)) continue;
      if (rawEl.multiple) {
        const selected = new Set(fieldMap[name]);
        for (const option of Array.from(rawEl.options)) {
          option.selected = selected.has(option.value);
        }
      } else {
        rawEl.value = fieldMap[name][0] ?? "";
      }
      continue;
    }

    if (name in fieldMap) {
      rawEl.value = fieldMap[name][0] ?? "";
    }
  }
}

function readStoredDraft(storageKey: string): StoredDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDraft> | null;
    if (!parsed || !Array.isArray(parsed.entries) || typeof parsed.savedAt !== "string") {
      return null;
    }
    return {
      savedAt: parsed.savedAt,
      entries: parsed.entries.filter(
        (pair): pair is [string, string] =>
          Array.isArray(pair) && pair.length === 2 && typeof pair[0] === "string" && typeof pair[1] === "string",
      ),
    };
  } catch {
    return null;
  }
}

function writeStoredDraft(storageKey: string, entries: FormDraftEntryList) {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredDraft = {
      savedAt: new Date().toISOString(),
      entries,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

function clearStoredDraft(storageKey: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Ignore storage errors
  }
}

function formatClockTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "just now";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function FormAutoSave({
  formRef,
  draftKey,
  serverAction,
  recordId = "",
  canAutoSaveServer = true,
  disabled = false,
  debounceMs = 1500,
  watchValue,
  externalSuccess,
  externalError,
  compact = false,
  onCreatedId,
  onRestoreDraft,
  className = "",
}: FormAutoSaveProps) {
  const storageKey = `${DRAFT_PREFIX}${draftKey}`;
  const watchSignature = useMemo(() => {
    if (watchValue === undefined) return "";
    try {
      return JSON.stringify(watchValue);
    } catch {
      return "";
    }
  }, [watchValue]);

  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [statusDetail, setStatusDetail] = useState<string>("");
  const [savedClock, setSavedClock] = useState<string>("");
  const [recoverableDraft, setRecoverableDraft] = useState<StoredDraft | null>(null);

  const mountedRef = useRef(true);
  const readyRef = useRef(false);
  const dirtyRef = useRef(false);
  const submittingRef = useRef(false);
  const isSavingRef = useRef(false);
  const queuedSaveRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const localTimerRef = useRef<number | null>(null);
  const lastWatchRef = useRef(watchSignature);
  const lastSerializedRef = useRef("");

  const recordIdRef = useRef(recordId);
  const canServerRef = useRef(canAutoSaveServer);
  const disabledRef = useRef(disabled);
  const serverActionRef = useRef(serverAction);
  const onCreatedIdRef = useRef(onCreatedId);

  useEffect(() => {
    recordIdRef.current = recordId;
  }, [recordId]);

  useEffect(() => {
    canServerRef.current = canAutoSaveServer;
  }, [canAutoSaveServer]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    serverActionRef.current = serverAction;
  }, [serverAction]);

  useEffect(() => {
    onCreatedIdRef.current = onCreatedId;
  }, [onCreatedId]);

  const flushAutoSave = async () => {
    const form = formRef.current;
    if (!form || disabledRef.current || submittingRef.current) return;

    const entries = readFormEntries(form);
    const serialized = JSON.stringify(entries);
    writeStoredDraft(storageKey, entries);

    if (serialized === lastSerializedRef.current) {
      return;
    }

    const action = serverActionRef.current;
    if (!canServerRef.current || !action) {
      dirtyRef.current = true;
      if (mountedRef.current) {
        setStatus("local");
        setStatusDetail("Draft backed up in browser — click Save to apply.");
      }
      return;
    }

    if (!form.checkValidity()) {
      dirtyRef.current = true;
      if (mountedRef.current) {
        setStatus("local");
        setStatusDetail("Draft backed up locally — complete required fields to auto-save.");
      }
      return;
    }

    if (isSavingRef.current) {
      queuedSaveRef.current = true;
      return;
    }

    isSavingRef.current = true;
    if (mountedRef.current) {
      setStatus("saving");
      setStatusDetail("");
    }

    try {
      const fd = new FormData(form);
      fd.set("intent", "save");
      fd.set("_autosave", "1");
      if (recordIdRef.current && !fd.get("id")) {
        fd.set("id", recordIdRef.current);
      }

      const result = await action({}, fd);
      if (!mountedRef.current) return;

      if (result?.error) {
        setStatus("error");
        setStatusDetail(result.error);
        return;
      }

      lastSerializedRef.current = serialized;
      dirtyRef.current = false;
      clearStoredDraft(storageKey);
      setRecoverableDraft(null);
      setStatus("saved");
      setStatusDetail("");
      setSavedClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

      if (result?.createdId && result.createdId !== recordIdRef.current) {
        onCreatedIdRef.current?.(result.createdId);
      }
    } catch (error) {
      if (!mountedRef.current) return;
      setStatus("error");
      setStatusDetail(error instanceof Error ? error.message : "Auto-save paused — local draft kept.");
    } finally {
      isSavingRef.current = false;
      if (queuedSaveRef.current && mountedRef.current && !submittingRef.current) {
        queuedSaveRef.current = false;
        void flushRef.current();
      }
    }
  };

  const flushRef = useRef<() => Promise<void>>(flushAutoSave);
  const scheduleRef = useRef<() => void>(() => {});

  const scheduleAutoSave = () => {
    if (!readyRef.current || disabledRef.current) return;
    dirtyRef.current = true;

    if (localTimerRef.current !== null) {
      window.clearTimeout(localTimerRef.current);
    }
    localTimerRef.current = window.setTimeout(() => {
      const form = formRef.current;
      if (!form) return;
      writeStoredDraft(storageKey, readFormEntries(form));
      if (mountedRef.current) {
        setStatus((current) => (current === "idle" ? "local" : current));
        setStatusDetail((current) => current || "Draft backed up locally");
      }
    }, 300);

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void flushRef.current();
    }, debounceMs);
  };

  useEffect(() => {
    flushRef.current = flushAutoSave;
    scheduleRef.current = scheduleAutoSave;
  });

  // Baseline capture + recoverable local draft check after initial render settles
  useEffect(() => {
    mountedRef.current = true;
    const initTimer = window.setTimeout(() => {
      const form = formRef.current;
      if (!form || !mountedRef.current) return;
      const initialSerialized = JSON.stringify(readFormEntries(form));
      lastSerializedRef.current = initialSerialized;
      lastWatchRef.current = watchSignature;
      readyRef.current = true;

      const stored = readStoredDraft(storageKey);
      if (stored && stored.entries.length > 0 && JSON.stringify(stored.entries) !== initialSerialized) {
        setRecoverableDraft(stored);
      } else if (stored) {
        clearStoredDraft(storageKey);
      }
    }, 80);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(initTimer);
      if (localTimerRef.current !== null) window.clearTimeout(localTimerRef.current);
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    };
  }, [formRef, storageKey, watchSignature]);

  // Attach DOM input/change/submit listeners + accidental reload guard
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const handleFormInteraction = () => {
      scheduleRef.current();
    };

    const handleSubmit = () => {
      submittingRef.current = true;
      dirtyRef.current = false;
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      window.setTimeout(() => {
        submittingRef.current = false;
      }, 4000);
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (disabledRef.current || submittingRef.current) return;
      if (dirtyRef.current || isSavingRef.current) {
        const entries = readFormEntries(form);
        writeStoredDraft(storageKey, entries);
        event.preventDefault();
        event.returnValue = "";
      }
    };

    form.addEventListener("input", handleFormInteraction, true);
    form.addEventListener("change", handleFormInteraction, true);
    form.addEventListener("submit", handleSubmit);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      form.removeEventListener("input", handleFormInteraction, true);
      form.removeEventListener("change", handleFormInteraction, true);
      form.removeEventListener("submit", handleSubmit);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [formRef, storageKey]);

  // Trigger auto-save when React-controlled fields change
  useEffect(() => {
    if (!readyRef.current || watchSignature === lastWatchRef.current) {
      return;
    }
    lastWatchRef.current = watchSignature;
    scheduleRef.current();
  }, [watchSignature]);

  // Clear local draft & mark saved when manual form submission succeeds
  useEffect(() => {
    if (!externalSuccess || externalError) return;
    const timer = window.setTimeout(() => {
      const form = formRef.current;
      if (form) {
        lastSerializedRef.current = JSON.stringify(readFormEntries(form));
      }
      dirtyRef.current = false;
      submittingRef.current = false;
      clearStoredDraft(storageKey);
      setRecoverableDraft(null);
      setStatus("saved");
      setStatusDetail("");
      setSavedClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 20);
    return () => window.clearTimeout(timer);
  }, [externalError, externalSuccess, formRef, storageKey]);

  const handleRestoreDraft = () => {
    if (!recoverableDraft || !formRef.current) return;
    const fieldMap = entriesToMap(recoverableDraft.entries);
    applyEntriesToDomForm(formRef.current, fieldMap);
    onRestoreDraft?.(fieldMap);
    setRecoverableDraft(null);
    dirtyRef.current = true;
    setStatus("local");
    setStatusDetail("Restored unsaved draft — syncing...");
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void flushAutoSave();
    }, 350);
  };

  const handleDiscardDraft = () => {
    clearStoredDraft(storageKey);
    setRecoverableDraft(null);
  };

  if (disabled && !recoverableDraft) {
    return null;
  }

  return (
    <div className={`grid gap-2 ${className}`}>
      {recoverableDraft ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50/90 px-3.5 py-2 text-xs text-amber-950">
          <span>
            Unsaved changes from {formatClockTime(recoverableDraft.savedAt)} found in this browser.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-amber-800"
            >
              <RotateCcw size={12} />
              Restore draft
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-400/70 px-2 py-1 text-[11px] font-medium text-amber-900 hover:bg-amber-100"
            >
              <X size={12} />
              Discard
            </button>
          </div>
        </div>
      ) : null}

      <div
        aria-live="polite"
        className={`flex flex-wrap items-center gap-2 text-xs ${
          compact ? "text-[11px]" : ""
        }`}
      >
        {status === "saving" ? (
          <span className="inline-flex items-center gap-1.5 text-navy font-medium">
            <Loader2 size={13} className="animate-spin" />
            Auto-saving...
          </span>
        ) : status === "saved" ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
            <CheckCircle2 size={13} />
            Auto-saved{savedClock ? ` at ${savedClock}` : ""}
          </span>
        ) : status === "local" ? (
          <span className="inline-flex items-center gap-1.5 text-amber-800 font-medium">
            <Cloud size={13} />
            {statusDetail || "Draft backed up locally"}
          </span>
        ) : status === "error" ? (
          <span className="inline-flex items-center gap-1.5 text-red-700 font-medium">
            <AlertCircle size={13} />
            {statusDetail || "Auto-save paused — local draft kept"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-muted">
            <Cloud size={13} />
            Auto-save active — changes stay backed up against reloads
          </span>
        )}
      </div>
    </div>
  );
}
