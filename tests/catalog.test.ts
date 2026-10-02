import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterPublishedEvents, selectPublicAchievements, selectPublicEvents } from "../src/lib/data/catalog.ts";
import { seedAchievements, seedCategories, seedEvents } from "../src/lib/data/seed.ts";
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
});
