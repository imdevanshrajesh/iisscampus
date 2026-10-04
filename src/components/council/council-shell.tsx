"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function PublicMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const council = pathname === "/council" || pathname.startsWith("/council/");

  return (
    <main id="content" className={cn("flex-1 pb-24 pt-20 md:pb-0 md:pt-24", council && "council-shell")}>
      {children}
    </main>
  );
}
