import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { MobileNav } from "@/components/layout/mobile-nav";
import { siteConfig } from "@/lib/config";

const links = [
  { href: "/events", label: "Events & Activities" },
  { href: "/achievements", label: "Achievements" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/95">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          <Link href="/" className="text-sm text-ink">
            Home
          </Link>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-ink">
              {link.label}
            </Link>
          ))}
          <a href={siteConfig.officialSchoolUrl} className="text-sm text-ink">
            iiss.ae
          </a>
          <a href={siteConfig.arigoUrl ?? "https://arigo.buildkre.com"} className="text-sm text-ink">
            Arigo
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/events"
            className="hidden rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-ink transition-colors hover:bg-[#d86e12] md:inline-flex"
          >
            Explore Events
          </Link>
          <MobileNav
            links={[
              { href: "/", label: "Home" },
              ...links,
              { href: siteConfig.officialSchoolUrl, label: "iiss.ae" },
              { href: siteConfig.arigoUrl ?? "https://arigo.buildkre.com", label: "Arigo" },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
