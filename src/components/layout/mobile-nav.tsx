"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

type LinkItem = { href: string; label: string };

export function MobileNav({ links }: { links: LinkItem[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line md:hidden"
        aria-label="Open menu"
        onClick={() => dialogRef.current?.showModal()}
      >
        <Menu aria-hidden="true" size={18} />
      </button>
      <dialog ref={dialogRef} className="menu-dialog" aria-label="Mobile menu">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <p className="font-semibold tracking-tight">IISSCampus</p>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line"
              aria-label="Close menu"
              onClick={close}
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>
          <nav className="flex flex-col px-3 py-4" aria-label="Mobile">
            {links.map((link) =>
              link.href.startsWith("http") ? (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="rounded-md px-3 py-3 text-base text-ink"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="rounded-md px-3 py-3 text-base text-ink"
                >
                  {link.label}
                </Link>
              ),
            )}
            <Link
              href="/events"
              onClick={close}
              className="mx-3 mt-4 inline-flex items-center justify-center rounded-md bg-accent px-4 py-3 text-sm font-medium text-accent-ink"
            >
              Explore Events
            </Link>
          </nav>
        </div>
      </dialog>
    </>
  );
}
