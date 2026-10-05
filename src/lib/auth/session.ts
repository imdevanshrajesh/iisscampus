import { createStaffClient } from "@/lib/supabase/server";
import type { Actor } from "@/lib/auth/permissions";
import type { CampusRole } from "@/lib/types";

function isRole(value: unknown): value is CampusRole {
  return value === "editor" || value === "administrator";
}

export async function getCampusActor(): Promise<Actor> {
  try {
    const supabase = await createStaffClient();
    if (!supabase) return null;

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;

    const roleResult = await supabase
      .from("campus_staff")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (roleResult.error) {
      console.error(roleResult.error);
      return null;
    }
    if (!isRole(roleResult.data?.role)) return null;
    return { userId: data.user.id, role: roleResult.data.role };
  } catch (error) {
    console.error(error);
    return null;
  }
}
