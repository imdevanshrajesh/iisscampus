"use client";

import { ChevronDown, Home, Images, CalendarDays, Users, Newspaper } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CouncilLogo } from "@/components/brand/council-logo";
import { primaryNav } from "@/lib/nav";
import type { PublicNavGroup, PublicNavLink } from "@/lib/types";
import { cn } from "@/lib/utils";

const dock = [
  { href: "/", label: "Home", icon: Home },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/council", label: "Council", icon: Users },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/newsletter", label: "Letter", icon: Newspaper },
];

const sectionHrefs = new Set([
  "/",
  "/events",
  "/competitions",
  "/council",
  "/achievements",
  "/gallery",
  "/newsletter",
  "/wellness",
  "/about",
]);

function groupActive(pathname: string, group: PublicNavGroup) {
  if (group.href) return group.href === "/" ? pathname === "/" : pathname.startsWith(group.href);
  return group.links.some((link) => (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)));
}

function splitLinks(links: PublicNavLink[]) {
  const viewAll = links.find((link) => sectionHrefs.has(link.href));
  const cards = viewAll && links.length > 1 ? links.filter((link) => link !== viewAll) : links;
  return { viewAll: viewAll && links.length > 1 ? viewAll : null, cards };
}

export function HomeLink() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8">
      <Link href="/" className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink">
        <Home aria-hidden="true" size={16} />
        Home
      </Link>
    </div>
  );
}

function LinkCards({ links, onNavigate }: { links: PublicNavLink[]; onNavigate: () => void }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => (
        <li key={`${link.href}-${link.title}`}>
          <Link
            href={link.href}
            onClick={onNavigate}
            className="block h-full rounded-2xl border border-line bg-background px-4 py-3.5 transition hover:bg-wash"
          >
            <span className="block text-sm font-medium text-ink">{link.title}</span>
            {link.description ? <span className="mt-1 block text-sm leading-5 text-muted">{link.description}</span> : null}
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
          {embedded ? <span /> : <p className="text-sm font-medium text-ink">{group.label}</p>}
          {viewAll ? (
            <Link href={viewAll.href} onClick={onNavigate} className="rounded-full bg-navy px-3.5 py-1.5 text-sm text-white">
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
        className="site-nav pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3"
      >
        <div className="pointer-events-auto relative" onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
        <div className="site-nav__bar">
          <nav className="site-nav__links hidden items-center gap-0.5 md:flex" aria-label="Primary">
            {menuGroups.map((group) => {
              const active = groupActive(pathname, group);
              const className = cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm",
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
              <span className="hidden sm:inline">{brandLabel}</span>
            </Link>
            <Link
              href="/events"
              onMouseEnter={() => hoverGroup(null)}
              onClick={closeMenu}
              className="hidden rounded-full bg-background px-3.5 py-1.5 text-sm font-medium text-navy md:inline-flex"
            >
              What&apos;s on
            </Link>
            <button
              type="button"
              className="rounded-full bg-background px-3.5 py-1.5 text-sm font-medium text-navy md:hidden"
              aria-expanded={mobileOpen}
              aria-controls="site-nav-mobile"
              onClick={() => {
                setMobileOpen((open) => !open);
                setOpenId(null);
              }}
            >
              {mobileOpen ? "Close" : "Menu"}
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
                      className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink"
                    >
                      {group.label}
                    </Link>
                  );
                }
                const expanded = openId === group.id;
                return (
                  <div key={group.id} className="rounded-2xl border border-line bg-background">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-ink"
                      aria-expanded={expanded}
                      onClick={() => setOpenId(expanded ? null : group.id)}
                    >
                      {group.label}
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
  return primaryNav.map((link) => ({
    id: link.href,
    label: link.label,
    href: link.href,
    links: [],
  }));
}
