import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/config";

export function createPublicClient() {
  const env = getSupabasePublicEnv();
  if (!env) return null;
  try {
    return createClient(env.url, env.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  } catch {
    return null;
  }
}
