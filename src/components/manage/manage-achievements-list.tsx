"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Plus, Search } from "lucide-react";
import { AchievementForm } from "@/components/manage/achievement-form";
import { DeleteRecord } from "@/components/manage/delete-record";
import { canDelete } from "@/lib/auth/permissions";
import { deleteAchievement } from "@/lib/manage/actions";
import type { Achievement, CampusEvent, CampusRole, Category } from "@/lib/types";

export function ManageAchievementsList({
  achievements,
  categories,
  events,
  role,
  mediaHosts,
  defaultAcademicYear = null,
}: {
  achievements: Achievement[];
  categories: Category[];
  events: CampusEvent[];
  role: CampusRole;
  mediaHosts: string[];
  defaultAcademicYear?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return achievements.filter((item) => {
      if (!q) return true;
      return `${item.title} ${item.competitionName} ${item.winnerName ?? ""}`.toLowerCase().includes(q);
    });
  }, [achievements, query]);

  return (
    <div className="space-y-6">
      {/* Search and Add Result header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search achievements..."
            aria-label="Search achievements"
            className="w-full rounded-lg border border-line bg-[#fbfaf4] pl-9 pr-3 py-2 text-sm outline-none transition focus:border-navy focus:bg-white"
          />
        </div>

        <button
          type="button"
          onClick={() => setNewOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-[#fbfaf4] px-3.5 py-2 text-xs font-semibold text-ink transition hover:border-navy hover:bg-white"
        >
          <Plus className="h-3.5 w-3.5 text-accent" />
          <span>{newOpen ? "Close Add Form" : "+ Add a Result"}</span>
          {newOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Add New Achievement Collapsible Form (Collapsed by default) */}
      {newOpen && (
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-line/60 pb-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-ink">Add a New Achievement / Result</h2>
              <p className="text-xs text-muted">Record competition awards, student commendations, or tournament trophies</p>
            </div>
            <button
              type="button"
              onClick={() => setNewOpen(false)}
              className="text-xs text-muted hover:text-ink"
            >
              Close
            </button>
          </div>
          <AchievementForm
            achievement={null}
            categories={categories}
            events={events}
            role={role}
            mediaHosts={mediaHosts}
            defaultAcademicYear={defaultAcademicYear}
          />
        </div>
      )}

      {/* Existing Achievements List */}
      <ul className="divide-y divide-line rounded-2xl border border-line bg-white shadow-xs overflow-hidden">
        {filtered.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-[#fbfaf4] transition">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/manage/achievements/${item.id}/edit`} className="font-semibold text-ink hover:text-accent transition">
                  {item.title}
                </Link>
                <span className="rounded-full bg-navy/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
                  {item.publicationStatus.replace("_", " ")}
                </span>
                {item.academicYear ? (
                  <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-[10px] font-medium text-muted">
                    {item.academicYear}
                  </span>
                ) : null}
                {item.award ? (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                    {item.award}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted">
                {[item.competitionName, item.winnerName, item.eventDate].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <Link
                href={`/manage/achievements/${item.id}/edit`}
                className="rounded-md border border-line bg-[#fbfaf4] px-2.5 py-1 font-medium text-ink transition hover:border-navy hover:bg-white"
              >
                Edit
              </Link>
              {canDelete({ userId: "staff", role }, item.publicationStatus) ? (
                <DeleteRecord action={deleteAchievement} id={item.id} label="Delete" />
              ) : null}
            </div>
          </li>
        ))}

        {filtered.length === 0 && (
          <li className="p-8 text-center text-xs text-muted">
            No achievements match your search.
          </li>
        )}
      </ul>
    </div>
  );
}
