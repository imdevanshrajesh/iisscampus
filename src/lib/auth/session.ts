import { createStaffClient } from "@/lib/supabase/server";
import type { Actor } from "@/lib/auth/permissions";
import type { CampusRole } from "@/lib/types";

function isRole(value: unknown): value is CampusRole {
  return value === "editor" || value === "administrator";
}

export type CampusSession =
  | { status: "anonymous" }
  | { status: "no_role"; userId: string }
  | { status: "error"; message: string }
  | { status: "ok"; actor: NonNullable<Actor> };

function isMissingAuthSession(error: { name?: string; message?: string; code?: string } | null | undefined) {
  if (!error) return false;
  if (error.name === "AuthSessionMissingError") return true;
  const message = (error.message ?? "").toLowerCase();
  return message.includes("auth session missing") || (message.includes("session") && message.includes("missing"));
}

function isExpiredRefreshToken(error: { message?: string; code?: string } | null | undefined) {
  if (!error) return false;
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();
  return code === "refresh_token_not_found" || message.includes("refresh token");
}

function authFailureMessage(error: { message?: string; code?: string } | null | undefined) {
  if (isExpiredRefreshToken(error) || isMissingAuthSession(error)) {
    return "Your session expired. Sign in again at /manage/login.";
  }
  return "Sign in is required.";
}

export async function getCampusSession(): Promise<CampusSession> {
  try {
    const supabase = await createStaffClient();
    if (!supabase) return { status: "anonymous" };

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      if (isMissingAuthSession(error)) {
        return { status: "anonymous" };
      }
      if (isExpiredRefreshToken(error)) {
        try {
          await supabase.auth.signOut();
        } catch {
          // Best-effort cookie clear.
        }
        return { status: "error", message: authFailureMessage(error) };
      }
      if (error) {
        console.error(error);
      }
      return { status: "anonymous" };
    }

    const roleResult = await supabase
      .from("campus_staff")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (roleResult.error) {
      console.error(roleResult.error);
      const code = roleResult.error.code ?? "";
      const message = (roleResult.error.message ?? "").toLowerCase();
      if (code === "42501" || message.includes("permission denied")) {
        return {
          status: "error",
          message:
            "Campus staff privileges are missing. Run supabase/GRANTS_CAMPUS.sql in the Supabase SQL editor, then sign in again.",
        };
      }
      return {
        status: "error",
        message: "Campus access could not be verified. Sign in again, or confirm this account has a campus role.",
      };
    }

    if (!isRole(roleResult.data?.role)) {
      return { status: "no_role", userId: data.user.id };
    }

    return { status: "ok", actor: { userId: data.user.id, role: roleResult.data.role } };
  } catch (error) {
    if (isMissingAuthSession(error as { name?: string; message?: string })) {
      return { status: "anonymous" };
    }
    console.error(error);
    return { status: "anonymous" };
  }
}

export async function getCampusActor(): Promise<Actor> {
  const session = await getCampusSession();
  return session.status === "ok" ? session.actor : null;
}

export function sessionActionError(session: CampusSession) {
  if (session.status === "ok") return null;
  if (session.status === "no_role") {
    return "This account is signed in but has no campus role. An administrator must grant access first.";
  }
  if (session.status === "error") return session.message;
  return "Sign in is required.";
}
