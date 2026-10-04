"use client";

import { Home, Images, CalendarDays, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/config";
import type { CampusPulse } from "@/lib/data/catalog";
import { primaryNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

const dock = [
  { href: "/", label: "Home", icon: Home },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/council", label: "Council", icon: Users },
  { href: "/gallery", label: "Gallery", icon: Images },
];

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

export function SiteChrome({ pulse }: { pulse: CampusPulse }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const [trackedPath, setTrackedPath] = useState(pathname);
  const expanded = open || pinned;

  if (trackedPath !== pathname) {
    setTrackedPath(pathname);
    setOpen(false);
    setPinned(false);
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
        setOpen(false);
        setPinned(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function closeMenu() {
    setOpen(false);
    setPinned(false);
  }

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4">
        <div
          className="nav-island pointer-events-auto text-white"
          data-open={expanded ? "true" : "false"}
          onMouseEnter={() => {
            if (canHover) setOpen(true);
          }}
          onMouseLeave={() => {
            if (!pinned) setOpen(false);
          }}
        >
          <div className="flex items-center justify-between gap-2 px-2 py-2">
            <Link href="/" aria-label="Home" className="shrink-0 rounded-full" onClick={closeMenu}>
              <Image src="/brand/iiss-mark.webp" alt="" width={28} height={28} className="h-7 w-7 rounded-full" priority />
            </Link>
            <Link
              href="/"
              onClick={closeMenu}
              className="rounded-full px-2.5 py-1.5 text-sm font-medium text-white"
            >
              Home
            </Link>
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white"
              aria-expanded={expanded}
              onClick={() => {
                if (pinned) {
                  setPinned(false);
                  setOpen(false);
                  return;
                }
                setPinned(true);
                setOpen(true);
              }}
            >
              {pulse.tone === "live" ? <span className="h-1.5 w-1.5 rounded-full bg-accent" /> : null}
              {expanded ? "Close" : "Menu"}
            </button>
          </div>

          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="overflow-hidden" aria-hidden={!expanded} inert={!expanded}>
              <div className="flex flex-col gap-3 px-3 pb-3 pt-1">
                <nav className="flex flex-wrap gap-1" aria-label="Primary">
                  {primaryNav.map((link) => {
                    const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={closeMenu}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-sm",
                          active ? "bg-white text-navy" : "text-white/80 hover:bg-white/10 hover:text-white",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
                <Link href={pulse.href} onClick={closeMenu} className="rounded-2xl bg-white/10 px-3 py-2.5 text-sm text-white">
                  <span className="block text-xs text-white/60">{pulse.detail}</span>
                  <span className="mt-0.5 block">{pulse.label}</span>
                </Link>
                <div className="flex gap-4 px-1 text-xs text-white/60">
                  <a href={siteConfig.officialSchoolUrl}>iiss.ae</a>
                  <a href={siteConfig.arigoUrl ?? "https://arigo.buildkre.com"}>Arigo</a>
                </div>
              </div>
            </div>
          </div>
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
                "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[11px]",
                active ? "bg-white text-navy" : "text-white/80",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon aria-hidden="true" size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
