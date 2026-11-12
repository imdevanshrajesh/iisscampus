"use client";

import { useMemo, useState } from "react";
import { EventCard } from "@/components/events/event-card";
import { eventCategoryIds } from "@/lib/data/catalog";
import { filterEventsForTerm, hasActiveTerm, normalizeTermText } from "@/lib/terms";
import type { AcademicTermConfig, CampusEvent, Category } from "@/lib/types";

export function ExternalCompetitions({
  events,
  categories,
  hosts,
  activeTerm,
  yearFilter,
}: {
  events: CampusEvent[];
  categories: Category[];
  hosts: readonly string[];
  activeTerm?: AcademicTermConfig;
  yearFilter?: string;
}) {
  const [grade, setGrade] = useState("");
  const [topic, setTopic] = useState("");
  const outside = useMemo(() => {
    const publishedExternal = events.filter(
      (event) => event.listing === "external" && event.publicationStatus === "published",
    );
    const termConfigured = hasActiveTerm(activeTerm);
    if (termConfigured && (!yearFilter || yearFilter === "current")) {
      return filterEventsForTerm(publishedExternal, activeTerm);
    }
    if (yearFilter && yearFilter !== "all" && yearFilter !== "current") {
      const normalized = normalizeTermText(yearFilter);
      return publishedExternal.filter(
        (event) =>
          normalizeTermText(event.academicYear) === normalized ||
          Boolean(event.eventDate?.startsWith(`${yearFilter}-`)),
      );
    }
    return publishedExternal;
  }, [events, activeTerm, yearFilter]);
  const topicMatch = categories.find((category) => category.slug === topic);
  const gradeNumber = Number(grade);
  const visible = outside.filter((event) => {
    if (topicMatch && !eventCategoryIds(event).includes(topicMatch.id)) return false;
    if (Number.isFinite(gradeNumber) && gradeNumber > 0) {
      if (event.gradeFrom == null || event.gradeTo == null) return false;
      if (gradeNumber < event.gradeFrom || gradeNumber > event.gradeTo) return false;
    }
    return true;
  });

  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <p className="text-sm text-accent">Elsewhere</p>
        <h2 className="font-display mt-3 text-4xl text-ink md:text-5xl">Competitions at other schools</h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted">
          Contests our students can join that another school is hosting. Filter by grade and by the same topics used
          for campus events.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <label className="grid gap-1.5 text-sm">
            Topic
            <select
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="rounded-md border border-line bg-white px-3 py-2"
            >
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            Grade
            <select
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
              className="rounded-md border border-line bg-white px-3 py-2"
            >
              <option value="">All</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={String(value)}>
                  Grade {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        {visible.length ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((event) => (
              <EventCard key={event.id} event={event} categories={categories} hosts={hosts} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-line px-6 py-12">
            <p className="text-lg font-medium">
              {outside.length ? "Nothing matches that grade or topic." : "No outside competitions published yet."}
            </p>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
              Add one from the content desk and choose Competition at another school.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
