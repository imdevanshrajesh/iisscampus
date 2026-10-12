import { ArrowUpRight, Link2, Mail, Shield } from "lucide-react";
import { InstagramMark } from "@/components/brand/instagram-mark";
import Image from "next/image";
import Link from "next/link";
import { contactMailto, siteConfig } from "@/lib/config";
import { NavMark } from "@/components/layout/nav-marks";
import { primaryNav } from "@/lib/nav";
import type { SocialLinks } from "@/lib/types";

export function SiteFooter({
  showSampleNote,
  social,
  contactEmail,
}: {
  showSampleNote: boolean;
  social: SocialLinks;
  contactEmail?: string | null;
}) {
  const contactHref = contactMailto(contactEmail) ?? siteConfig.contactUrl;
  return (
    <footer className="mt-auto bg-navy text-white">
      <div className="mx-auto max-w-[90rem] px-5 pt-16 pb-28 md:px-8 md:pt-20 md:pb-10">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="font-display max-w-[15ch] text-[clamp(2.4rem,4.5vw,4rem)] leading-[0.9]">
              IISS x Student Council <span className="italic text-gold">Boys.</span>
            </p>
            {showSampleNote ? (
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/45">
                Some records are demonstration content and are not verified historical accounts.
              </p>
            ) : null}
          </div>
          <nav className="md:col-span-3" aria-label="Footer">
            <p className="kicker text-white/45">Explore</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {primaryNav.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-flex items-center gap-2 text-white/85">
                    <NavMark href={link.href} size={15} />
                    <span className="text-link">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="md:col-span-3">
            <p className="kicker text-white/45">Elsewhere</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href={social.schoolUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2 text-white/85"
                >
                  <Image src="/brand/iiss-mark.webp" alt="" width={20} height={20} className="h-5 w-5 rounded-full bg-white p-px" />
                  <span className="text-link">{social.schoolLabel}</span>
                  <ArrowUpRight aria-hidden="true" size={13} className="text-gold" />
                </a>
              </li>
              <li>
                <a
                  href={social.instagramUrl}
                  className="inline-flex items-center gap-2 text-white/85"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <InstagramMark />
                  <span className="text-link">{social.instagramLabel}</span>
                </a>
              </li>
              <li>
                <a
                  href={social.scixcomInstagramUrl}
                  className="inline-flex items-center gap-2 text-white/85"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <InstagramMark />
                  <span className="text-link">{social.scixcomLabel}</span>
                </a>
              </li>
              {social.extraLinks.map((link) => (
                <li key={link.id}>
                  <a href={link.url} className="inline-flex items-center gap-2 text-white/85" rel="noopener noreferrer" target="_blank">
                    <Link2 aria-hidden="true" size={15} />
                    <span className="text-link">{link.label}</span>
                  </a>
                </li>
              ))}
              {contactHref ? (
                <li>
                  <a
                    href={contactHref}
                    className="inline-flex items-center gap-2 text-white/85"
                    {...(contactHref.startsWith("mailto:")
                      ? {}
                      : { rel: "noopener noreferrer", target: "_blank" })}
                  >
                    <Mail aria-hidden="true" size={15} />
                    <span className="text-link">Contact</span>
                  </a>
                </li>
              ) : null}
              <li>
                <Link href="/privacy" className="inline-flex items-center gap-2 text-white/85">
                  <Shield aria-hidden="true" size={15} />
                  <span className="text-link">Privacy</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} IISS x Student Council Boys</p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Powered by</span>
            <a
              href="https://arigo.buildkre.com"
              className="text-link text-white/85"
              rel="noopener noreferrer"
              target="_blank"
            >
              Arigo
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="https://buildkre.com"
              className="text-link text-white/85"
              rel="noopener noreferrer"
              target="_blank"
            >
              Buildkre
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
