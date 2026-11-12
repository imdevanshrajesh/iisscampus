import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { campusAuthCookie } from "@/lib/config";
import { refreshStaffSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/school/faculty") {
    const hasStaffSession = request.cookies
      .getAll()
      .some((cookie) => cookie.name.startsWith(campusAuthCookie.name));
    if (!hasStaffSession) {
      return NextResponse.next();
    }
  }
  return refreshStaffSession(request);
}

export const config = {
  matcher: ["/manage/:path*", "/school/faculty"],
};
