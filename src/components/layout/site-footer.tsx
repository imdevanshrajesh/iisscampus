import { ArrowUpRight, Compass, Heart, Mail, Shield } from "lucide-react";
import { InstagramMark } from "@/components/brand/instagram-mark";
import Link from "next/link";
import { contactMailto, siteConfig } from "@/lib/config";
import type { SocialLinks } from "@/lib/types";

export function SiteFooter({
  social,
  contactEmail,
}: {
  social: SocialLinks;
  contactEmail?: string | null;
  [key: string]: unknown;
}) {
  const contactHref = contactMailto(contactEmail) ?? siteConfig.contactUrl;

  return (
    <footer className="mt-auto relative overflow-hidden bg-[#0a0e1a] text-white border-t border-white/10">
      {/* Subtle, restrained ambient warmth */}
      <div
        className="pointer-events-none absolute -bottom-16 left-1/2 -translate-x-1/2 h-44 w-[36rem] rounded-full bg-gradient-to-r from-accent/10 via-gold/15 to-amber-500/10 blur-[100px] opacity-25"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[90rem] px-5 pt-12 pb-10 md:px-8 md:pt-16 md:pb-12">
        {/* Decluttered Quick Links Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={social.scixcomInstagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md transition hover:border-gold hover:bg-white/10 hover:text-white"
            >
              <InstagramMark size={14} />
              <span>12th · {social.scixcomLabel || "SciXcom"}</span>
              <ArrowUpRight size={12} className="text-gold" />
            </a>

            <a
              href={social.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md transition hover:border-gold hover:bg-white/10 hover:text-white"
            >
              <InstagramMark size={14} />
              <span>11th · {social.instagramLabel || "Council"}</span>
              <ArrowUpRight size={12} className="text-gold" />
            </a>

            <Link
              href="/council/socials"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white transition hover:border-gold hover:bg-white/10"
            >
              <Compass size={13} className="text-gold" />
              <span>Socials Feed</span>
            </Link>

            <Link
              href="/suggestions"
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-rose-500/20"
            >
              <Heart size={13} className="text-rose-400" />
              <span>Suggestions</span>
            </Link>
          </div>

          <div className="flex items-center gap-4 text-xs text-white/60">
            {contactHref ? (
              <a
                href={contactHref}
                className="inline-flex items-center gap-1.5 hover:text-white transition"
                {...(contactHref.startsWith("mailto:")
                  ? {}
                  : { rel: "noopener noreferrer", target: "_blank" })}
              >
                <Mail size={13} />
                <span>Contact Desk</span>
              </a>
            ) : null}

            <Link href="/privacy" className="inline-flex items-center gap-1.5 hover:text-white transition">
              <Shield size={13} />
              <span>Privacy</span>
            </Link>
          </div>
        </div>

        {/* Center Stage: Sleek, Low-Glow "iissboys" Typographic Wordmark */}
        <div className="relative my-8 sm:my-10 select-none" aria-hidden="true">
          <div className="w-full overflow-hidden text-center relative z-10">
            <svg
              viewBox="0 0 1200 240"
              className="w-full h-auto max-h-[30vw] mx-auto filter drop-shadow-[0_0_12px_rgba(196,165,116,0.18)] transition duration-500 hover:drop-shadow-[0_0_20px_rgba(196,165,116,0.3)]"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Solid pre-blended stops + no internal stroke prevents Fraunces uppercase Y contour overlaps */}
                <linearGradient id="iissboysGlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#474a53" />
                  <stop offset="35%" stopColor="#847056" />
                  <stop offset="50%" stopColor="#b8ae99" />
                  <stop offset="65%" stopColor="#847056" />
                  <stop offset="100%" stopColor="#474a53" />
                </linearGradient>
              </defs>
              <text
                x="50%"
                y="66%"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="url(#iissboysGlowGradient)"
                fillRule="nonzero"
                className="font-display font-black uppercase"
                style={{
                  fontSize: "215px",
                  letterSpacing: "-0.05em",
                }}
              >
                iissboys
              </text>
            </svg>
          </div>

          {/* Bottom horizon blur and fade */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0a0e1a] to-transparent" />
        </div>

        {/* Minimal Sub-footer Copyright */}
        <div className="flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} IISS Student Council Boys · All rights reserved.</p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Powered by</span>
            <a
              href="https://arigo.buildkre.com"
              className="text-white/75 hover:text-white transition"
              rel="noopener noreferrer"
              target="_blank"
            >
              Arigo
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="https://buildkre.com"
              className="text-white/75 hover:text-white transition"
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
