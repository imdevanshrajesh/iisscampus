import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function RingLink({
  href,
  children,
  tone = "solid",
  className = "",
}: {
  href: string;
  children: ReactNode;
  tone?: "solid" | "quiet" | "night";
  className?: string;
}) {
  const toneClass = tone === "quiet" ? "ring-link--quiet" : tone === "night" ? "ring-link--night" : "";

  return (
    <Link href={href} className={`ring-link ${toneClass} ${className}`}>
      {children}
      <ArrowUpRight aria-hidden="true" size={16} className="ring-link__arrow" />
    </Link>
  );
}
