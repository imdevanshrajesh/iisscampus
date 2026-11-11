"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Image as ImageIcon,
  Check,
  Copy,
  ExternalLink,
  Trash2,
  Folder,
  RefreshCw,
  AlertCircle,
  Crop,
  Link as LinkIcon,
  FileText,
} from "lucide-react";
import { ImageCropModal, type CropAspectRatio } from "./image-crop-modal";
import {
  createFastImagePreviewUrl,
  extensionForMime,
  prepareUncroppedImageForUpload,
  revokeImagePreviewUrl,
  uploadPreparedBlobWithProgress,
  type UploadPhase,
} from "@/lib/media/client-image";
import { DEFAULT_UPLOAD_FOLDERS } from "@/lib/media/rustfs";

type ImageUploaderProps = {
  name: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  targetName?: string;
  label?: string;
  hint?: string;
  aspectRatio?: CropAspectRatio;
  className?: string;
  required?: boolean;
  disabled?: boolean;
};

export function ImageUploader({
  name,
  value,
  onChange,
  folder = "Events",
  targetName,
  label = "Photograph",
  hint,
  aspectRatio = "16:10",
  className = "",
  required = false,
  disabled = false,
}: ImageUploaderProps) {
  const [prevFolderProp, setPrevFolderProp] = useState<string>(folder);
  const [selectedFolder, setSelectedFolder] = useState<string>(folder);
  const [customFolder, setCustomFolder] = useState<string>("");
  const [isCustomFolder, setIsCustomFolder] = useState<boolean>(false);

  if (prevFolderProp !== folder) {
    setPrevFolderProp(folder);
    setSelectedFolder(folder);
  }

  // Upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("uploading");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);

  // Crop modal state (uses instant object URLs instead of heavy base64 strings)
  const [cropFile, setCropFile] = useState<{ file: File; previewUrl: string } | null>(null);
  const [isCropOpen, setIsCropOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activePreviewUrlRef = useRef<string>("");

  useEffect(() => {
    activePreviewUrlRef.current = cropFile?.previewUrl ?? "";
  }, [cropFile]);

  useEffect(() => {
    return () => {
      revokeImagePreviewUrl(activePreviewUrlRef.current);
    };
  }, []);

  // Handle clipboard copy
  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSanitizedTargetName = (fallbackName: string, extOverride?: string) => {
    const dotIndex = fallbackName.lastIndexOf(".");
    const originalExt = dotIndex !== -1 ? fallbackName.slice(dotIndex).toLowerCase() : "";
    const ext = extOverride || originalExt || ".webp";

    if (!targetName || !targetName.trim()) {
      return fallbackName;
    }

    const clean = targetName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    return clean ? `${clean}${ext}` : fallbackName;
  };

  // Process selected file with instant object URL preview
  const processFile = (file: File) => {
    if (disabled) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file (PNG, JPG, WebP, GIF, or SVG).");
      return;
    }

    setUploadError(null);
    if (cropFile?.previewUrl) {
      revokeImagePreviewUrl(cropFile.previewUrl);
    }
    const previewUrl = createFastImagePreviewUrl(file);
    if (!previewUrl) {
      setUploadError("Could not read this image in your browser.");
      return;
    }
    setCropFile({ file, previewUrl });
    setIsCropOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      processFile(file);
    }
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Execute upload to /api/manage/upload via shared helper with live progress
  const executeUpload = async (fileBlob: Blob | File, filename: string, oldPreviewUrl?: string) => {
    if (disabled) return;
    setIsCropOpen(false);
    setCropFile(null);
    revokeImagePreviewUrl(oldPreviewUrl);
    setIsUploading(true);
    setUploadPhase("uploading");
    setUploadProgress(0);
    setUploadError(null);

    const targetFolder = isCustomFolder && customFolder.trim() ? customFolder.trim() : selectedFolder;
    const ext = fileBlob.type ? extensionForMime(fileBlob.type) : undefined;
    const finalFilename = getSanitizedTargetName(filename, ext);

    try {
      const uploadedUrl = await uploadPreparedBlobWithProgress({
        blob: fileBlob,
        fileName: finalFilename,
        folder: targetFolder,
        onPhase: setUploadPhase,
        onProgress: setUploadProgress,
      });
      setUploadProgress(100);
      setIsUploading(false);
      onChange(uploadedUrl);
    } catch (error) {
      setIsUploading(false);
      setUploadError(error instanceof Error ? error.message : "Upload failed. Please try again.");
    }
  };

  const handleConfirmCrop = (croppedBlob: Blob, croppedFileName: string) => {
    const ext = extensionForMime(croppedBlob.type || "image/webp");
    void executeUpload(croppedBlob, getSanitizedTargetName(croppedFileName, ext), cropFile?.previewUrl);
  };

  const handleSkipCrop = async () => {
    if (!cropFile) return;
    const selected = cropFile;

    // Close modal immediately and show live optimization state so upload never feels stalled
    setIsCropOpen(false);
    setCropFile(null);
    setIsUploading(true);
    setUploadPhase("preparing");
    setUploadProgress(8);
    setUploadError(null);

    try {
      const prepared = await prepareUncroppedImageForUpload(selected.file, selected.previewUrl);
      const ext = extensionForMime(prepared.mimeType, undefined);
      await executeUpload(prepared.blob, getSanitizedTargetName(prepared.fileName, ext), selected.previewUrl);
    } catch {
      await executeUpload(selected.file, getSanitizedTargetName(selected.file.name), selected.previewUrl);
    }
  };

  const handleCancelCrop = () => {
    setIsCropOpen(false);
    revokeImagePreviewUrl(cropFile?.previewUrl);
    setCropFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`grid gap-2.5 ${className}`}>
      {/* Hidden input to ensure native form submission captures the CDN URL */}
      <input type="hidden" name={name} value={value} required={required} />

      {/* Header with label & folder selector */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-ink flex items-center gap-1.5">
          <ImageIcon size={15} className="text-muted" />
          {label}
          {required ? <span className="text-accent">*</span> : null}
        </label>

        {/* Storage folder selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <Folder size={13} className="text-muted" />
          <span className="text-muted">Folder:</span>
          {isCustomFolder ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="Folder name"
                value={customFolder}
                onChange={(e) => setCustomFolder(e.target.value)}
                className="h-6 w-28 rounded-md border border-line bg-surface px-2 text-xs text-ink"
              />
              <button
                type="button"
                onClick={() => setIsCustomFolder(false)}
                className="text-[11px] text-muted hover:text-ink underline"
              >
                Preset
              </button>
            </div>
          ) : (
            <select
              value={selectedFolder}
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  setIsCustomFolder(true);
                } else {
                  setSelectedFolder(e.target.value);
                }
              }}
              className="h-7 rounded-md border border-line bg-white dark:bg-black px-2 text-xs text-ink dark:text-white font-medium"
            >
              {DEFAULT_UPLOAD_FOLDERS.map((f) => (
                <option key={f} value={f} className="bg-white dark:bg-black text-ink dark:text-white">
                  {f}/
                </option>
              ))}
              <option value="__custom__" className="bg-white dark:bg-black text-ink dark:text-white">+ Custom folder...</option>
            </select>
          )}
        </div>
      </div>

      {hint ? <p className="text-xs text-muted -mt-1">{hint}</p> : null}

      {/* Existing Uploaded Image / Document Display */}
      {value && !isUploading ? (
        <div className="relative overflow-hidden rounded-2xl border border-line bg-wash/30 p-3.5 transition hover:border-line/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
            {/* Thumbnail or PDF Document Icon */}
            {value.toLowerCase().split("?")[0].endsWith(".pdf") ? (
              <div className="flex aspect-[16/10] w-full sm:w-36 shrink-0 flex-col items-center justify-center rounded-xl border border-line bg-white text-navy shadow-xs p-3">
                <FileText size={32} className="text-accent" />
                <span className="mt-1 text-[11px] font-bold uppercase tracking-wider text-accent">PDF Document</span>
              </div>
            ) : (
              <div className="relative aspect-[16/10] w-full sm:w-36 shrink-0 overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}

            {/* URL & Controls */}
            <div className="flex-1 min-w-0 grid gap-1.5 w-full">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <Check size={12} /> Stored on CDN
                </span>
                <span className="text-[11px] text-muted truncate">
                  {value.startsWith("https://cdn.iissboys.com") ? "RustFS Object Storage" : "External Host"}
                </span>
              </div>

              {/* URL Display */}
              <p className="truncate font-mono text-xs text-ink/80 select-all" title={value}>
                {value}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink/80 hover:bg-wash transition shadow-2xs"
                >
                  {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  {copied ? "Copied" : "Copy URL"}
                </button>

                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink/80 hover:bg-wash transition shadow-2xs"
                >
                  <ExternalLink size={12} />
                  Open
                </a>

                {!disabled ? (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink/80 hover:bg-wash transition shadow-2xs"
                    >
                      <RefreshCw size={12} />
                      Change
                    </button>

                    <button
                      type="button"
                      onClick={() => onChange("")}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                      title="Remove file"
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State: Dropzone & File Picker */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
            disabled
              ? "border-line/60 bg-wash/10 opacity-60 cursor-not-allowed"
              : isDragging
                ? "border-navy bg-navy/5 scale-[0.99] cursor-pointer"
                : "border-line bg-wash/30 hover:border-navy/40 hover:bg-wash/60 cursor-pointer"
          }`}
        >
          {isUploading ? (
            /* Upload Progress Indicator */
            <div className="w-full max-w-xs space-y-2.5 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-navy flex items-center gap-1.5">
                  <RefreshCw size={13} className="animate-spin text-navy" />
                  {uploadPhase === "preparing"
                    ? "Optimizing photo..."
                    : uploadPhase === "saving"
                      ? "Saving to storage..."
                      : "Uploading photograph..."}
                </span>
                <span className="font-mono text-muted">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-line/60">
                <div
                  className="h-full bg-navy transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-muted">
                Storing into &ldquo;{isCustomFolder && customFolder.trim() ? customFolder.trim() : selectedFolder}&rdquo; bucket folder...
              </p>
            </div>
          ) : (
            /* Idle Dropzone Call to Action */
            <>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface border border-line text-navy group-hover:scale-105 transition shadow-xs">
                <Upload size={20} />
              </div>
              <div className="mt-2.5 space-y-1">
                <p className="text-sm font-medium text-ink">
                  Click to upload or drag &amp; drop photograph
                </p>
                <p className="text-xs text-muted">
                  Includes visual cropping &amp; visible area framing before saving.
                </p>
              </div>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-surface border border-line px-3 py-1 text-[11px] font-medium text-muted">
                <Crop size={11} className="text-navy" />
                Framing tool included &bull; Up to 20MB
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        disabled={disabled}
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload Error Banner */}
      {uploadError ? (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          <AlertCircle size={15} className="shrink-0 text-red-600" />
          <p className="flex-1">{uploadError}</p>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-800 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Manual URL Input Fallback */}
      <div className="pt-0.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowManualInput(!showManualInput)}
          className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink transition disabled:opacity-50"
        >
          <LinkIcon size={11} />
          {showManualInput ? "Hide manual URL input" : "Or enter external image address manually"}
        </button>

        {showManualInput ? (
          <div className="mt-2 grid gap-1.5 animate-in fade-in duration-150">
            <input
              type="url"
              disabled={disabled}
              placeholder="https://cdn.iissboys.com/iissimages/... or https://..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-9 w-full rounded-xl border border-line bg-surface px-3 font-mono text-xs text-ink placeholder:text-muted/60 disabled:opacity-50"
            />
            <p className="text-[11px] text-muted">
              Direct HTTPS URLs from <span className="font-mono">cdn.iissboys.com</span> or approved image hosts.
            </p>
          </div>
        ) : null}
      </div>

      {/* Visual Crop & Framing Modal */}
      {cropFile ? (
        <ImageCropModal
          isOpen={isCropOpen}
          imageUrl={cropFile.previewUrl}
          fileName={getSanitizedTargetName(cropFile.file.name)}
          initialAspectRatio={aspectRatio}
          onConfirm={handleConfirmCrop}
          onSkipCrop={handleSkipCrop}
          onCancel={handleCancelCrop}
        />
      ) : null}
    </div>
  );
}
