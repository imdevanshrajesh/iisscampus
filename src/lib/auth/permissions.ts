import type { CampusRole, PublicationStatus } from "@/lib/types";

export type Actor = { userId: string; role: CampusRole } | null;

export type PrivilegedAction =
  | "read_unpublished"
  | "create_draft"
  | "edit_draft"
  | "submit_review"
  | "publish"
  | "unpublish"
  | "archive"
  | "restore"
  | "manage_images"
  | "manage_categories"
  | "manage_achievements"
  | "manage_roles"
  | "manage_settings"
  | "read_audit"
  | "delete_draft"
  | "delete_published";

const editorActions = new Set<PrivilegedAction>([
  "read_unpublished",
  "create_draft",
  "edit_draft",
  "submit_review",
  "manage_images",
  "manage_categories",
  "manage_achievements",
  "delete_draft",
]);

const administratorActions = new Set<PrivilegedAction>([
  ...editorActions,
  "publish",
  "unpublish",
  "archive",
  "restore",
  "manage_roles",
  "manage_settings",
  "read_audit",
  "delete_published",
]);

export function can(actor: Actor, action: PrivilegedAction) {
  if (!actor) return false;
  if (actor.role === "administrator") return administratorActions.has(action);
  if (actor.role === "editor") return editorActions.has(action);
  return false;
}

export function canEditPublication(actor: Actor, status: PublicationStatus) {
  if (!actor) return false;
  if (actor.role === "administrator") return true;
  return status === "draft" || status === "in_review";
}

export function canTransition(
  actor: Actor,
  from: PublicationStatus,
  to: PublicationStatus,
) {
  if (from === to) return canEditPublication(actor, from);
  if (!actor) return false;
  if (actor.role === "editor") {
    return from === "draft" && to === "in_review";
  }
  if (actor.role !== "administrator") return false;
  if (to === "published") return from === "draft" || from === "in_review";
  if (to === "draft") return from === "published" || from === "in_review" || from === "archived";
  if (to === "archived") return from === "published" || from === "draft" || from === "in_review";
  if (to === "in_review") return from === "draft";
  return false;
}

export function canDelete(actor: Actor, status: PublicationStatus) {
  if (!actor) return false;
  if (status === "draft") return can(actor, "delete_draft") || can(actor, "delete_published");
  return can(actor, "delete_published");
}
