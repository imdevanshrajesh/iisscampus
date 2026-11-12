import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FACULTY_TIER_META,
  groupFacultyByTier,
  mapFacultyMemberRow,
  normalizeFacultyTier,
} from "../src/lib/faculty.ts";

describe("faculty tiers and mapping", () => {
  it("preserves the hierarchy order from principal down to supervisors", () => {
    assert.deepEqual(
      FACULTY_TIER_META.map((item) => item.tier),
      ["principal", "vice_principal", "head", "supervisor"],
    );
  });

  it("normalizes known faculty tiers and defaults unknown values to supervisor", () => {
    assert.equal(normalizeFacultyTier("principal"), "principal");
    assert.equal(normalizeFacultyTier("VICE_PRINCIPAL"), "vice_principal");
    assert.equal(normalizeFacultyTier("head"), "head");
    assert.equal(normalizeFacultyTier("supervisor"), "supervisor");
    assert.equal(normalizeFacultyTier("other"), "supervisor");
  });

  it("maps database rows and trims optional empty fields to null", () => {
    const mapped = mapFacultyMemberRow({
      id: "fac-1",
      name: "Shifana Muiz",
      role: "Vice Principal",
      tier: "vice_principal",
      department: "   ",
      photo_url: " https://cdn.iissboys.com/faculty/shifana.jpg ",
      message: "Leading academic excellence.",
      email: "",
      sort_order: 2,
      published: true,
    });

    assert.equal(mapped.id, "fac-1");
    assert.equal(mapped.name, "Shifana Muiz");
    assert.equal(mapped.tier, "vice_principal");
    assert.equal(mapped.department, null);
    assert.equal(mapped.photoUrl, "https://cdn.iissboys.com/faculty/shifana.jpg");
    assert.equal(mapped.email, null);
    assert.equal(mapped.sortOrder, 2);
    assert.equal(mapped.published, true);
  });

  it("groups and sorts faculty members cleanly within each tier", () => {
    const grouped = groupFacultyByTier([
      mapFacultyMemberRow({ id: "4", name: "Abdul Haleem", role: "Supervisor", tier: "supervisor", sort_order: 1 }),
      mapFacultyMemberRow({ id: "3", name: "Mr. Sunaj Abdul Majeed", role: "Vice Principal", tier: "vice_principal", sort_order: 2 }),
      mapFacultyMemberRow({ id: "2", name: "Shifana Muiz", role: "Vice Principal", tier: "vice_principal", sort_order: 1 }),
      mapFacultyMemberRow({ id: "1", name: "Principal Name", role: "Principal", tier: "principal", sort_order: 0 }),
    ]);

    assert.equal(grouped.principal.length, 1);
    assert.deepEqual(
      grouped.vice_principal.map((item) => item.name),
      ["Shifana Muiz", "Mr. Sunaj Abdul Majeed"],
    );
    assert.equal(grouped.supervisor[0]?.name, "Abdul Haleem");
    assert.equal(grouped.head.length, 0);
  });
});
