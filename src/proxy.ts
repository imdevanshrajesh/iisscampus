import type { NextRequest } from "next/server";
import { refreshStaffSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return refreshStaffSession(request);
}

export const config = {
  matcher: ["/manage/:path*"],
};
