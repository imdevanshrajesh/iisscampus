import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  campusPulse,
  compareCampusEvents,
  councilMemberSlugs,
  councilMembersOnBoard,
  filterPublishedEvents,
  findPublicCouncilMember,
  getCampusTodayDate,
  getEffectiveEventStatus,
  isCouncilStaffRole,
  isPastEvent,
  isUpcomingEvent,
  pairCouncilMembers,
  selectPublicAchievements,
  selectPublicCouncil,
  selectPublicEvents,
} from "../src/lib/data/catalog.ts";
import type { CouncilYear } from "../src/lib/types.ts";
import { seedAchievements, seedCategories, seedCouncilYears, seedEvents } from "../src/lib/data/seed.ts";
import type { CampusEvent } from "../src/lib/types.ts";

describe("public catalog", () => {
  it("hides drafts and archived records", () => {
    const titles = selectPublicEvents(seedEvents).map((event) => event.title);
    assert.deepEqual(titles.sort(), ["FIFA Fever", "Mango Day", "Sustainability Exhibition"]);
    assert.deepEqual(
      selectPublicAchievements(seedAchievements).map((item) => item.title),
      ["Sample award"],
    );
  });

  it("filters published events by search, category, year, and status", () => {
    const dated: CampusEvent = {
      ...seedEvents[0],
      id: "20000000-0000-4000-8000-000000000099",
      slug: "dated-match",
      title: "Dated match",
      eventDate: "2025-03-01",
      eventStatus: "upcoming",
      isSample: false,
      publicationStatus: "published",
    };
    const events = [...seedEvents, dated];
    const byName = filterPublishedEvents(events, seedCategories, { query: "mango" });
    assert.equal(byName.length, 1);
    assert.equal(byName[0]?.slug, "mango-day");

    const byCategory = filterPublishedEvents(events, seedCategories, { category: "sports" });
    assert.ok(byCategory.every((event) => event.categoryId === seedCategories[1]?.id));

    const byYear = filterPublishedEvents(events, seedCategories, { year: "2025" });
    assert.deepEqual(byYear.map((event) => event.slug), ["dated-match"]);

    const byStatus = filterPublishedEvents(events, seedCategories, { status: "upcoming" });
    assert.deepEqual(byStatus.map((event) => event.slug), ["dated-match"]);

    const empty = filterPublishedEvents(events, seedCategories, { query: "not-a-real-event" });
    assert.equal(empty.length, 0);
  });

  it("shows a live pulse for ongoing events and hides unpublished council years", () => {
    const live = campusPulse([
      { ...seedEvents[0], isSample: false, eventStatus: "ongoing", title: "House match" },
    ]);
    assert.equal(live.tone, "live");
    assert.equal(live.label, "House match");

    const quiet = campusPulse(seedEvents);
    assert.equal(quiet.tone, "quiet");

    const year: CouncilYear = {
      id: "30000000-0000-4000-8000-000000000001",
      label: "2025–26",
      slug: "2025-26",
      kind: "current",
      summary: "",
      juniorHeading: "Junior Student Council",
      publicationStatus: "draft",
      sortOrder: 0,
      isSample: false,
      members: [],
      photos: [],
      posts: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      publishedAt: null,
    };
    assert.equal(selectPublicCouncil([year]).length, 0);
    assert.equal(selectPublicCouncil([{ ...year, publicationStatus: "published" }]).length, 1);
  });

  it("places the council secretary after head boy and before activity", () => {
    const pairs = pairCouncilMembers(councilMembersOnBoard(seedCouncilYears[0].members, "main"));
    const roles = pairs.map((pair) => pair.lead.role);
    const head = roles.indexOf("Head Boy");
    const secretary = roles.indexOf("Council Secretary");
    const activity = roles.indexOf("Activity Captain");
    assert.ok(head >= 0 && secretary === head + 1 && activity === secretary + 1);
    assert.equal(pairs[secretary]?.deputy?.role, "Council Secretary Vice Captain");
    assert.equal(pairs[head]?.deputy?.role, "Deputy Head Boy");
  });

  it("keeps the CCA coordinator out of the student roster pairs", () => {
    assert.equal(isCouncilStaffRole("CCA Coordinator"), true);
    assert.equal(isCouncilStaffRole("Teacher in charge"), true);
    assert.equal(isCouncilStaffRole("Head Boy"), false);
    const pairs = pairCouncilMembers(councilMembersOnBoard(seedCouncilYears[0].members, "main"));
    assert.equal(
      pairs.some((pair) => isCouncilStaffRole(pair.lead.role) || (pair.deputy && isCouncilStaffRole(pair.deputy.role))),
      false,
    );
    assert.equal(seedCouncilYears[0].members[0]?.role, "CCA Coordinator");
    assert.equal(seedCouncilYears[0].members[0]?.name, "JANATHUL FIRTHOSE");
  });

  it("opens a page for a student and for the CCA coordinator, and keeps junior posts off profile routes", () => {
    const year = seedCouncilYears[0];
    const head = year.members.find((member) => member.role === "Head Boy");
    assert.equal(head?.slug, "mohammed-rehaan");
    assert.equal(findPublicCouncilMember(seedCouncilYears, year.slug, "mohammed-rehaan")?.member.name, "MOHAMMED REHAAN");
    assert.equal(findPublicCouncilMember(seedCouncilYears, year.slug, "janathul-firthose")?.member.role, "CCA Coordinator");
    const junior = year.members.find((member) => member.board === "junior");
    assert.ok(junior?.slug);
    assert.equal(findPublicCouncilMember(seedCouncilYears, year.slug, junior!.slug), null);
    assert.equal(councilMembersOnBoard(year.members, "junior").length, 28);
    const [first, second] = councilMemberSlugs([
      { name: "MOHAMMED ALI", role: "Ethos Captain" },
      { name: "Mohammed Ali", role: "Sports Captain" },
    ]);
    assert.equal(first, "mohammed-ali");
    assert.equal(second, "mohammed-ali-sports-captain");
  });

  it("lists finished events with the latest ending first", () => {
    const older: CampusEvent = {
      ...seedEvents[0],
      id: "20000000-0000-4000-8000-000000000091",
      slug: "older-finish",
      title: "Older finish",
      eventDate: "2026-01-02",
      endDate: "2026-01-04",
      eventStatus: "completed",
      isSample: false,
    };
    const newer: CampusEvent = {
      ...seedEvents[0],
      id: "20000000-0000-4000-8000-000000000092",
      slug: "newer-finish",
      title: "Newer finish",
      eventDate: "2026-03-01",
      endDate: "2026-03-02",
      eventStatus: "completed",
      isSample: false,
    };
    const upcoming: CampusEvent = {
      ...seedEvents[0],
      id: "20000000-0000-4000-8000-000000000093",
      slug: "still-ahead",
      title: "Still ahead",
      eventDate: "2026-09-01",
      eventStatus: "upcoming",
      isSample: false,
    };
    const ordered = [older, upcoming, newer].sort(compareCampusEvents);
    assert.deepEqual(
      ordered.map((event) => event.slug),
      ["still-ahead", "newer-finish", "older-finish"],
    );
  });

  it("identifies past events and excludes them from upcoming events", () => {
    const referenceToday = "2026-11-03";
    const pastSeptEvent: CampusEvent = {
      ...seedEvents[0],
      id: "20000000-0000-4000-8000-000000000094",
      slug: "faculty-fiesta",
      title: "Faculty Fiesta",
      eventDate: "2026-09-03",
      endDate: "2026-09-03",
      eventStatus: "completed",
      isSample: false,
    };

    const staleUpcomingSeptEvent: CampusEvent = {
      ...seedEvents[0],
      id: "20000000-0000-4000-8000-000000000095",
      slug: "old-fixture",
      title: "Old Fixture",
      eventDate: "2026-09-03",
      endDate: null,
      eventStatus: "upcoming",
      isSample: false,
    };

    const futureNovEvent: CampusEvent = {
      ...seedEvents[0],
      id: "20000000-0000-4000-8000-000000000096",
      slug: "future-tournament",
      title: "Future Tournament",
      eventDate: "2026-11-14",
      endDate: null,
      eventStatus: "upcoming",
      isSample: false,
    };

    const todayEvent: CampusEvent = {
      ...seedEvents[0],
      id: "20000000-0000-4000-8000-000000000097",
      slug: "today-match",
      title: "Today Match",
      eventDate: "2026-11-03",
      endDate: null,
      eventStatus: "upcoming",
      isSample: false,
    };

    // Past events must be detected as past
    assert.equal(isPastEvent(pastSeptEvent, referenceToday), true);
    assert.equal(isPastEvent(staleUpcomingSeptEvent, referenceToday), true);
    assert.equal(isPastEvent(futureNovEvent, referenceToday), false);
    assert.equal(isPastEvent(todayEvent, referenceToday), false);

    // Upcoming checks must reject past events (even if their DB status was "upcoming")
    assert.equal(isUpcomingEvent(pastSeptEvent, referenceToday), false);
    assert.equal(isUpcomingEvent(staleUpcomingSeptEvent, referenceToday), false);
    assert.equal(isUpcomingEvent(futureNovEvent, referenceToday), true);
    assert.equal(isUpcomingEvent(todayEvent, referenceToday), true);

    // Effective status must reflect completed for past events
    assert.equal(getEffectiveEventStatus(pastSeptEvent, referenceToday), "completed");
    assert.equal(getEffectiveEventStatus(staleUpcomingSeptEvent, referenceToday), "completed");
    assert.equal(getEffectiveEventStatus(futureNovEvent, referenceToday), "upcoming");
  });
});
