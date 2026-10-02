import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { siteConfig } from "@/lib/config";

const explore = [
  { href: "/events", label: "Events & Activities" },
  { href: "/achievements", label: "Achievements" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
];

export function SiteFooter({ showSampleNote }: { showSampleNote: boolean }) {
  return (
    <footer className="mt-auto border-t border-line bg-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-12 md:px-8">
        <div className="md:col-span-5">
          <Wordmark />
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
            An independent archive of campus activities, student initiatives, and achievements.
            It is not the official website of India International School.
          </p>
          {showSampleNote ? (
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
              Some records are demonstration content and are not verified historical accounts.
            </p>
          ) : null}
        </div>
        <nav className="md:col-span-3" aria-label="Footer">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Explore</p>
          <ul className="mt-4 space-y-2 text-sm">
            {explore.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Elsewhere</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={siteConfig.officialSchoolUrl} className="text-ink">
                India International School
              </a>
            </li>
            <li>
              <a href={siteConfig.arigoUrl ?? "https://arigo.buildkre.com"} className="text-ink">
                Arigo
              </a>
            </li>
            {siteConfig.instagramUrl ? (
              <li>
                <a href={siteConfig.instagramUrl} className="text-ink">
                  Instagram
                </a>
              </li>
            ) : null}
            {siteConfig.contactUrl ? (
              <li>
                <a href={siteConfig.contactUrl} className="text-ink">
                  Contact
                </a>
              </li>
            ) : null}
            <li>
              <Link href="/privacy" className="text-ink">
                Privacy
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-muted md:px-8">
          © {new Date().getFullYear()} IISSCampus. An activities archive for the school community.
        </p>
      </div>
    </footer>
  );
}
