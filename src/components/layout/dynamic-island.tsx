"use client";

import { Home, Images, CalendarDays, Users, Newspaper } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { primaryNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

const dock = [
  { href: "/", label: "Home", icon: Home },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/council", label: "Council", icon: Users },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/newsletter", label: "Letter", icon: Newspaper },
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

export function SiteChrome() {
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
          className="nav-island pointer-events-auto"
          data-open={expanded ? "true" : "false"}
          onMouseEnter={() => {
            if (canHover) setOpen(true);
          }}
          onMouseLeave={() => {
            if (!pinned) setOpen(false);
          }}
        >
          <div className="nav-island__bar">
            <Link href="/" aria-label="Home" className="nav-island__logo" onClick={closeMenu}>
              <Image src="/brand/student-council.png" alt="" width={32} height={32} unoptimized className="h-full w-full object-cover" priority />
            </Link>
            <Link href="/" onClick={closeMenu} className="rounded-full px-2.5 py-1.5 text-sm font-medium text-ink">
              Home
            </Link>
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-ink"
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
              {expanded ? "Close" : "Menu"}
            </button>
          </div>

          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="overflow-hidden" aria-hidden={!expanded} inert={!expanded}>
              <nav className="flex flex-wrap gap-1 px-2 pt-1 pb-2.5" aria-label="Primary">
                {primaryNav.map((link) => {
                  const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm",
                        active ? "bg-navy text-white" : "text-ink/75 hover:bg-ink/5 hover:text-ink",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
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
