import { forbidden, redirect } from "next/navigation";
import { getCampusActor } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/config";
import { getStaffWorkspace, type StaffWorkspace } from "@/lib/data/staff";
import type { CampusRole } from "@/lib/types";

export async function requireWorkspace(): Promise<
  | { ready: false }
  | { ready: true; role: CampusRole; workspace: StaffWorkspace }
> {
  if (!isSupabaseConfigured()) return { ready: false };
  const actor = await getCampusActor();
  if (!actor) redirect("/manage/login");
  const workspace = await getStaffWorkspace();
  if (!workspace) redirect("/manage/login");
  return { ready: true, role: actor.role, workspace };
}

export async function requireAdministrator() {
  const access = await requireWorkspace();
  if (!access.ready) return access;
  if (access.role !== "administrator") forbidden();
  return access;
}
