import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { signOut } from "@/lib/manage/actions";
import { getCampusActor } from "@/lib/auth/session";

const links = [
  { href: "/manage", label: "Overview" },
  { href: "/manage/events", label: "Events" },
  { href: "/manage/achievements", label: "Achievements" },
  { href: "/manage/gallery", label: "Gallery" },
];

export async function ManageBar() {
  const actor = await getCampusActor();

  return (
    <header className="border-b border-line bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Wordmark />
        {actor ? (
          <nav className="flex flex-wrap items-center gap-4 text-sm" aria-label="Content">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-ink">
                {link.label}
              </Link>
            ))}
            {actor.role === "administrator" ? (
              <Link href="/manage/settings" className="text-ink">
                Settings
              </Link>
            ) : null}
            <form action={signOut}>
              <button type="submit" className="text-muted">
                Sign out
              </button>
            </form>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
