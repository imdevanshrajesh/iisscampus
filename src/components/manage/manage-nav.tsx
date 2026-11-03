"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Calendar,
  Layers,
  Image as ImageIcon,
  Users,
  Trophy,
  Share2,
  HeartHandshake,
  Megaphone,
  Radio,
  Mail,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Compass,
  Settings,
  Shield,
  GraduationCap,
} from "lucide-react";

type NavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

type NavSection = {
  category: string;
  links: NavLink[];
};

const navigationCategories: NavSection[] = [
  {
    category: "Workspace",
    links: [
      { href: "/manage", label: "Overview", icon: LayoutDashboard },
      { href: "/manage/ai", label: "AI Assistant", icon: Sparkles, badge: "Copilot" },
    ],
  },
  {
    category: "Events & Media",
    links: [
      { href: "/manage/events", label: "Events", icon: Calendar },
      { href: "/manage/categories", label: "Categories", icon: Layers },
      { href: "/manage/gallery", label: "Gallery", icon: ImageIcon },
    ],
  },
  {
    category: "Council & Community",
    links: [
      { href: "/manage/council", label: "Council", icon: Users },
      { href: "/manage/houses", label: "Houses", icon: Shield },
      { href: "/manage/achievements", label: "Achievements", icon: Trophy },
      { href: "/manage/socials", label: "Social Posts", icon: Share2 },
      { href: "/manage/wellness", label: "Wellness", icon: HeartHandshake },
    ],
  },
  {
    category: "Editorial & Notices",
    links: [
      { href: "/manage/announcements", label: "Notices & Posts", icon: Megaphone },
      { href: "/manage/marquee", label: "Marquee", icon: Radio },
      { href: "/manage/newsletter", label: "Newsletter", icon: Mail },
      { href: "/manage/programs", label: "Programs & Activities", icon: BookOpen },
    ],
  },
  {
    category: "Engagement & Support",
    links: [
      { href: "/manage/suggestions", label: "Suggestions", icon: MessageSquare },
      { href: "/manage/faq", label: "FAQ", icon: HelpCircle },
    ],
  },
];

export function ManageNav({ showSettings }: { showSettings: boolean }) {
  const pathname = usePathname();

  const sections: NavSection[] = [
    ...navigationCategories,
    {
      category: "System",
      links: [
        { href: "/manage/navigation", label: "Navigation", icon: Compass },
        ...(showSettings ? [{ href: "/manage/settings", label: "Settings", icon: Settings }] : []),
      ],
    },
  ];

  return (
    <nav
      className="flex gap-2 overflow-x-auto px-4 pb-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-5 lg:overflow-y-auto lg:px-3 lg:pb-6"
      aria-label="Manage Navigation"
    >
      {sections.map((section) => (
        <div key={section.category} className="shrink-0 contents lg:grid lg:gap-1">
          <p className="hidden px-3 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-white/40 lg:block">
            {section.category}
          </p>
          <div className="flex gap-1 lg:grid lg:gap-0.5">
            {section.links.map((link) => {
              const active =
                link.href === "/manage" ? pathname === "/manage" : pathname.startsWith(link.href);
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  className={`group relative flex shrink-0 items-center justify-between gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-white/15 text-white font-semibold"
                      : "text-white/70 hover:bg-white/8 hover:text-white"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-opacity ${
                        active ? "text-orange-400 opacity-100" : "opacity-60 group-hover:opacity-100"
                      }`}
                    />
                    <span className="truncate">{link.label}</span>
                  </div>

                  {link.badge && (
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.2 text-[9px] font-bold tracking-wider uppercase ${
                        active
                          ? "bg-orange-500 text-white"
                          : "bg-white/15 text-white/80 group-hover:bg-orange-500/80 group-hover:text-white"
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}

                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 hidden w-1 rounded-r-full bg-orange-500 lg:block" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
