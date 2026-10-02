import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { can, canTransition } from "../src/lib/auth/permissions.ts";

const editor = { userId: "editor", role: "editor" as const };
const administrator = { userId: "admin", role: "administrator" as const };

describe("permissions", () => {
  it("lets visitors read nothing private and change nothing", () => {
    assert.equal(can(null, "read_unpublished"), false);
    assert.equal(can(null, "create_draft"), false);
    assert.equal(can(null, "publish"), false);
    assert.equal(can(null, "manage_roles"), false);
  });

  it("lets editors draft content without publishing or changing roles", () => {
    assert.equal(can(editor, "create_draft"), true);
    assert.equal(can(editor, "manage_images"), true);
    assert.equal(can(editor, "publish"), false);
    assert.equal(can(editor, "unpublish"), false);
    assert.equal(can(editor, "archive"), false);
    assert.equal(can(editor, "manage_roles"), false);
    assert.equal(can(editor, "manage_settings"), false);
    assert.equal(can(editor, "delete_draft"), true);
    assert.equal(can(editor, "delete_published"), false);
    assert.equal(canTransition(editor, "draft", "in_review"), true);
    assert.equal(canTransition(editor, "draft", "published"), false);
    assert.equal(canTransition(editor, "published", "draft"), false);
  });

  it("lets administrators publish and delete records", () => {
    assert.equal(can(administrator, "publish"), true);
    assert.equal(can(administrator, "manage_roles"), true);
    assert.equal(can(administrator, "delete_draft"), true);
    assert.equal(can(administrator, "delete_published"), true);
    assert.equal(canTransition(administrator, "in_review", "published"), true);
    assert.equal(canTransition(administrator, "published", "archived"), true);
    assert.equal(canTransition(administrator, "archived", "draft"), true);
  });
});
