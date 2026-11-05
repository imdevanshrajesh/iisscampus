"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Crop, ZoomIn, ZoomOut, Check, X, Eye, Maximize2 } from "lucide-react";

export type CropAspectRatio = "16:10" | "3:2" | "4:3" | "1:1" | "free";

type ImageCropModalProps = {
  isOpen: boolean;
  imageUrl: string;
  fileName: string;
  initialAspectRatio?: CropAspectRatio;
  onConfirm: (croppedBlob: Blob, croppedFileName: string) => void;
  onSkipCrop: () => void;
  onCancel: () => void;
};

const ASPECT_RATIOS: { id: CropAspectRatio; label: string; ratio: number | null; hint: string }[] = [
  { id: "16:10", label: "16:10", ratio: 16 / 10, hint: "Event Cards & Home Hero" },
  { id: "3:2", label: "3:2", ratio: 3 / 2, hint: "Detail Page Frame" },
  { id: "4:3", label: "4:3", ratio: 4 / 3, hint: "Standard Photo" },
  { id: "1:1", label: "1:1", ratio: 1, hint: "Square Thumbnail" },
  { id: "free", label: "Free", ratio: null, hint: "Custom Selection" },
];

export function ImageCropModal({
  isOpen,
  imageUrl,
  fileName,
  initialAspectRatio = "16:10",
  onConfirm,
  onSkipCrop,
  onCancel,
}: ImageCropModalProps) {
  const [selectedRatio, setSelectedRatio] = useState<CropAspectRatio>(initialAspectRatio);
  const [zoom, setZoom] = useState<number>(1);
  const [showLivePreview, setShowLivePreview] = useState<boolean>(false);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Crop box rectangle in percentage of image (0 to 100)
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 10,
    y: 10,
    width: 80,
    height: 60,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    isDragging: boolean;
    dragType: "move" | "nw" | "ne" | "sw" | "se" | null;
    startX: number;
    startY: number;
    startCrop: { x: number; y: number; width: number; height: number };
  }>({
    isDragging: false,
    dragType: null,
    startX: 0,
    startY: 0,
    startCrop: { x: 0, y: 0, width: 0, height: 0 },
  });

  // Reset and adjust crop when image loads or aspect ratio changes
  const applyAspectRatio = useCallback(
    (ratioId: CropAspectRatio, imgWidth: number, imgHeight: number) => {
      if (!imgWidth || !imgHeight) return;
      const targetRatio = ASPECT_RATIOS.find((r) => r.id === ratioId)?.ratio;

      if (!targetRatio) {
        setCropRect({ x: 5, y: 5, width: 90, height: 90 });
        return;
      }

      const imgAspect = imgWidth / imgHeight;
      let newW = 85;
      let newH = 85;

      if (imgAspect > targetRatio) {
        // Image is wider than crop box
        newH = 85;
        newW = (newH * targetRatio) / imgAspect;
      } else {
        // Image is taller than crop box
        newW = 85;
        newH = (newW * imgAspect) / targetRatio;
      }

      const newX = Math.max(0, (100 - newW) / 2);
      const newY = Math.max(0, (100 - newH) / 2);

      setCropRect({
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
      });
    },
    [],
  );

  useEffect(() => {
    if (imageNaturalSize.width && imageNaturalSize.height) {
      applyAspectRatio(selectedRatio, imageNaturalSize.width, imageNaturalSize.height);
    }
  }, [selectedRatio, imageNaturalSize, applyAspectRatio]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    applyAspectRatio(selectedRatio, img.naturalWidth, img.naturalHeight);
  };

  // Mouse & Touch Drag Handlers
  const handlePointerDown = (
    e: React.PointerEvent,
    type: "move" | "nw" | "ne" | "sw" | "se",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      isDragging: true,
      dragType: type,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...cropRect },
    };
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag.isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const deltaXPercent = ((e.clientX - drag.startX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - drag.startY) / rect.height) * 100;

      const { startCrop, dragType } = drag;

      if (dragType === "move") {
        let newX = startCrop.x + deltaXPercent;
        let newY = startCrop.y + deltaYPercent;

        newX = Math.max(0, Math.min(100 - startCrop.width, newX));
        newY = Math.max(0, Math.min(100 - startCrop.height, newY));

        setCropRect((prev) => ({ ...prev, x: newX, y: newY }));
      } else if (dragType) {
        // Resizing handles
        let newX = startCrop.x;
        let newY = startCrop.y;
        let newW = startCrop.width;
        let newH = startCrop.height;

        if (dragType === "se") {
          newW = Math.max(15, Math.min(100 - startCrop.x, startCrop.width + deltaXPercent));
          newH = Math.max(15, Math.min(100 - startCrop.y, startCrop.height + deltaYPercent));
        } else if (dragType === "sw") {
          const proposedX = Math.max(0, Math.min(startCrop.x + startCrop.width - 15, startCrop.x + deltaXPercent));
          newW = startCrop.width + (startCrop.x - proposedX);
          newX = proposedX;
          newH = Math.max(15, Math.min(100 - startCrop.y, startCrop.height + deltaYPercent));
        } else if (dragType === "ne") {
          newW = Math.max(15, Math.min(100 - startCrop.x, startCrop.width + deltaXPercent));
          const proposedY = Math.max(0, Math.min(startCrop.y + startCrop.height - 15, startCrop.y + deltaYPercent));
          newH = startCrop.height + (startCrop.y - proposedY);
          newY = proposedY;
        } else if (dragType === "nw") {
          const proposedX = Math.max(0, Math.min(startCrop.x + startCrop.width - 15, startCrop.x + deltaXPercent));
          const proposedY = Math.max(0, Math.min(startCrop.y + startCrop.height - 15, startCrop.y + deltaYPercent));
          newW = startCrop.width + (startCrop.x - proposedX);
          newH = startCrop.height + (startCrop.y - proposedY);
          newX = proposedX;
          newY = proposedY;
        }

        setCropRect({ x: newX, y: newY, width: newW, height: newH });
      }
    };

    const handlePointerUp = () => {
      dragRef.current.isDragging = false;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [cropRect]);

  // Execute Canvas Crop
  const handleCropAndSave = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;

    const canvas = document.createElement("canvas");
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    const sourceX = (cropRect.x / 100) * naturalWidth;
    const sourceY = (cropRect.y / 100) * naturalHeight;
    const sourceWidth = (cropRect.width / 100) * naturalWidth;
    const sourceHeight = (cropRect.height / 100) * naturalHeight;

    // Limit maximum canvas dimensions for high quality without memory lag
    const maxOutputDim = 1920;
    let targetWidth = sourceWidth;
    let targetHeight = sourceHeight;

    if (targetWidth > maxOutputDim || targetHeight > maxOutputDim) {
      if (targetWidth > targetHeight) {
        targetHeight = Math.round((maxOutputDim * targetHeight) / targetWidth);
        targetWidth = maxOutputDim;
      } else {
        targetWidth = Math.round((maxOutputDim * targetWidth) / targetHeight);
        targetHeight = maxOutputDim;
      }
    }

    canvas.width = Math.max(10, Math.round(targetWidth));
    canvas.height = Math.max(10, Math.round(targetHeight));

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingQuality = "high";
    ctx.imageSmoothingEnabled = true;

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    // Prefer modern WebP format
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const baseName = fileName.replace(/\.[^/.]+$/, "");
        const croppedName = `${baseName}-framed.webp`;
        onConfirm(blob, croppedName);
      },
      "image/webp",
      0.85,
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-wash/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/10 text-navy">
              <Crop size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink">Select Visible Framing</h3>
              <p className="text-xs text-muted">
                Drag the crop window over the part of the image you want visible on cards & headers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-muted hover:bg-line/40 hover:text-ink transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar: Aspect Ratio Presets & Zoom */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-2.5 bg-white text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-muted mr-1">Visible ratio:</span>
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.id}
                type="button"
                onClick={() => setSelectedRatio(ratio.id)}
                title={ratio.hint}
                className={`rounded-lg px-2.5 py-1 font-medium transition ${
                  selectedRatio === ratio.id
                    ? "bg-navy text-white shadow-xs"
                    : "bg-wash text-ink/70 hover:bg-line/50 hover:text-ink"
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Live Preview Toggle */}
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition ${
                showLivePreview ? "bg-accent/10 text-accent font-semibold" : "text-muted hover:text-ink"
              }`}
            >
              <Eye size={14} />
              {showLivePreview ? "Hide Card Preview" : "Card Preview"}
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5 text-muted">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
                className="rounded p-1 hover:bg-wash hover:text-ink"
                title="Zoom out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="w-9 text-center font-mono">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
                className="rounded p-1 hover:bg-wash hover:text-ink"
                title="Zoom in"
              >
                <ZoomIn size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Crop Work Area */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-950/95 p-6 min-h-[380px] max-h-[58vh]">
          {showLivePreview ? (
            /* Live Card Simulation Frame */
            <div className="flex flex-col items-center justify-center p-4">
              <p className="mb-2 text-xs font-medium text-slate-400">
                Card appearance on the main website (16:10 format):
              </p>
              <div className="w-[320px] overflow-hidden rounded-2xl border border-slate-700 bg-white shadow-xl">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${imageUrl})`,
                      backgroundPosition: `${cropRect.x + cropRect.width / 2}% ${cropRect.y + cropRect.height / 2}%`,
                      backgroundSize: `${(100 / Math.max(1, cropRect.width)) * 100}% ${(100 / Math.max(1, cropRect.height)) * 100}%`,
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                </div>
                <div className="p-4 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Sample Event</span>
                  <p className="text-sm font-semibold text-slate-900 leading-tight">School Activity Title</p>
                  <p className="text-xs text-slate-500">The visible part of your photo framed cleanly.</p>
                </div>
              </div>
            </div>
          ) : (
            /* Interactive Cropping Surface */
            <div
              ref={containerRef}
              className="relative select-none max-h-full max-w-full flex items-center justify-center"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
            >
              {/* Target Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Source preview"
                onLoad={handleImageLoad}
                className="max-h-[50vh] max-w-full object-contain pointer-events-none rounded shadow-md"
              />

              {/* Darkened Mask Over Entire Image */}
              <div className="absolute inset-0 bg-black/60 pointer-events-none" />

              {/* Clear Crop Window Overlay */}
              <div
                style={{
                  position: "absolute",
                  left: `${cropRect.x}%`,
                  top: `${cropRect.y}%`,
                  width: `${cropRect.width}%`,
                  height: `${cropRect.height}%`,
                }}
                className="border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] cursor-move transition-shadow"
                onPointerDown={(e) => handlePointerDown(e, "move")}
              >
                {/* Rule of Thirds Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                  <div className="border-r border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-b border-white/25" />
                  <div className="border-r border-white/25" />
                  <div className="border-r border-white/25" />
                  <div />
                </div>

                {/* Visible Area Label */}
                <div className="absolute top-1.5 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-white pointer-events-none">
                  Visible area
                </div>

                {/* Corner Resize Handles */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, "nw")}
                  className="absolute -top-1.5 -left-1.5 h-3.5 w-3.5 rounded-full bg-white shadow border border-slate-600 cursor-nwse-resize"
                />
                <div
                  onPointerDown={(e) => handlePointerDown(e, "ne")}
                  className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-white shadow border border-slate-600 cursor-nesw-resize"
                />
                <div
                  onPointerDown={(e) => handlePointerDown(e, "sw")}
                  className="absolute -bottom-1.5 -left-1.5 h-3.5 w-3.5 rounded-full bg-white shadow border border-slate-600 cursor-nesw-resize"
                />
                <div
                  onPointerDown={(e) => handlePointerDown(e, "se")}
                  className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-white shadow border border-slate-600 cursor-nwse-resize"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5 bg-wash/60">
          <button
            type="button"
            onClick={onSkipCrop}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-xs font-medium text-ink/80 hover:bg-white hover:text-ink transition"
          >
            <Maximize2 size={14} />
            Upload Full Image (No Crop)
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl px-4 py-2 text-xs font-medium text-muted hover:text-ink transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCropAndSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-xs font-medium text-white shadow-sm hover:opacity-95 transition"
            >
              <Check size={14} />
              Save Framing & Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
