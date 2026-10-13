"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const groups = [
  {
    label: "Desk",
    links: [{ href: "/manage", label: "Overview" }],
  },
  {
    label: "Content",
    links: [
      { href: "/manage/events", label: "Events" },
      { href: "/manage/categories", label: "Categories" },
      { href: "/manage/gallery", label: "Gallery" },
    ],
  },
  {
    label: "School",
    links: [
      { href: "/manage/council", label: "Council" },
      { href: "/manage/achievements", label: "Achievements" },
      { href: "/manage/announcements", label: "Announcements" },
      { href: "/manage/faq", label: "FAQ" },
      { href: "/manage/newsletter", label: "Newsletter" },
    ],
  },
];

export function ManageNav({ showSettings }: { showSettings: boolean }) {
  const pathname = usePathname();
  const sections = showSettings
    ? [...groups, { label: "Admin", links: [{ href: "/manage/settings", label: "Settings" }] }]
    : groups;

  return (
    <nav
      className="flex gap-1 overflow-x-auto px-4 pb-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-6 lg:overflow-y-auto lg:px-3 lg:pb-6"
      aria-label="Content"
    >
      {sections.map((group) => (
        <div key={group.label} className="contents lg:grid lg:gap-1">
          <p className="hidden px-3 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-white/40 lg:block">
            {group.label}
          </p>
          <div className="contents lg:grid lg:gap-0.5">
            {group.links.map((link) => {
              const active = link.href === "/manage" ? pathname === "/manage" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm ${
                    active ? "bg-white text-navy" : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
