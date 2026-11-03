"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function PublicMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const council = pathname === "/council" || pathname.startsWith("/council/");
  const isHouses =
    pathname === "/school/houses" ||
    pathname.startsWith("/school/houses") ||
    pathname === "/houses" ||
    pathname.startsWith("/houses") ||
    pathname === "/school/house" ||
    pathname === "/house";

  return (
    <main
      id="content"
      className={cn(
        "flex-1 pb-24 pt-[4.5rem] md:pb-0 transition-colors duration-300",
        council && "council-shell",
        isHouses && "pt-0 pb-0 md:pb-0 bg-transparent",
      )}
    >
      {children}
    </main>
  );
}
