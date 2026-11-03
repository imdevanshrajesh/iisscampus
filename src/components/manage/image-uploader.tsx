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
} from "lucide-react";
import { ImageCropModal, type CropAspectRatio } from "./image-crop-modal";
import { DEFAULT_UPLOAD_FOLDERS } from "@/lib/media/rustfs";

type ImageUploaderProps = {
  name: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
  aspectRatio?: CropAspectRatio;
  className?: string;
  required?: boolean;
};

export function ImageUploader({
  name,
  value,
  onChange,
  folder = "Events",
  label = "Photograph",
  hint,
  aspectRatio = "16:10",
  className = "",
  required = false,
}: ImageUploaderProps) {
  const [selectedFolder, setSelectedFolder] = useState<string>(folder);
  const [customFolder, setCustomFolder] = useState<string>("");
  const [isCustomFolder, setIsCustomFolder] = useState<boolean>(false);

  // Upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);

  // Crop modal state
  const [cropFile, setCropFile] = useState<{ file: File; dataUrl: string } | null>(null);
  const [isCropOpen, setIsCropOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle clipboard copy
  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Process selected file
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file (PNG, JPG, WebP, GIF, or SVG).");
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCropFile({ file, dataUrl });
      setIsCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Execute upload to /api/manage/upload with XMLHttpRequest for live progress
  const executeUpload = (fileBlob: Blob | File, filename: string) => {
    setIsCropOpen(false);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const targetFolder = isCustomFolder && customFolder.trim() ? customFolder.trim() : selectedFolder;

    const formData = new FormData();
    formData.append("file", fileBlob, filename);
    formData.append("folder", targetFolder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/manage/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.url) {
          onChange(response.url);
          setUploadProgress(100);
        } else {
          setUploadError(response.error || "Upload failed. Please check server configuration.");
        }
      } catch {
        setUploadError("Unexpected server response. Please try again.");
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setUploadError("Network connection failed during upload.");
    };

    xhr.send(formData);
  };

  const handleConfirmCrop = (croppedBlob: Blob, croppedFileName: string) => {
    executeUpload(croppedBlob, croppedFileName);
  };

  const handleSkipCrop = async () => {
    if (!cropFile) return;

    // Vercel serverless functions have a 4.5MB request payload limit.
    // Automatically downscale oversized uncropped photos on client canvas so uploads succeed reliably.
    if (cropFile.file.size > 3.5 * 1024 * 1024) {
      try {
        const img = new Image();
        img.src = cropFile.dataUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });

        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          const maxDim = 3200;
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((maxDim * h) / w);
              w = maxDim;
            } else {
              w = Math.round((maxDim * w) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, w, h);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const baseName = cropFile.file.name.replace(/\.[^/.]+$/, "");
                  executeUpload(blob, `${baseName}.webp`);
                } else {
                  executeUpload(cropFile.file, cropFile.file.name);
                }
              },
              "image/webp",
              0.90,
            );
            return;
          }
        }
      } catch {
        // Fallback to original file
      }
    }

    executeUpload(cropFile.file, cropFile.file.name);
  };

  const handleCancelCrop = () => {
    setIsCropOpen(false);
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
              className="h-6 rounded-md border border-line bg-surface px-1.5 text-xs text-ink font-medium"
            >
              {DEFAULT_UPLOAD_FOLDERS.map((f) => (
                <option key={f} value={f}>
                  {f}/
                </option>
              ))}
              <option value="__custom__">+ Custom folder...</option>
            </select>
          )}
        </div>
      </div>

      {hint ? <p className="text-xs text-muted -mt-1">{hint}</p> : null}

      {/* Existing Uploaded Image Display */}
      {value ? (
        <div className="relative overflow-hidden rounded-2xl border border-line bg-wash/30 p-3.5 transition hover:border-line/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
            {/* Image Thumbnail */}
            <div className="relative aspect-[16/10] w-full sm:w-36 shrink-0 overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="Preview" className="h-full w-full object-cover" />
            </div>

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
                  title="Remove image"
                >
                  <Trash2 size={12} />
                  Remove
                </button>
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
          onClick={() => fileInputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
            isDragging
              ? "border-navy bg-navy/5 scale-[0.99]"
              : "border-line bg-wash/30 hover:border-navy/40 hover:bg-wash/60"
          }`}
        >
          {isUploading ? (
            /* Upload Progress Indicator */
            <div className="w-full max-w-xs space-y-2.5 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-navy flex items-center gap-1.5">
                  <RefreshCw size={13} className="animate-spin text-navy" />
                  Uploading to RustFS...
                </span>
                <span className="font-mono text-muted">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-line/60">
                <div
                  className="h-full bg-navy transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-muted">Storing into &ldquo;{selectedFolder}&rdquo; bucket folder...</p>
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
          onClick={() => setShowManualInput(!showManualInput)}
          className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink transition"
        >
          <LinkIcon size={11} />
          {showManualInput ? "Hide manual URL input" : "Or enter external image address manually"}
        </button>

        {showManualInput ? (
          <div className="mt-2 grid gap-1.5 animate-in fade-in duration-150">
            <input
              type="url"
              placeholder="https://cdn.iissboys.com/iissimages/... or https://..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-9 w-full rounded-xl border border-line bg-surface px-3 font-mono text-xs text-ink placeholder:text-muted/60"
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
          imageUrl={cropFile.dataUrl}
          fileName={cropFile.file.name}
          initialAspectRatio={aspectRatio}
          onConfirm={handleConfirmCrop}
          onSkipCrop={handleSkipCrop}
          onCancel={handleCancelCrop}
        />
      ) : null}
    </div>
  );
}
