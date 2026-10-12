import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { contactMailto, siteConfig } from "@/lib/config";
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
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/60">
              A running record of campus events, the boys&apos; student council, and published achievements. Not the
              official school website.
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
                  <Link href={link.href} className="text-link text-white/85">
                    {link.label}
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
                  href={siteConfig.officialSchoolUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2 text-white/85"
                >
                  <Image src="/brand/iiss-mark.webp" alt="" width={20} height={20} className="h-5 w-5 rounded-full bg-white p-px" />
                  <span className="text-link">iiss.ae</span>
                  <ArrowUpRight aria-hidden="true" size={13} className="text-gold" />
                </a>
              </li>
              <li>
                <a
                  href={social.instagramUrl}
                  className="text-link text-white/85"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={social.scixcomInstagramUrl}
                  className="text-link text-white/85"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  SciXcom
                </a>
              </li>
              {contactHref ? (
                <li>
                  <a
                    href={contactHref}
                    className="text-link text-white/85"
                    {...(contactHref.startsWith("mailto:")
                      ? {}
                      : { rel: "noopener noreferrer", target: "_blank" })}
                  >
                    Contact
                  </a>
                </li>
              ) : null}
              <li>
                <Link href="/privacy" className="text-link text-white/85">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/45 md:flex-row">
          <p>© {new Date().getFullYear()} IISS Archives</p>
        </div>
      </div>
    </footer>
  );
}
