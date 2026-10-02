import { isSupabaseConfigured } from "@/lib/config";
import { createPublicClient } from "@/lib/supabase/public";

let mode: "file" | "supabase" | null = null;

export async function contentMode() {
  if (mode) return mode;
  if (!isSupabaseConfigured()) {
    mode = "file";
    return mode;
  }

  const supabase = createPublicClient();
  if (!supabase) {
    mode = "file";
    return mode;
  }

  try {
    const probe = await supabase.from("campus_events").select("id").limit(1);
    mode = probe.error || !probe.data?.length ? "file" : "supabase";
  } catch {
    mode = "file";
  }
  return mode;
}

export function preferFileContent() {
  mode = "file";
}
