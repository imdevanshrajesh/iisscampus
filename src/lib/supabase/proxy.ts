import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { campusAuthCookie, getSupabasePublicEnv } from "@/lib/config";

export async function refreshStaffSession(request: NextRequest) {
  const passThrough = NextResponse.next({ request });
  const env = getSupabasePublicEnv();
  if (!env) return passThrough;

  try {
    let response = passThrough;
    const supabase = createServerClient(env.url, env.anonKey, {
      cookieOptions: campusAuthCookie,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    });
    const { error } = await supabase.auth.getUser();
    if (
      error &&
      (error.code === "refresh_token_not_found" ||
        error.message.toLowerCase().includes("refresh token"))
    ) {
      await supabase.auth.signOut();
    }
    return response;
  } catch {
    return passThrough;
  }
}
