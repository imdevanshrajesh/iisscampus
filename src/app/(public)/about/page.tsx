import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { getPublicSocial } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "About",
  description: "What the campus archive is for at IISS x Student Council Boys.",
  alternates: { canonical: "/about" },
};

const kinds = [
  "Cultural gatherings and celebrations",
  "Sports and house activities",
  "Academic exhibitions and competitions",
  "Technology and student-led projects",
  "Sustainability work",
  "The boys' student council, year by year",
];

export default async function AboutPage() {
  const social = await getPublicSocial();
  return (
    <div className="mx-auto max-w-[90rem] px-5 py-10 md:px-8 md:py-16">
      <div className="council-hero grid gap-12 md:grid-cols-[1fr_20rem] md:gap-20">
        <div>
          <p className="kicker text-accent">About</p>
          <h1 className="font-display mt-4 max-w-[12ch] text-[clamp(3.2rem,7vw,6.5rem)] leading-[0.86] text-ink">
            A record of <span className="italic">school life.</span>
          </h1>
          <div className="mt-10 max-w-xl space-y-5 text-lg leading-8 text-ink/85">
            <p>
              IISS x Student Council Boys keeps activities, the boys&apos; student council, and achievements in one
              place.
            </p>
            <p className="text-base leading-7 text-muted">
              It is an independent record and not the official school website.
            </p>
          </div>

          <a
            href={siteConfig.officialSchoolUrl}
            target="_blank"
            rel="noreferrer"
            className="group mt-8 inline-flex items-center gap-2.5 rounded-full border border-line bg-background/60 py-1.5 pr-3.5 pl-1.5 text-xs text-ink transition-colors duration-300 hover:border-accent/50"
          >
            <Image src="/brand/iiss-mark.webp" alt="" width={28} height={28} className="h-7 w-7 rounded-full bg-white object-contain p-0.5" />
            <span>
              Official school website <span className="text-muted">· iiss.ae</span>
            </span>
            <ArrowUpRight
              aria-hidden="true"
              size={14}
              className="text-accent transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        </div>

        <aside className="md:pt-24">
          <p className="kicker text-muted">What is documented</p>
          <ol className="mt-4 border-t border-ink">
            {kinds.map((kind, index) => (
              <li key={kind} className="flex items-baseline gap-4 border-b border-line py-3.5 text-sm text-ink">
                <span className="font-display text-xs italic text-accent">{String(index + 1).padStart(2, "0")}</span>
                {kind}
              </li>
            ))}
          </ol>

          <p className="kicker mt-10 text-muted">Contact</p>
          <p className="mt-3 text-sm leading-6 text-muted">
            {siteConfig.contactUrl ? (
              <a href={siteConfig.contactUrl} className="text-link text-ink">
                Send feedback
              </a>
            ) : (
              "A contact link has not been configured."
            )}
            {" · "}
            <a href={social.instagramUrl} className="text-link text-ink" rel="noopener noreferrer">
              Instagram
            </a>
            {" · "}
            <a href={social.scixcomInstagramUrl} className="text-link text-ink" rel="noopener noreferrer">
              SciXcom
            </a>
          </p>
        </aside>
      </div>
    </div>
  );
}
