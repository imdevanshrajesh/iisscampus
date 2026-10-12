import { ArrowUpRight, Link2 } from "lucide-react";
import { InstagramMark } from "@/components/brand/instagram-mark";
import type { Metadata } from "next";
import Image from "next/image";
import { contactMailto, siteConfig } from "@/lib/config";
import { paragraphs } from "@/lib/data/catalog";
import { getPublicFaqs, getPublicSocial, getSiteBrand } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "FAQ & About",
  description: "About the campus archive and common questions for IISS x Student Council Boys.",
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
  const [social, faqs, brand] = await Promise.all([getPublicSocial(), getPublicFaqs(), getSiteBrand()]);
  const contactHref = contactMailto(brand.contactEmail) ?? siteConfig.contactUrl;
  return (
    <div className="mx-auto max-w-[90rem] px-5 py-10 md:px-8 md:py-16">
      <div className="council-hero grid gap-12 md:grid-cols-[1fr_20rem] md:gap-20">
        <div>
          <p className="kicker text-accent">FAQ & About</p>
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
            href={social.schoolUrl}
            target="_blank"
            rel="noreferrer"
            className="group mt-8 inline-flex items-center gap-2.5 rounded-full border border-line bg-background/60 py-1.5 pr-3.5 pl-1.5 text-xs text-ink transition-colors duration-300 hover:border-accent/50"
          >
            <Image src="/brand/iiss-mark.webp" alt="" width={28} height={28} className="h-7 w-7 rounded-full bg-white object-contain p-0.5" />
            <span>
              Official school website <span className="text-muted">· {social.schoolLabel}</span>
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
            {contactHref ? (
              <a
                href={contactHref}
                className="text-link text-ink"
                {...(contactHref.startsWith("mailto:")
                  ? {}
                  : { rel: "noopener noreferrer", target: "_blank" })}
              >
                Send feedback
              </a>
            ) : (
              "A contact email has not been set yet. An administrator can add it in Settings."
            )}
            {" · "}
            <a
              href={social.instagramUrl}
              className="inline-flex items-center gap-1 text-link text-ink"
              rel="noopener noreferrer"
              target="_blank"
            >
              <InstagramMark size={13} />
              {social.instagramLabel}
            </a>
            {" · "}
            <a
              href={social.scixcomInstagramUrl}
              className="inline-flex items-center gap-1 text-link text-ink"
              rel="noopener noreferrer"
              target="_blank"
            >
              <InstagramMark size={13} />
              {social.scixcomLabel}
            </a>
            {social.extraLinks.map((link) => (
              <span key={link.id}>
                {" · "}
                <a href={link.url} className="inline-flex items-center gap-1 text-link text-ink" rel="noopener noreferrer" target="_blank">
                  <Link2 aria-hidden="true" size={13} />
                  {link.label}
                </a>
              </span>
            ))}
          </p>
        </aside>
      </div>

      {faqs.length ? (
        <section className="mt-16 border-t border-line pt-12 md:mt-20">
          <p className="kicker text-accent">FAQ</p>
          <h2 className="font-display mt-3 text-4xl text-ink md:text-5xl">Common questions</h2>
          <div className="mt-8 max-w-3xl divide-y divide-line border-t border-line">
            {faqs.map((item) => (
              <details key={item.id} className="group py-5">
                <summary className="cursor-pointer list-none text-lg font-medium text-ink marker:content-none">
                  <span className="flex items-start justify-between gap-4">
                    {item.question}
                    <span className="text-accent transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <div className="mt-3 space-y-3 text-base leading-7 text-muted">
                  {paragraphs(item.answer).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
