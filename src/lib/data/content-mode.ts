import { isSupabaseConfigured } from "@/lib/config";

let mode: "file" | "supabase" | null = null;

export async function contentMode() {
  if (mode) return mode;
  // When Supabase env is set, always use it. Falling back to the local JSON
  // file hides database errors and fails on hosts that cannot write the filesystem.
  mode = isSupabaseConfigured() ? "supabase" : "file";
  return mode;
}

export function resetContentModeForTests() {
  mode = null;
}
