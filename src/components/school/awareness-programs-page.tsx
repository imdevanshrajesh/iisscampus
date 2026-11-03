"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Calendar,
  X,
  FileText,
  ArrowRight,
  ExternalLink,
  Search,
  Filter,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { classifyNavigationUrl } from "@/lib/media/url";
import type { CustomProgram } from "@/lib/types";

export function AwarenessProgramsPage({ programs }: { programs: CustomProgram[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string; title: string } | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of programs) {
      if (p.category?.trim()) {
        set.add(p.category.trim());
      }
    }
    return ["All", ...Array.from(set)];
  }, [programs]);

  const filtered = useMemo(() => {
    return programs.filter((item) => {
      const matchesCat =
        selectedCategory === "All" || (item.category || "Awareness") === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        (item.timing && item.timing.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [programs, selectedCategory, searchQuery]);

  function openImage(src: string, alt: string, title: string) {
    setLightbox({ src, alt, title });
    dialogRef.current?.showModal();
  }

  function closeImage() {
    dialogRef.current?.close();
    setLightbox(null);
  }

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-10 md:px-8 md:py-16">
      {/* Editorial Header */}
      <div className="max-w-3xl">
        <div>
          <p className="kicker text-accent font-semibold tracking-wider text-xs uppercase">
            Campus Life &amp; Celebrations
          </p>
        </div>

        <h1 className="font-display mt-3 text-[clamp(2.8rem,6vw,5rem)] leading-[0.92] text-ink">
          Programs &amp; <span className="italic">Activities</span>
        </h1>

        <p className="mt-4 text-base md:text-lg leading-relaxed text-ink/80">
          Awareness campaigns, campus celebrations (like our annual Mango Day!), and fun co-curricular
          traditions that bring our school community together outside regular scheduled fixtures.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-y border-line/80 py-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted">
            <Filter size={12} /> Filter:
          </span>
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer ${
                  active
                    ? "bg-navy text-white shadow-xs"
                    : "bg-wash text-ink/75 hover:bg-line/40 hover:text-ink"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px] sm:min-w-[280px]">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search programs & activities..."
            className="w-full rounded-full border border-line bg-white/90 py-1.5 pl-9 pr-3 text-xs text-ink placeholder:text-muted/70 focus:border-accent focus:outline-hidden focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Event-styled Programs Grid */}
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((program) => {
          const [cover, ...rest] = program.photos;
          const website = program.websiteUrl ? classifyNavigationUrl(program.websiteUrl) : null;
          const pdf = program.pdfUrl ? classifyNavigationUrl(program.pdfUrl) : null;

          return (
            <article
              key={program.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line/80 bg-white/95 shadow-xs transition duration-300 hover:border-navy/40 hover:shadow-xl"
            >
              {/* Event-like Image Banner */}
              {cover ? (
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#faf8f0] border-b border-line/60">
                  <button
                    type="button"
                    onClick={() => openImage(cover.url, cover.alt || program.title, program.title)}
                    className="h-full w-full block text-left cursor-zoom-in"
                    title="Click to view full photo"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cover.url}
                      alt={cover.alt || program.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </button>

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                    {program.category ? (
                      <span className="rounded-full bg-navy/85 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                        {program.category}
                      </span>
                    ) : null}
                    {program.timing ? (
                      <span className="rounded-full bg-amber-500/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                        {program.timing}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="relative aspect-[16/10] w-full bg-linear-to-br from-[#12141c] to-[#1c2438] p-5 flex flex-col justify-between text-white border-b border-line/60">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      {program.category || "Campus Activity"}
                    </span>
                    {program.timing ? (
                      <span className="text-[11px] text-white/70">{program.timing}</span>
                    ) : null}
                  </div>
                  <div>
                    <Sparkles className="h-6 w-6 text-amber-400 mb-2 opacity-80" />
                    <h3 className="font-display text-xl font-medium leading-snug">{program.title}</h3>
                  </div>
                </div>
              )}

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-6 space-y-4">
                <div>
                  <h2 className="font-display text-2xl font-medium leading-snug text-ink group-hover:text-accent transition-colors">
                    {program.title}
                  </h2>
                </div>

                {program.summary ? (
                  <p className="text-sm leading-relaxed text-muted line-clamp-4 whitespace-pre-line">
                    {program.summary}
                  </p>
                ) : null}

                {/* Photo Strip Gallery (click to open in lightbox) */}
                {rest.length > 0 ? (
                  <div className="pt-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1.5 flex items-center gap-1">
                      <ImageIcon size={12} /> Photo Memories ({rest.length})
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {rest.map((photo, pIdx) => (
                        <button
                          key={photo.url || pIdx}
                          type="button"
                          onClick={() => openImage(photo.url, photo.alt || program.title, program.title)}
                          className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line hover:border-accent hover:opacity-90 transition cursor-zoom-in"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt={photo.alt || `Photo ${pIdx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Associated Event Link */}
                {program.event ? (
                  <div className="rounded-xl border border-line/60 bg-wash/30 p-2.5 text-xs flex items-center justify-between gap-2">
                    <span className="text-muted flex items-center gap-1">
                      <Calendar size={13} className="text-accent" /> Associated Event:
                    </span>
                    <Link
                      href={`/events/${program.event.slug}`}
                      className="font-semibold text-accent hover:underline flex items-center gap-1"
                    >
                      <span>{program.event.title}</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                ) : null}

                {/* Footer Action Buttons */}
                <div className="mt-auto pt-4 border-t border-line/60 flex flex-wrap items-center gap-2">
                  {pdf?.ok ? (
                    <a
                      href={pdf.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy/90 transition shadow-xs"
                    >
                      <Download size={13} />
                      <span>Download PDF Flyer</span>
                    </a>
                  ) : null}

                  {website?.ok ? (
                    <a
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-wash/50 px-3 py-2 text-xs font-semibold text-ink hover:bg-white hover:border-accent transition shadow-2xs"
                    >
                      <span>{program.websiteLabel || "External Link"}</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-line bg-wash/30 p-12 text-center text-muted">
          <Sparkles className="mx-auto h-8 w-8 text-muted/50 mb-2" />
          <p className="text-sm font-medium">No awareness or activity programs match your selection.</p>
        </div>
      ) : null}

      {/* Lightbox Dialog (Wellness style) */}
      <dialog
        ref={dialogRef}
        className="lightbox-dialog"
        aria-label="Program photograph lightbox"
        onClose={() => setLightbox(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeImage();
        }}
      >
        {lightbox ? (
          <div>
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm text-muted font-medium">{lightbox.title}</p>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-black/5 text-ink transition cursor-pointer"
                onClick={closeImage}
                aria-label="Close photo preview"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/5 max-h-[80vh] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightbox.src}
                alt={lightbox.alt}
                className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
              />
            </div>
            {lightbox.alt ? (
              <p className="border-t border-line px-4 py-2.5 text-xs text-muted text-center">
                {lightbox.alt}
              </p>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
