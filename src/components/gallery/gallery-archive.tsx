"use client";

import { useEffect, useState } from "react";
import { ChevronDown, History } from "lucide-react";
import { GalleryView, type GalleryGroup } from "@/components/gallery/gallery-view";

export function GalleryArchive({
  groups,
  hosts,
  showEventActions = false,
}: {
  groups: GalleryGroup[];
  hosts: readonly string[];
  showEventActions?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function openOnHashMatch() {
      const hash = window.location.hash.replace(/^#/, "").trim();
      if (!hash) return;
      if (groups.some((group) => `gallery-${group.event.slug}` === hash)) {
        setOpen(true);
      }
    }
    openOnHashMatch();
    window.addEventListener("hashchange", openOnHashMatch);
    return () => window.removeEventListener("hashchange", openOnHashMatch);
  }, [groups]);

  if (!groups.length) return null;

  return (
    <section className="mt-16 border-t border-line pt-10">
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-wash/35 sm:px-6"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
              <History size={14} />
              <span>Previous Terms Archive</span>
            </div>
            <h2 className="font-display mt-1.5 text-2xl text-ink sm:text-3xl">
              Earlier Event Photographs ({groups.length})
            </h2>
            <p className="mt-1 text-sm text-muted">
              Archived event photographs from earlier terms remain preserved here. Expand to browse or open the lightbox.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink">
            <span>{open ? "Collapse archive" : "Show archive"}</span>
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {open ? (
          <div className="border-t border-line/80 px-5 py-8 sm:px-6">
            <GalleryView groups={groups} hosts={hosts} showEventActions={showEventActions} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
