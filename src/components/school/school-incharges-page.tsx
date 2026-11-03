"use client";

import { useState, useMemo } from "react";
import { GraduationCap, Mail, Sparkles, UserCheck, Search, Filter } from "lucide-react";
import type { SchoolIncharge } from "@/lib/types";

export function SchoolInchargesPage({ incharges }: { incharges: SchoolIncharge[] }) {
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const inc of incharges) {
      if (inc.department?.trim()) {
        set.add(inc.department.trim());
      }
    }
    return ["All", ...Array.from(set)];
  }, [incharges]);

  const filtered = useMemo(() => {
    return incharges.filter((item) => {
      const matchesDept = selectedDept === "All" || item.department === selectedDept;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q) ||
        (item.department && item.department.toLowerCase().includes(q)) ||
        (item.about && item.about.toLowerCase().includes(q)) ||
        (item.message && item.message.toLowerCase().includes(q));
      return matchesDept && matchesSearch;
    });
  }, [incharges, selectedDept, searchQuery]);

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-10 md:px-8 md:py-16">
      {/* Editorial Header */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <GraduationCap size={15} />
          </span>
          <p className="kicker text-accent font-semibold tracking-wider text-xs uppercase">
            Campus Mentors &amp; Heads
          </p>
        </div>

        <h1 className="font-display mt-3 text-[clamp(2.8rem,6vw,5rem)] leading-[0.92] text-ink">
          School <span className="italic">Incharges</span>
        </h1>

        <p className="mt-4 text-base md:text-lg leading-relaxed text-ink/80">
          Meet the academic supervisors, section heads, and coordinators who steer day-to-day life,
          student wellbeing, and activities across the boys&apos; campus.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-y border-line/80 py-4">
        {/* Department Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted">
            <Filter size={12} /> Filter:
          </span>
          {departments.map((dept) => {
            const active = selectedDept === dept;
            return (
              <button
                key={dept}
                type="button"
                onClick={() => setSelectedDept(dept)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer ${
                  active
                    ? "bg-navy text-white shadow-xs"
                    : "bg-wash text-ink/75 hover:bg-line/40 hover:text-ink"
                }`}
              >
                {dept}
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
            placeholder="Search by name, role, department..."
            className="w-full rounded-full border border-line bg-white/90 py-1.5 pl-9 pr-3 text-xs text-ink placeholder:text-muted/70 focus:border-accent focus:outline-hidden focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Incharges Grid */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-line/80 bg-white/95 shadow-xs transition duration-300 hover:border-navy/40 hover:shadow-lg hover:-translate-y-0.5"
          >
            {/* Photo / Avatar Section */}
            <div className="relative aspect-square w-full overflow-hidden bg-[#faf8f0] border-b border-line/60">
              {item.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photoUrl}
                  alt={item.name}
                  className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-navy/10 text-navy font-bold text-2xl border border-navy/20">
                    {item.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="mt-3 text-xs text-muted font-medium">Head of Section</span>
                </div>
              )}

              {item.department ? (
                <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white">
                  {item.department}
                </span>
              ) : null}
            </div>

            {/* Details Section */}
            <div className="flex flex-1 flex-col p-5">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                  {item.role}
                </span>
                <h2 className="font-display text-xl font-medium text-ink group-hover:text-accent transition-colors">
                  {item.name}
                </h2>
              </div>

              {item.about ? (
                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-muted line-clamp-4">
                  {item.about}
                </p>
              ) : null}

              {item.email ? (
                <div className="mt-auto pt-4 border-t border-line/60">
                  <a
                    href={`mailto:${item.email}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-accent transition-colors"
                  >
                    <Mail size={13} className="shrink-0" />
                    <span className="truncate">{item.email}</span>
                  </a>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-line bg-wash/30 p-12 text-center text-muted">
          <UserCheck className="mx-auto h-8 w-8 text-muted/50 mb-2" />
          <p className="text-sm font-medium">No school incharges found matching your criteria.</p>
        </div>
      ) : null}
    </div>
  );
}
