import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPTY_ACADEMIC_TERM,
  cleanTermLabel,
  cleanTermStartDate,
  compareCouncilYears,
  filterAchievementsForTerm,
  filterAnnouncementsForTerm,
  filterEventsForTerm,
  filterSocialPostsForTerm,
  hasActiveTerm,
  matchesAcademicTerm,
  partitionCouncilYears,
  suggestNextTermLabel,
} from "../src/lib/terms.ts";
import type {
  Achievement,
  Announcement,
  CampusEvent,
  CouncilYear,
  SocialPost,
} from "../src/lib/types.ts";

function makeEvent(partial: Partial<CampusEvent>): CampusEvent {
  return {
    id: partial.id ?? "evt-1",
    slug: partial.slug ?? "sample-event",
    title: partial.title ?? "Sample Event",
    shortDescription: "Sample description",
    fullDescription: "Full sample event description text.",
    purpose: null,
    activities: null,
    listing: "event",
    categoryId: "cat-1",
    hostName: null,
    coverUrl: null,
    coverAlt: "Sample Event",
    locationName: null,
    locationMapUrl: null,
    eventDate: null,
    endDate: null,
    startTime: null,
    endTime: null,
    gradeFrom: null,
    gradeTo: null,
    feeAed: null,
    capacity: null,
    packingList: null,
    featured: false,
    registrationEnabled: false,
    registrationProvider: "arigo",
    registrationUrl: null,
    registrationDeadline: null,
    registrationLimit: null,
    registrationCount: 0,
    pushToArigo: false,
    publicationStatus: "published",
    eventStatus: "upcoming",
    academicYear: null,
    images: [],
    schedule: [],
    groups: [],
    resources: [],
    ...partial,
  };
}

function makeCouncilYear(partial: Partial<CouncilYear>): CouncilYear {
  return {
    id: partial.id ?? "cy-1",
    label: partial.label ?? "2026-2027",
    slug: partial.slug ?? "2026-2027",
    kind: partial.kind ?? "past",
    summary: "",
    juniorHeading: "Junior Student Council",
    sortOrder: partial.sortOrder ?? 0,
    publicationStatus: "published",
    members: [],
    photos: [],
    posts: [],
    ...partial,
  };
}

describe("academic term helpers", () => {
  it("normalizes term labels and validates start dates", () => {
    assert.equal(cleanTermLabel(" 2026\u20132027 "), "2026-2027");
    assert.equal(cleanTermLabel("   "), null);
    assert.equal(cleanTermStartDate("2027-04-01"), "2027-04-01");
    assert.equal(cleanTermStartDate("not-a-date"), null);
    assert.equal(hasActiveTerm(EMPTY_ACADEMIC_TERM), false);
    assert.equal(hasActiveTerm({ label: "2027-2028", startDate: null }), true);
  });

  it("keeps all records visible when no active term filter is configured", () => {
    const events = [
      makeEvent({ id: "old", academicYear: "2025-2026", eventDate: "2025-11-10" }),
      makeEvent({ id: "new", academicYear: "2026-2027", eventDate: "2026-10-05" }),
    ];
    assert.deepEqual(
      filterEventsForTerm(events, EMPTY_ACADEMIC_TERM).map((e) => e.id),
      ["old", "new"],
    );
  });

  it("matches explicit labels first and falls back to cutoff dates when untagged", () => {
    const term = { label: "2027-2028", startDate: "2027-04-01" };

    // Matching label (even with unicode dash) wins
    assert.equal(
      matchesAcademicTerm({ academicYear: "2027\u20132028", eventDate: "2027-03-20" }, term),
      true,
    );
    // Old label stays archived
    assert.equal(
      matchesAcademicTerm({ academicYear: "2026-2027", eventDate: "2027-05-01" }, term),
      false,
    );
    // Untagged item dated on/after start date belongs to active term
    assert.equal(matchesAcademicTerm({ eventDate: "2027-04-01" }, term), true);
    // Untagged item dated before start date stays archived
    assert.equal(matchesAcademicTerm({ eventDate: "2026-12-15" }, term), false);
    // Multi-day event spanning into new term uses endDate if later
    assert.equal(
      matchesAcademicTerm({ eventDate: "2027-03-30", endDate: "2027-04-02" }, term),
      true,
    );
    // Date-only cutoff also filters earlier year-labeled records cleanly
    assert.equal(
      matchesAcademicTerm({ academicYear: "2026-2027" }, { label: null, startDate: "2027-04-01" }),
      false,
    );
    assert.equal(
      matchesAcademicTerm({ academicYear: "2027-2028" }, { label: null, startDate: "2027-04-01" }),
      true,
    );
  });

  it("filters events, achievements, announcements, and social posts consistently by active term", () => {
    const term = { label: "2027-2028", startDate: "2027-04-01" };

    const achievements: Achievement[] = [
      {
        id: "ach-old",
        title: "2026 Robotics Winner",
        competitionName: "UAE STEM",
        winnerName: null,
        award: "1st Place",
        eventDate: "2026-11-12",
        academicYear: "2026-2027",
        categoryId: null,
        eventId: null,
        imageUrl: null,
        imageAlt: "",
        story: "",
        resources: [],
        publicationStatus: "published",
      },
      {
        id: "ach-new",
        title: "2027 Debate Trophy",
        competitionName: "National Debate",
        winnerName: null,
        award: "Champion",
        eventDate: "2027-05-18",
        academicYear: "2027-2028",
        categoryId: null,
        eventId: null,
        imageUrl: null,
        imageAlt: "",
        story: "",
        resources: [],
        publicationStatus: "published",
      },
    ];
    assert.deepEqual(
      filterAchievementsForTerm(achievements, term).map((a) => a.id),
      ["ach-new"],
    );

    const announcements: Announcement[] = [
      {
        id: "ann-old",
        title: "Old Term Notice",
        body: "Old body",
        resources: [],
        eventId: null,
        category: "General",
        academicYear: "2026-2027",
        enabled: true,
        createdAt: "2026-09-01T08:00:00Z",
      },
      {
        id: "ann-new",
        title: "Welcome 2027-2028",
        body: "New body",
        resources: [],
        eventId: null,
        category: "General",
        academicYear: null,
        enabled: true,
        createdAt: "2027-04-03T08:00:00Z",
      },
    ];
    assert.deepEqual(
      filterAnnouncementsForTerm(announcements, term).map((a) => a.id),
      ["ann-new"],
    );

    const posts: SocialPost[] = [
      {
        id: "post-old",
        instagramUrl: "https://www.instagram.com/p/OLD/",
        caption: "2026 Fest",
        imageUrl: null,
        pinned: true,
        sortOrder: 1,
        councilTag: "11th",
        academicYear: "2026-2027",
        createdAt: "2026-10-10T10:00:00Z",
      },
      {
        id: "post-new",
        instagramUrl: "https://www.instagram.com/p/NEW/",
        caption: "2027 Investiture",
        imageUrl: null,
        pinned: true,
        sortOrder: 0,
        councilTag: "12th",
        academicYear: "2027-2028",
        createdAt: "2027-04-20T10:00:00Z",
      },
    ];
    assert.deepEqual(
      filterSocialPostsForTerm(posts, term).map((p) => p.id),
      ["post-new"],
    );
  });

  it("suggests sequential next term labels", () => {
    assert.equal(suggestNextTermLabel("2026-2027"), "2027-2028");
    assert.equal(suggestNextTermLabel("2026-27"), "2027-28");
    assert.equal(suggestNextTermLabel("2026"), "2027");
    assert.equal(suggestNextTermLabel(null, new Date("2027-01-15T00:00:00Z")), "2027-2028");
  });
});

describe("student council year partitioning", () => {
  it("handles empty and single-year councils with nothing collapsed", () => {
    assert.deepEqual(partitionCouncilYears([]), {
      primary: null,
      collapsed: [],
      ordered: [],
    });

    const single = makeCouncilYear({ id: "y-1", label: "2026-2027", kind: "current" });
    const partitioned = partitionCouncilYears([single]);
    assert.equal(partitioned.primary?.id, "y-1");
    assert.deepEqual(partitioned.collapsed, []);
  });

  it("keeps the sitting current year uncollapsed at the top and collapses all older/other years at the bottom", () => {
    const pastOlder = makeCouncilYear({ id: "y-2024", label: "2024-2025", kind: "past", sortOrder: 2 });
    const pastRecent = makeCouncilYear({ id: "y-2025", label: "2025-2026", kind: "past", sortOrder: 1 });
    const sitting = makeCouncilYear({ id: "y-2026", label: "2026-2027", kind: "current", sortOrder: 0 });
    const upcoming = makeCouncilYear({ id: "y-2027", label: "2027-2028", kind: "upcoming", sortOrder: 3 });

    const ordered = [pastOlder, upcoming, pastRecent, sitting].slice().sort(compareCouncilYears);
    assert.deepEqual(
      ordered.map((y) => y.id),
      ["y-2026", "y-2027", "y-2025", "y-2024"],
    );

    const { primary, collapsed } = partitionCouncilYears([pastOlder, pastRecent, sitting, upcoming]);
    assert.equal(primary?.id, "y-2026");
    assert.deepEqual(
      collapsed.map((y) => y.id),
      ["y-2027", "y-2025", "y-2024"],
    );
  });

  it("falls back gracefully when no council year is tagged current", () => {
    const newer = makeCouncilYear({ id: "y-2", label: "2026-2027", kind: "past", sortOrder: 1 });
    const older = makeCouncilYear({ id: "y-1", label: "2025-2026", kind: "past", sortOrder: 2 });
    const { primary, collapsed } = partitionCouncilYears([older, newer]);
    assert.equal(primary?.id, "y-2");
    assert.deepEqual(
      collapsed.map((y) => y.id),
      ["y-1"],
    );
  });
});
