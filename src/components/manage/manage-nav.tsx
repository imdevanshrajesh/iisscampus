"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/manage", label: "Desk" },
  { href: "/manage/events", label: "Events" },
  { href: "/manage/categories", label: "Categories" },
  { href: "/manage/council", label: "Council" },
  { href: "/manage/achievements", label: "Achievements" },
  { href: "/manage/gallery", label: "Gallery" },
  { href: "/manage/newsletter", label: "Newsletter" },
];

export function ManageNav({ showSettings }: { showSettings: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Content">
      {links.map((link) => {
        const active = link.href === "/manage" ? pathname === "/manage" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-3 py-1.5 ${active ? "bg-white text-navy" : "text-white/80 hover:text-white"}`}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
      {showSettings ? (
        <Link
          href="/manage/settings"
          className={`rounded-full px-3 py-1.5 ${pathname.startsWith("/manage/settings") ? "bg-white text-navy" : "text-white/80 hover:text-white"}`}
          aria-current={pathname.startsWith("/manage/settings") ? "page" : undefined}
        >
          Settings
        </Link>
      ) : null}
    </nav>
  );
}
