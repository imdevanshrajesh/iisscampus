import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { campusPulse, filterPublishedEvents, pairCouncilMembers, selectPublicAchievements, selectPublicCouncil, selectPublicEvents } from "../src/lib/data/catalog.ts";
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
    const pairs = pairCouncilMembers(seedCouncilYears[0].members);
    const roles = pairs.map((pair) => pair.lead.role);
    const head = roles.indexOf("Head Boy");
    const secretary = roles.indexOf("Council Secretary");
    const activity = roles.indexOf("Activity Captain");
    assert.ok(head >= 0 && secretary === head + 1 && activity === secretary + 1);
    assert.equal(pairs[secretary]?.deputy?.role, "Council Secretary Vice Captain");
    assert.equal(pairs[head]?.deputy?.role, "Deputy Head Boy");
  });
});
