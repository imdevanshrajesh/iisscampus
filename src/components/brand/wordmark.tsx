import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config";

export function Wordmark({ href = "/", tone = "ink" }: { href?: string; tone?: "ink" | "paper" }) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 ${tone === "paper" ? "text-white" : "text-ink"}`}>
      <Image
        src="/brand/student-council.png"
        alt=""
        width={36}
        height={36}
        unoptimized
        className={`h-9 w-9 rounded-md object-cover ring-1 ${tone === "paper" ? "ring-white/30" : "ring-ink/10"}`}
        priority
      />
      <span className="text-sm font-semibold leading-tight tracking-tight sm:text-base">{siteConfig.name}</span>
    </Link>
  );
}
