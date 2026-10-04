import Image from "next/image";
import Link from "next/link";

export function Wordmark({ href = "/", tone = "ink" }: { href?: string; tone?: "ink" | "paper" }) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 ${tone === "paper" ? "text-white" : "text-ink"}`}>
      <Image
        src="/brand/iiss-mark.webp"
        alt=""
        width={36}
        height={36}
        className="h-9 w-9 rounded-md"
        priority
      />
      <span className="text-lg font-semibold tracking-tight">Campus</span>
    </Link>
  );
}
