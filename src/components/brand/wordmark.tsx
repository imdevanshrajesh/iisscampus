import Link from "next/link";
import { CouncilLogo } from "@/components/brand/council-logo";
import { siteConfig } from "@/lib/config";

export function Wordmark({
  href = "/",
  tone = "ink",
  logoUrl,
}: {
  href?: string;
  tone?: "ink" | "paper";
  logoUrl?: string | null;
}) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 ${tone === "paper" ? "text-white" : "text-ink"}`}>
      <CouncilLogo
        url={logoUrl}
        width={36}
        height={36}
        className={`h-9 w-9 rounded-md object-cover ring-1 ${tone === "paper" ? "ring-white/30" : "ring-ink/10"}`}
        priority
      />
      <span className="text-sm font-semibold leading-tight tracking-tight sm:text-base">{siteConfig.name}</span>
    </Link>
  );
}
