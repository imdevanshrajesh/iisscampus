import { cache } from "react";
import { forbidden, redirect, unstable_rethrow } from "next/navigation";
import { getCampusSession } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/config";
import { getStaffWorkspace, type StaffWorkspace } from "@/lib/data/staff";
import type { CampusRole } from "@/lib/types";

export const requireWorkspace = cache(async function requireWorkspace(): Promise<
  | { ready: false }
  | { ready: true; role: CampusRole; workspace: StaffWorkspace }
> {
  try {
    if (!isSupabaseConfigured()) return { ready: false };
    const [session, workspace] = await Promise.all([
      getCampusSession(),
      getStaffWorkspace(),
    ]);
    if (session.status !== "ok") redirect("/manage/login");
    if (!workspace) redirect("/manage/login");
    return { ready: true, role: session.actor.role, workspace };
  } catch (error) {
    unstable_rethrow(error);
    console.error(error);
    return { ready: false };
  }
});

export const requireAdministrator = cache(async function requireAdministrator() {
  const access = await requireWorkspace();
  if (!access.ready) return access;
  if (access.role !== "administrator") forbidden();
  return access;
});
