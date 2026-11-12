"use client";

import { CalendarDays, ChevronDown, Clock, Home, Images, Menu, Newspaper, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CouncilLogo } from "@/components/brand/council-logo";
import { NavMark } from "@/components/layout/nav-marks";
import type { PublicNavGroup, PublicNavLink } from "@/lib/types";
import { cn } from "@/lib/utils";

const dock = [
  { href: "/", label: "Home", icon: Home },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/council", label: "Council", icon: Users },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/newsletter", label: "Letter", icon: Newspaper },
];

const clockFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Dubai",
});

function NavClock() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const tick = () => setLabel(clockFormat.format(new Date()));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <time className="hidden min-w-36 items-center justify-end gap-1.5 text-right text-sm tabular-nums whitespace-nowrap text-background/75 lg:inline-flex" suppressHydrationWarning>
      <Clock aria-hidden="true" size={14} className="shrink-0 opacity-70" />
      {label || "\u00a0"}
    </time>
  );
}

const sectionHrefs = new Set([
  "/",
  "/events",
  "/competitions",
  "/council",
  "/announcements",
  "/newsletter",
  "/council/socials",
  "/socials",
  "/school/houses",
  "/houses",
  "/school/faculty",
  "/faculty",
  "/achievements",
  "/gallery",
  "/wellness",
  "/about",
  "/suggestions",
]);

function groupActive(pathname: string, group: PublicNavGroup) {
  if (group.href) return group.href === "/" ? pathname === "/" : pathname.startsWith(group.href);
  return group.links.some((link) => (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)));
}

function splitLinks(links: PublicNavLink[]) {
  const viewAll = links.find((link) => sectionHrefs.has(link.href));
  return { viewAll: viewAll && links.length > 1 ? viewAll : null, cards: links };
}

export function HomeLink() {
  return null;
}

function LinkCards({ links, onNavigate }: { links: PublicNavLink[]; onNavigate: () => void }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => (
        <li key={`${link.href}-${link.title}`}>
          <Link
            href={link.href}
            onClick={onNavigate}
            className="group block h-full rounded-2xl border border-line/80 bg-white/80 p-4 transition-all duration-200 hover:border-accent/40 hover:bg-white hover:shadow-sm"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-ink group-hover:text-accent transition-colors">
              <NavMark href={link.href} label={link.title} size={16} />
              {link.title}
            </span>
            {link.description ? (
              <span className="mt-1 block text-xs leading-5 text-muted group-hover:text-ink/80 transition-colors">
                {link.description}
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function GroupPanel({
  group,
  onNavigate,
  embedded = false,
}: {
  group: PublicNavGroup;
  onNavigate: () => void;
  embedded?: boolean;
}) {
  const { viewAll, cards } = splitLinks(group.links);
  return (
    <div className={embedded ? "grid gap-3" : "mx-auto grid max-w-[90rem] gap-4 px-5 py-5 md:px-8 md:py-6"}>
      {!embedded || viewAll ? (
        <div className="flex items-center justify-between gap-4">
          {embedded ? <span /> : (
            <p className="inline-flex items-center gap-2 text-sm font-medium text-ink">
              <NavMark href={group.href ?? group.links[0]?.href} label={group.label} size={15} />
              {group.label}
            </p>
          )}
          {viewAll ? (
            <Link href={viewAll.href} onClick={onNavigate} className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3.5 py-1.5 text-sm text-white">
              <NavMark href={viewAll.href} label={viewAll.title} size={14} />
              View all
            </Link>
          ) : null}
        </div>
      ) : null}
      <LinkCards links={cards} onNavigate={onNavigate} />
    </div>
  );
}

export function SiteChrome({
  logoUrl,
  brandHref = "/",
  brandLabel = "IISS Boys",
  groups = [],
}: {
  logoUrl?: string | null;
  brandHref?: string;
  brandLabel?: string;
  groups?: PublicNavGroup[];
}) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<number | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const [trackedPath, setTrackedPath] = useState(pathname);
  const menuGroups = groups.length ? groups : fallbackGroups();

  if (trackedPath !== pathname) {
    setTrackedPath(pathname);
    setOpenId(null);
    setMobileOpen(false);
  }

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenId(null);
        setMobileOpen(false);
      }
    }
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenId(null);
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  function closeMenu() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpenId(null);
    setMobileOpen(false);
  }

  function cancelClose() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }

  function scheduleClose() {
    if (!canHover) return;
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpenId(null), 160);
  }

  function hoverGroup(id: string | null) {
    if (!canHover) return;
    cancelClose();
    setOpenId(id);
  }

  const openGroup = menuGroups.find((group) => group.id === openId && group.links.length) ?? null;

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header
        ref={rootRef}
        className="site-nav pointer-events-none fixed inset-x-0 top-2 z-50 flex h-max items-start justify-center px-3"
      >
        <div className="pointer-events-auto relative w-full md:w-auto" onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
        <div className="site-nav__bar">
          <nav className="site-nav__links hidden items-center gap-2 md:flex" aria-label="Primary">
            {menuGroups.map((group) => {
              const active = groupActive(pathname, group);
              const className = cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm",
                active ? "text-background" : "text-background/70 hover:text-background",
              );
                  if (!group.links.length && group.href) {
                return (
                  <Link
                    key={group.id}
                    href={group.href}
                    onMouseEnter={() => hoverGroup(null)}
                    onClick={closeMenu}
                    className={className}
                    aria-current={active ? "page" : undefined}
                  >
                    <NavMark href={group.href} label={group.label} size={15} />
                    {group.label}
                  </Link>
                );
              }
              const expanded = openId === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  className={className}
                  aria-expanded={expanded}
                  aria-controls={expanded ? "site-nav-panel" : undefined}
                  onMouseEnter={() => hoverGroup(group.id)}
                  onFocus={() => hoverGroup(group.id)}
                  onClick={() => {
                    if (canHover) return;
                    setMobileOpen(false);
                    setOpenId(expanded ? null : group.id);
                  }}
                >
                  <NavMark href={group.href ?? group.links[0]?.href} label={group.label} size={15} />
                  {group.label}
                  <ChevronDown aria-hidden="true" size={14} className={cn("opacity-70 transition", expanded && "rotate-180")} />
                </button>
              );
            })}
          </nav>
          <div className="site-nav__end">
            <Link href={brandHref} aria-label={brandLabel} className="site-nav__brand" onClick={closeMenu}>
              <span className="site-nav__mark">
                <CouncilLogo url={logoUrl} width={30} height={30} className="h-full w-full object-cover" priority />
              </span>
              <span className="site-nav__name">{brandLabel}</span>
            </Link>
            <Link
              href="/events"
              onMouseEnter={() => hoverGroup(null)}
              onClick={closeMenu}
              className="hidden items-center gap-1.5 rounded-full bg-background px-3.5 py-1.5 text-sm font-medium text-navy md:inline-flex"
            >
              <CalendarDays aria-hidden="true" size={15} />
              What&apos;s on
            </Link>
            <NavClock />
            <button
              type="button"
              className="site-nav__menu inline-flex items-center rounded-full bg-background px-2.5 py-1.5 text-navy md:hidden"
              aria-expanded={mobileOpen}
              aria-controls="site-nav-mobile"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => {
                setMobileOpen((open) => !open);
                setOpenId(null);
              }}
            >
              <Menu aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
        {openGroup ? (
          <div className="absolute top-full left-1/2 z-50 hidden -translate-x-1/2 pt-2 md:block">
            <div id="site-nav-panel" className="site-nav__panel">
              <GroupPanel group={openGroup} onNavigate={closeMenu} />
            </div>
          </div>
        ) : null}
        {mobileOpen ? (
          <div id="site-nav-mobile" className="site-nav__panel site-nav__panel--menu absolute top-full left-1/2 mt-2 -translate-x-1/2 md:hidden">
            <nav className="mx-auto grid max-w-[90rem] gap-2 px-4 py-4" aria-label="Primary">
              {menuGroups.map((group) => {
                if (!group.links.length && group.href) {
                  return (
                    <Link
                      key={group.id}
                      href={group.href}
                      onClick={closeMenu}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink"
                    >
                      <NavMark href={group.href} label={group.label} size={16} />
                      {group.label}
                    </Link>
                  );
                }
                const expanded = openId === group.id;
                return (
                  <div key={group.id} className="rounded-2xl border border-line bg-background">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-ink"
                      aria-expanded={expanded}
                      onClick={() => setOpenId(expanded ? null : group.id)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <NavMark href={group.href ?? group.links[0]?.href} label={group.label} size={16} />
                        {group.label}
                      </span>
                      <ChevronDown aria-hidden="true" size={14} className={cn("transition", expanded && "rotate-180")} />
                    </button>
                    {expanded ? (
                      <div className="px-3 pb-3">
                        <GroupPanel group={group} onNavigate={closeMenu} embedded />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>
          </div>
        ) : null}
        </div>
      </header>

      <nav
        className="phone-dock fixed inset-x-3 bottom-3 z-40 flex items-stretch justify-between rounded-full border border-white/10 bg-navy/95 px-1 py-1 text-white shadow-[0_12px_30px_rgba(20,27,56,0.28)] md:hidden"
        aria-label="Pages"
      >
        {dock.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-0.5 text-[10px] leading-none whitespace-nowrap sm:text-[11px]",
                active ? "bg-white text-navy" : "text-white/80",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon aria-hidden="true" size={16} className="shrink-0" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function fallbackGroups(): PublicNavGroup[] {
  return [
    {
      id: "nav-home",
      label: "Home",
      href: "/",
      links: [],
    },
    {
      id: "nav-events",
      label: "Events",
      href: "/events",
      links: [
        { href: "/events", title: "All Events", description: "Upcoming and ongoing campus activities" },
        { href: "/competitions", title: "Competitions", description: "Internal fixtures & inter-school contests" },
      ],
    },
    {
      id: "nav-council",
      label: "Council",
      href: "/council",
      links: [
        { href: "/council", title: "The Council", description: "Student executive leadership roster" },
        { href: "/announcements", title: "Notices & Posts", description: "Official circulars, blogs & posts" },
        { href: "/newsletter", title: "Newsletter", description: "The latest student circular & letter" },
        { href: "/council/socials", title: "Pinned Socials", description: "Official Instagram accounts and feed" },
        { href: "/suggestions", title: "Suggestions Box", description: "Direct suggestions to council reps" },
      ],
    },
    {
      id: "nav-school",
      label: "School & Life",
      href: "/school/houses",
      links: [
        { href: "/school/houses", title: "Houses", description: "Ruby, Sapphire, Topaz & Emerald" },
        { href: "/school/faculty", title: "Faculty", description: "Principal, Vice Principals, Heads & Supervisors" },
        { href: "/gallery", title: "Gallery", description: "High-resolution campus photography" },
        { href: "/wellness", title: "Wellness Corner", description: "A quiet space for student wellbeing" },
        { href: "/achievements", title: "Achievements", description: "Trophies, awards, and victories" },
        { href: "/about", title: "FAQ & About", description: "Questions and council governance" },
      ],
    },
  ];
}
