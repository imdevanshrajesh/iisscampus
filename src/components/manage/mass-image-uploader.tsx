"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Folder,
  Images,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  createFastImagePreviewUrl,
  deriveAltFromFilename,
  extensionForMime,
  prepareUncroppedImageForUpload,
  replaceFileExtension,
  revokeImagePreviewUrl,
  uploadPreparedBlobWithProgress,
} from "@/lib/media/client-image";
import { DEFAULT_UPLOAD_FOLDERS } from "@/lib/media/rustfs";

export type UploadedGalleryImage = {
  url: string;
  fileName: string;
  alt: string;
  file: File;
};

type QueueItemStatus = "queued" | "preparing" | "uploading" | "saving" | "done" | "error";

type QueueItem = {
  id: string;
  file: File;
  previewUrl: string;
  alt: string;
  targetFolder: string;
  status: QueueItemStatus;
  progress: number;
  uploadedUrl?: string;
  error?: string;
};

type MassImageUploaderProps = {
  folder?: string;
  allowFolderChange?: boolean;
  disabled?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
  onImageUploaded: (uploaded: UploadedGalleryImage) => Promise<void> | void;
  onBatchSettled?: (summary: { succeeded: number; failed: number }) => void;
};

const MAX_CONCURRENCY = 3;

let queueSeq = 0;
function createQueueId(): string {
  queueSeq += 1;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `q-${queueSeq}`;
}

export function MassImageUploader({
  folder = "Gallery",
  allowFolderChange = false,
  disabled = false,
  title = "Mass Upload Photographs",
  subtitle = "Drop or select multiple photos at once. Large photos are automatically compressed in parallel before uploading.",
  className = "",
  onImageUploaded,
  onBatchSettled,
}: MassImageUploaderProps) {
  const [folderOverride, setFolderOverride] = useState<string | null>(null);
  const selectedFolder = folderOverride ?? folder;
  const [isDragging, setIsDragging] = useState(false);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queueRef = useRef<QueueItem[]>([]);
  const activeWorkerRef = useRef(false);
  const onUploadedRef = useRef(onImageUploaded);
  const onSettledRef = useRef(onBatchSettled);
  const previewUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    onUploadedRef.current = onImageUploaded;
  }, [onImageUploaded]);

  useEffect(() => {
    onSettledRef.current = onBatchSettled;
  }, [onBatchSettled]);

  useEffect(() => {
    previewUrlsRef.current = items.map((item) => item.previewUrl).filter(Boolean);
  }, [items]);

  useEffect(() => {
    return () => {
      for (const url of previewUrlsRef.current) {
        revokeImagePreviewUrl(url);
      }
    };
  }, []);

  const updateItem = (id: string, patch: Partial<QueueItem>) => {
    queueRef.current = queueRef.current.map((item) => (item.id === id ? { ...item, ...patch } : item));
    setItems(queueRef.current);
  };

  const processSingleItem = async (itemId: string): Promise<boolean> => {
    const initial = queueRef.current.find((entry) => entry.id === itemId);
    if (!initial) return false;

    try {
      let url = initial.uploadedUrl;

      if (!url) {
        updateItem(itemId, { status: "preparing", progress: 8, error: undefined });
        const prepared = await prepareUncroppedImageForUpload(initial.file, initial.previewUrl);
        const ext = extensionForMime(prepared.mimeType, undefined);
        const finalName = ext ? replaceFileExtension(prepared.fileName, prepared.mimeType) : prepared.fileName;

        url = await uploadPreparedBlobWithProgress({
          blob: prepared.blob,
          fileName: finalName,
          folder: initial.targetFolder,
          onPhase: (phase) => {
            updateItem(itemId, { status: phase === "saving" ? "saving" : "uploading" });
          },
          onProgress: (percent) => {
            updateItem(itemId, { progress: percent });
          },
        });
        updateItem(itemId, { uploadedUrl: url, progress: 99, status: "saving" });
      } else {
        updateItem(itemId, { status: "saving", progress: 99, error: undefined });
      }

      await onUploadedRef.current({
        url,
        fileName: initial.file.name,
        alt: initial.alt,
        file: initial.file,
      });

      updateItem(itemId, { status: "done", progress: 100, uploadedUrl: url, error: undefined });
      return true;
    } catch (error) {
      updateItem(itemId, {
        status: "error",
        error: error instanceof Error ? error.message : "Upload failed.",
      });
      return false;
    }
  };

  const runQueue = async () => {
    if (activeWorkerRef.current) return;
    activeWorkerRef.current = true;
    setIsRunning(true);

    let succeeded = 0;
    let failed = 0;

    try {
      const worker = async () => {
        while (true) {
          const next = queueRef.current.find((entry) => entry.status === "queued");
          if (!next) break;
          // Claim immediately so no sibling worker picks up the same item
          updateItem(next.id, { status: "preparing", progress: 4 });
          const ok = await processSingleItem(next.id);
          if (ok) succeeded += 1;
          else failed += 1;
        }
      };

      const queuedCount = queueRef.current.filter((entry) => entry.status === "queued").length;
      const concurrency = Math.min(MAX_CONCURRENCY, Math.max(1, queuedCount));
      await Promise.all(Array.from({ length: concurrency }, () => worker()));
    } finally {
      activeWorkerRef.current = false;
      setIsRunning(false);
      if (succeeded > 0 || failed > 0) {
        onSettledRef.current?.({ succeeded, failed });
      }
    }
  };

  const enqueueFiles = (fileList: FileList | File[]) => {
    if (disabled) return;
    const rawFiles = Array.from(fileList);
    if (!rawFiles.length) return;

    const target = selectedFolder.trim() || "Gallery";
    const created: QueueItem[] = [];

    for (const file of rawFiles) {
      if (!file.type.startsWith("image/")) {
        created.push({
          id: createQueueId(),
          file,
          previewUrl: "",
          alt: deriveAltFromFilename(file.name),
          targetFolder: target,
          status: "error",
          progress: 0,
          error: "Not an image file (JPG, PNG, WebP, GIF, SVG only).",
        });
        continue;
      }

      created.push({
        id: createQueueId(),
        file,
        previewUrl: createFastImagePreviewUrl(file),
        alt: deriveAltFromFilename(file.name),
        targetFolder: target,
        status: "queued",
        progress: 0,
      });
    }

    queueRef.current = [...queueRef.current, ...created];
    setItems(queueRef.current);
    void runQueue();
  };

  const retryItem = (id: string) => {
    updateItem(id, { status: "queued", progress: 0, error: undefined });
    void runQueue();
  };

  const retryAllFailed = () => {
    queueRef.current = queueRef.current.map((item) =>
      item.status === "error" && item.file.type.startsWith("image/")
        ? { ...item, status: "queued", progress: 0, error: undefined }
        : item,
    );
    setItems(queueRef.current);
    void runQueue();
  };

  const removeItem = (id: string) => {
    const target = queueRef.current.find((item) => item.id === id);
    if (target?.previewUrl) {
      revokeImagePreviewUrl(target.previewUrl);
    }
    queueRef.current = queueRef.current.filter((item) => item.id !== id);
    setItems(queueRef.current);
  };

  const clearDone = () => {
    for (const item of queueRef.current) {
      if (item.status === "done") {
        revokeImagePreviewUrl(item.previewUrl);
      }
    }
    queueRef.current = queueRef.current.filter((item) => item.status !== "done");
    setItems(queueRef.current);
  };

  const doneCount = items.filter((item) => item.status === "done").length;
  const errorCount = items.filter((item) => item.status === "error").length;
  const activeCount = items.filter((item) =>
    item.status === "queued" ||
    item.status === "preparing" ||
    item.status === "uploading" ||
    item.status === "saving",
  ).length;

  return (
    <div className={`grid gap-3 rounded-2xl border border-line bg-wash/35 p-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
            <Images size={16} className="text-navy shrink-0" />
            {title}
          </p>
          <p className="text-xs text-muted mt-0.5">{subtitle}</p>
        </div>

        {allowFolderChange ? (
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <Folder size={13} />
            <span>Folder:</span>
            <select
              value={selectedFolder}
              disabled={disabled}
              onChange={(e) => setFolderOverride(e.target.value)}
              className="h-8 rounded-lg border border-line bg-surface px-2.5 text-xs font-medium text-ink"
            >
              {DEFAULT_UPLOAD_FOLDERS.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}/
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-muted">
            <Folder size={12} />
            {selectedFolder}/
          </span>
        )}
      </div>

      {/* Multi-file Dropzone */}
      <div
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          if (disabled) return;
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.length) {
            enqueueFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          disabled
            ? "border-line/60 bg-wash/20 opacity-60 cursor-not-allowed"
            : isDragging
              ? "border-navy bg-navy/5 scale-[0.995] cursor-pointer"
              : "border-line bg-surface hover:border-navy/45 hover:bg-wash/40 cursor-pointer"
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-wash/70 text-navy">
          <Upload size={18} />
        </div>
        <p className="mt-2.5 text-sm font-medium text-ink">
          Drop multiple photos here or click to choose batch
        </p>
        <p className="mt-1 text-xs text-muted">
          Select 2, 10, or 50 photos at once &bull; Uploads {MAX_CONCURRENCY} at a time automatically
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        disabled={disabled}
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={(e) => {
          if (e.target.files?.length) {
            enqueueFiles(e.target.files);
          }
          e.target.value = "";
        }}
        className="hidden"
      />

      {/* Batch Queue Status & Cards */}
      {items.length > 0 ? (
        <div className="grid gap-2.5 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-medium text-ink">
              {isRunning ? (
                <Loader2 size={14} className="animate-spin text-navy" />
              ) : errorCount > 0 ? (
                <AlertCircle size={14} className="text-amber-600" />
              ) : (
                <CheckCircle2 size={14} className="text-emerald-600" />
              )}
              <span>
                {doneCount} / {items.length} uploaded
                {activeCount > 0 ? ` • ${activeCount} in progress` : ""}
                {errorCount > 0 ? ` • ${errorCount} failed` : ""}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {errorCount > 0 ? (
                <button
                  type="button"
                  onClick={retryAllFailed}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
                >
                  <RotateCcw size={12} />
                  Retry failed
                </button>
              ) : null}
              {doneCount > 0 ? (
                <button
                  type="button"
                  onClick={clearDone}
                  className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-muted hover:text-ink"
                >
                  <Trash2 size={12} />
                  Clear completed
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2 text-xs"
              >
                <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-wash">
                  {item.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.previewUrl} alt={item.alt} className="h-full w-full object-cover" />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 grid gap-1">
                  <p className="truncate font-medium text-ink" title={item.file.name}>
                    {item.file.name}
                  </p>

                  {item.status === "error" ? (
                    <p className="truncate text-[11px] text-red-700" title={item.error}>
                      {item.error || "Upload failed"}
                    </p>
                  ) : item.status === "done" ? (
                    <p className="text-[11px] font-medium text-emerald-700">Added</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-[11px] text-muted">
                        <span>
                          {item.status === "queued"
                            ? "Queued..."
                            : item.status === "preparing"
                              ? "Optimizing..."
                              : item.status === "saving"
                                ? "Saving..."
                                : "Uploading..."}
                        </span>
                        <span className="font-mono">{item.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/70">
                        <div
                          className="h-full bg-navy transition-all duration-150"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {item.status === "error" && item.file.type.startsWith("image/") ? (
                    <button
                      type="button"
                      onClick={() => retryItem(item.id)}
                      className="rounded-md p-1 text-navy hover:bg-wash"
                      title="Retry"
                    >
                      <RotateCcw size={13} />
                    </button>
                  ) : null}
                  {item.status === "done" || item.status === "error" ? (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded-md p-1 text-muted hover:bg-wash hover:text-ink"
                      title="Dismiss"
                    >
                      <X size={13} />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
