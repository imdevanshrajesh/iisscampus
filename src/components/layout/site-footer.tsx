import { ArrowUpRight, Heart, Link2, Mail, Shield, Sparkles } from "lucide-react";
import { InstagramMark } from "@/components/brand/instagram-mark";
import Image from "next/image";
import Link from "next/link";
import { contactMailto, siteConfig } from "@/lib/config";
import { NavMark } from "@/components/layout/nav-marks";
import { primaryNav, type NavLink } from "@/lib/nav";
import type { SocialLinks } from "@/lib/types";

export function SiteFooter({
  showSampleNote,
  social,
  contactEmail,
  nav = primaryNav,
}: {
  showSampleNote: boolean;
  social: SocialLinks;
  contactEmail?: string | null;
  nav?: NavLink[];
}) {
  const contactHref = contactMailto(contactEmail) ?? siteConfig.contactUrl;

  return (
    <footer className="mt-auto relative overflow-hidden bg-[#101626] text-white border-t border-white/10">
      {/* Decorative ambient gradient */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[50rem] rounded-full bg-accent/10 blur-[100px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[90rem] px-5 pt-16 pb-12 md:px-8 md:pt-24 md:pb-16">
        {/* Main Content Grid */}
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand & Mission Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-gold backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              <span>Official Student Portal</span>
            </div>

            <h2 className="font-display max-w-[14ch] text-[clamp(2.5rem,5vw,4.2rem)] leading-[0.92] tracking-tight">
              IISS x Student Council <span className="italic text-gold">Boys.</span>
            </h2>

            <p className="max-w-md text-sm leading-6 text-white/65">
              Activities, inter-school tournaments, leadership initiatives, and photographs published for the boys&apos; campus.
            </p>

            {/* Quick Council Handles / Pills (12th is SciXcom, 11th is Main) */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <a
                href={social.scixcomInstagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-xs transition hover:border-gold hover:bg-white/10 hover:text-white"
              >
                <InstagramMark size={14} />
                <span>12th Council · {social.scixcomLabel || "SciXcom"}</span>
                <ArrowUpRight size={12} className="text-gold" />
              </a>

              <a
                href={social.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-xs transition hover:border-gold hover:bg-white/10 hover:text-white"
              >
                <InstagramMark size={14} />
                <span>11th Council · {social.instagramLabel || "Instagram"}</span>
                <ArrowUpRight size={12} className="text-gold" />
              </a>

              <a
                href={social.schoolUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-xs transition hover:border-gold hover:bg-white/10 hover:text-white"
              >
                <Image
                  src="/brand/iiss-mark.webp"
                  alt=""
                  width={16}
                  height={16}
                  className="rounded-full bg-white p-px"
                />
                <span>{social.schoolLabel}</span>
                <ArrowUpRight size={12} className="text-gold" />
              </a>

              <Link
                href="/council/socials"
                className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-accent/25"
              >
                <Sparkles size={13} className="text-accent" />
                <span>Socials Feed</span>
              </Link>
            </div>

            {showSampleNote ? (
              <p className="mt-3 max-w-sm text-xs leading-5 text-white/40">
                Demonstration content published for preview and design evaluation.
              </p>
            ) : null}
          </div>

          {/* Navigation Links Column */}
          <nav className="lg:col-span-3" aria-label="Footer Navigation">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Directory</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {nav.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-white/75 transition hover:text-white"
                  >
                    <NavMark href={link.href} size={15} />
                    <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Connect & Links Column */}
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Connect</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/council/socials"
                  className="inline-flex items-center gap-2 text-white/75 transition hover:text-white"
                >
                  <InstagramMark size={15} />
                  <span>Pinned Socials Feed</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/suggestions"
                  className="inline-flex items-center gap-2 text-white/75 transition hover:text-white"
                >
                  <Heart size={15} className="text-rose-400" />
                  <span>Council Suggestions</span>
                </Link>
              </li>
              {social.extraLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    className="inline-flex items-center gap-2 text-white/75 transition hover:text-white"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Link2 size={15} />
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
              {contactHref ? (
                <li>
                  <a
                    href={contactHref}
                    className="inline-flex items-center gap-2 text-white/75 transition hover:text-white"
                    {...(contactHref.startsWith("mailto:")
                      ? {}
                      : { rel: "noopener noreferrer", target: "_blank" })}
                  >
                    <Mail size={15} />
                    <span>Direct Mail</span>
                  </a>
                </li>
              ) : null}
              <li>
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-2 text-white/75 transition hover:text-white"
                >
                  <Shield size={15} />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/manage"
                  className="inline-flex items-center gap-2 text-white/45 hover:text-white/70 text-xs pt-1 transition"
                >
                  <span>Content Desk</span>
                  <ArrowUpRight size={11} />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* cronicle.me Giant Bottom Wordmark: "iissboys" */}
        <div className="mt-20 md:mt-28 relative select-none" aria-hidden="true">
          <div className="w-full overflow-hidden text-center">
            <svg
              viewBox="0 0 1200 240"
              className="w-full h-auto max-h-[30vw] translate-y-3 opacity-90 transition duration-700 hover:opacity-100"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="iissboysGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
                  <stop offset="50%" stopColor="#c4a574" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
                </linearGradient>
                <linearGradient id="iissboysStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
                  <stop offset="50%" stopColor="#c4a574" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
                </linearGradient>
              </defs>
              <text
                x="50%"
                y="68%"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="url(#iissboysGradient)"
                stroke="url(#iissboysStroke)"
                strokeWidth="1.5"
                className="font-display font-black tracking-[-0.07em] uppercase"
                style={{ fontSize: "205px", letterSpacing: "-0.05em" }}
              >
                iissboys
              </text>
            </svg>
          </div>

          {/* Bottom ground blur and fade like cronicle.me */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#101626] to-transparent" />
        </div>

        {/* Sub-footer Copyright */}
        <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} IISS Student Council Boys · All rights reserved.</p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Powered by</span>
            <a
              href="https://arigo.buildkre.com"
              className="text-white/80 hover:text-white transition"
              rel="noopener noreferrer"
              target="_blank"
            >
              Arigo
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="https://buildkre.com"
              className="text-white/80 hover:text-white transition"
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
