"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { GraduationCap, Mail, Phone, Quote, Search, Sparkles } from "lucide-react";
import type { SchoolHead, HeadTier } from "@/lib/types";

const TIER_ORDER: Record<HeadTier, number> = {
  executive: 1,
  section: 2,
  department: 3,
};

const TIER_LABELS: Record<HeadTier, string> = {
  executive: "Executive Leadership",
  section: "Section Heads",
  department: "Department Heads",
};

export function HeadsPage({ heads }: { heads: SchoolHead[] }) {
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return heads.filter((item) => {
      const matchesTier = selectedTier === "all" || item.tier === selectedTier;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q) ||
        (item.department && item.department.toLowerCase().includes(q)) ||
        item.message.toLowerCase().includes(q);
      return matchesTier && matchesSearch;
    });
  }, [heads, selectedTier, searchQuery]);

  // Group by hierarchy tier: executive, section, department
  const grouped = useMemo(() => {
    const execs = filtered.filter((h) => h.tier === "executive").sort((a, b) => a.sortOrder - b.sortOrder);
    const sections = filtered.filter((h) => h.tier === "section").sort((a, b) => a.sortOrder - b.sortOrder);
    const depts = filtered.filter((h) => h.tier === "department").sort((a, b) => a.sortOrder - b.sortOrder);
    return { execs, sections, depts };
  }, [filtered]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-20">
      {/* Editorial Header - Centered */}
      <div className="max-w-3xl mx-auto text-center">
        <p className="kicker text-accent font-semibold tracking-widest text-xs uppercase">
          Academic Directorate &amp; Faculty
        </p>

        <h1 className="font-display mt-3 text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-ink">
          Campus <span className="italic">Heads</span>
        </h1>

        <p className="mt-4 text-base md:text-lg leading-relaxed text-ink/80">
          Guidance, educational philosophy, and personal messages from our school leadership to the young men of IISS.
        </p>
      </div>

      {/* Relevant Hierarchy Filters & Search - Centered */}
      <div className="mt-10 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
        {/* Hierarchy Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-line shadow-xs overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSelectedTier("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              selectedTier === "all"
                ? "bg-ink text-cream shadow-xs"
                : "text-muted hover:text-ink hover:bg-zinc-50"
            }`}
          >
            All Heads ({heads.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTier("executive")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              selectedTier === "executive"
                ? "bg-ink text-cream shadow-xs"
                : "text-muted hover:text-ink hover:bg-zinc-50"
            }`}
          >
            Executive Leadership
          </button>
          <button
            type="button"
            onClick={() => setSelectedTier("section")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              selectedTier === "section"
                ? "bg-ink text-cream shadow-xs"
                : "text-muted hover:text-ink hover:bg-zinc-50"
            }`}
          >
            Section Heads
          </button>
          <button
            type="button"
            onClick={() => setSelectedTier("department")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              selectedTier === "department"
                ? "bg-ink text-cream shadow-xs"
                : "text-muted hover:text-ink hover:bg-zinc-50"
            }`}
          >
            Department Heads
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search heads by name..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-line rounded-2xl focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>
      </div>

      {/* Tiered Content Presentation */}
      <div className="mt-14 space-y-16">
        {/* 1. Executive Leadership Tier */}
        {grouped.execs.length > 0 && (
          <section className="space-y-6">
            <div className="text-center">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                Executive Directorate
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {grouped.execs.map((head) => (
                <HeadCard key={head.id} head={head} isFeatured />
              ))}
            </div>
          </section>
        )}

        {/* 2. Section Heads Tier */}
        {grouped.sections.length > 0 && (
          <section className="space-y-6">
            <div className="text-center">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-navy px-3 py-1 rounded-full bg-navy/10 border border-navy/20">
                Section Heads &amp; Supervisors
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {grouped.sections.map((head) => (
                <HeadCard key={head.id} head={head} />
              ))}
            </div>
          </section>
        )}

        {/* 3. Department & Activities Heads Tier */}
        {grouped.depts.length > 0 && (
          <section className="space-y-6">
            <div className="text-center">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink/60 px-3 py-1 rounded-full bg-zinc-100 border border-line">
                Department &amp; Student Affairs Heads
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {grouped.depts.map((head) => (
                <HeadCard key={head.id} head={head} />
              ))}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white/50 rounded-3xl border border-dashed border-line max-w-md mx-auto">
            <GraduationCap className="h-10 w-10 text-muted mx-auto mb-3" />
            <h3 className="text-base font-semibold text-ink">No Heads Found</h3>
            <p className="text-xs text-muted mt-1">Try adjusting your search criteria or filter tab.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HeadCard({ head, isFeatured = false }: { head: SchoolHead; isFeatured?: boolean }) {
  return (
    <div
      className={`rounded-3xl border border-line bg-white p-7 sm:p-8 flex flex-col justify-between items-center text-center shadow-[0_2px_12px_rgba(20,27,56,0.04)] hover:shadow-md transition duration-300 ${
        isFeatured ? "ring-1 ring-accent/30" : ""
      }`}
    >
      <div className="flex flex-col items-center w-full">
        {/* Head Portrait */}
        <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden border-3 border-accent/20 bg-zinc-100 shadow-md">
          {head.photoUrl ? (
            <Image
              src={head.photoUrl}
              alt={head.name}
              fill
              sizes="(max-width: 640px) 96px, 112px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-navy/5 text-navy text-2xl font-bold font-serif">
              {head.name
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")}
            </div>
          )}
        </div>

        {/* Name & Role */}
        <div className="mt-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-navy/5 text-navy">
            {head.tierLabel || TIER_LABELS[head.tier]}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-ink font-display pt-1">
            {head.name}
          </h2>
          <p className="text-xs sm:text-sm font-medium text-accent">
            {head.role}
          </p>
          {head.department && (
            <p className="text-xs text-muted">
              {head.department}
            </p>
          )}
        </div>

        {/* Message to Students */}
        {head.message && (
          <div className="mt-5 pt-5 border-t border-line/60 w-full relative">
            <Quote className="h-5 w-5 text-accent/30 mx-auto mb-2" />
            <p className="text-xs sm:text-sm italic font-serif leading-relaxed text-ink/80 px-2 sm:px-4">
              &ldquo;{head.message}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Contact Links */}
      {(head.email || head.phone) && (
        <div className="mt-6 pt-4 border-t border-line/50 w-full flex items-center justify-center gap-4 text-xs text-muted">
          {head.email && (
            <a
              href={`mailto:${head.email}`}
              className="inline-flex items-center gap-1.5 hover:text-ink transition"
            >
              <Mail size={13} />
              <span>{head.email}</span>
            </a>
          )}
          {head.phone && (
            <a
              href={`tel:${head.phone}`}
              className="inline-flex items-center gap-1.5 hover:text-ink transition"
            >
              <Phone size={13} />
              <span>{head.phone}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
