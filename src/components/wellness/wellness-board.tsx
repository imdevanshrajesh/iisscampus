"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";
import { classifyNavigationUrl } from "@/lib/media/url";
import type { WellnessCategory, WellnessItem } from "@/lib/types";

const imageClass: Record<WellnessItem["imageOrientation"], string> = {
  auto: "h-auto w-full object-contain",
  portrait: "aspect-[3/4] w-full object-cover",
  landscape: "aspect-[16/10] w-full object-cover",
  square: "aspect-square w-full object-cover",
};

export type WellnessGroup = {
  category: WellnessCategory;
  items: WellnessItem[];
};

export function WellnessBoard({ groups }: { groups: WellnessGroup[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<{ src: string; alt: string; title: string } | null>(null);

  function openImage(src: string, alt: string, title: string) {
    setActive({ src, alt, title });
    dialogRef.current?.showModal();
  }

  function closeImage() {
    dialogRef.current?.close();
    setActive(null);
  }

  return (
    <>
      <div className="mt-12 space-y-16">
        {groups.map((group) => (
          <section key={group.category.id} className="space-y-6">
            <h2 className="font-display text-3xl text-ink md:text-4xl">{group.category.name}</h2>
            <div className="flex flex-wrap gap-6">
              {group.items.map((item) => {
                const pdf = item.pdfUrl ? classifyNavigationUrl(item.pdfUrl) : null;
                return (
                  <article
                    key={item.id}
                    className="flex w-full flex-col gap-3 sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
                  >
                    {item.imageUrl ? (
                      <button
                        type="button"
                        className="block w-full text-left"
                        onClick={() => openImage(item.imageUrl!, item.imageAlt || item.title, item.title)}
                        aria-label={`View larger: ${item.title}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.imageAlt || item.title}
                          className={`rounded-2xl border border-line transition-opacity hover:opacity-90 ${imageClass[item.imageOrientation]}`}
                        />
                      </button>
                    ) : null}
                    <h3 className="text-lg font-medium text-ink">{item.title}</h3>
                    {item.body ? (
                      <div className="text-sm leading-7 text-muted whitespace-pre-wrap">{item.body}</div>
                    ) : null}
                    {pdf?.ok ? (
                      <a
                        href={pdf.url}
                        className="mt-auto inline-flex w-fit rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Download PDF
                      </a>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className="lightbox-dialog"
        aria-label="Wellness image"
        onClose={() => setActive(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeImage();
        }}
      >
        {active ? (
          <div>
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm text-muted">{active.title}</p>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center"
                aria-label="Close image"
                onClick={closeImage}
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.src} alt={active.alt} className="max-h-[80vh] w-full object-contain bg-surface" />
          </div>
        ) : null}
      </dialog>
    </>
  );
}
