"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { classifyMediaUrl } from "@/lib/media/url";
import type { CampusEvent, GalleryImage } from "@/lib/types";

export type GalleryGroup = {
  event: CampusEvent;
  images: GalleryImage[];
  placeholder: string | null;
  totalCount?: number;
};

type Slide = {
  src: string;
  alt: string;
  caption: string | null;
  eventTitle: string;
};

export function GalleryView({
  groups,
  hosts,
  showEventActions = false,
}: {
  groups: GalleryGroup[];
  hosts: readonly string[];
  showEventActions?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const slides: Slide[] = groups.flatMap((group) =>
    group.images.flatMap((image) => {
      const classified = classifyMediaUrl(image.url, hosts);
      if (!classified.ok) return [];
      return [
        {
          src: classified.url,
          alt: image.alt,
          caption: image.caption,
          eventTitle: group.event.title,
        },
      ];
    }),
  );

  function open(slideIndex: number) {
    setIndex(slideIndex);
    dialogRef.current?.showModal();
  }

  function move(direction: number) {
    if (!slides.length) return;
    setIndex((current) => (current + direction + slides.length) % slides.length);
  }

  let slideCursor = 0;

  return (
    <div className="space-y-12">
      {groups.map((group) => {
        const allCount = group.totalCount ?? group.images.length;
        return (
          <section key={group.event.id} aria-labelledby={`gallery-${group.event.slug}`}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id={`gallery-${group.event.slug}`} className="text-2xl font-medium tracking-tight">
                {group.event.title}
              </h2>
              {showEventActions ? (
                <div className="flex flex-wrap gap-3 text-sm">
                  <Link href={`/events/${group.event.slug}#photographs`} className="rounded-md border border-line px-3 py-1.5 text-ink">
                    See all photos{allCount > group.images.length ? ` (${allCount})` : ""}
                  </Link>
                  <Link href={`/events/${group.event.slug}`} className="rounded-md bg-accent px-3 py-1.5 text-accent-ink">
                    Event details
                  </Link>
                </div>
              ) : null}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
              {group.images.length
                ? group.images.map((image) => {
                    const classified = classifyMediaUrl(image.url, hosts);
                    const slideIndex = slideCursor;
                    if (classified.ok) slideCursor += 1;
                    return (
                      <figure key={image.id} className="overflow-hidden rounded-xl border border-line bg-white">
                        {classified.ok ? (
                          <button type="button" className="block w-full text-left" onClick={() => open(slideIndex)}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={classified.url}
                              alt={image.alt}
                              className="aspect-[4/3] w-full object-cover"
                              loading="lazy"
                            />
                          </button>
                        ) : (
                          <div className="flex aspect-[4/3] items-end bg-wash p-4 text-sm text-ink">
                            Photograph unavailable
                          </div>
                        )}
                        {image.caption || image.attribution ? (
                          <figcaption className="px-3 py-3 text-xs leading-5 text-muted">
                            {image.caption}
                            {image.attribution ? <span className="block">{image.attribution}</span> : null}
                          </figcaption>
                        ) : null}
                      </figure>
                    );
                  })
                : (
                  <figure className="overflow-hidden rounded-xl border border-line bg-wash md:col-span-1">
                    <div className="flex aspect-[4/3] flex-col justify-between p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-accent">Placeholder</p>
                      <p className="text-lg font-medium tracking-tight">{group.event.title}</p>
                    </div>
                    {group.placeholder ? (
                      <figcaption className="px-4 pb-4 text-xs leading-5 text-muted">{group.placeholder}</figcaption>
                    ) : null}
                  </figure>
                )}
            </div>
          </section>
        );
      })}

      <dialog ref={dialogRef} className="lightbox-dialog" aria-label="Photograph">
        {slides[index] ? (
          <div>
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm text-muted">{slides[index].eventTitle}</p>
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center" aria-label="Close photograph" onClick={() => dialogRef.current?.close()}>
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slides[index].src} alt={slides[index].alt} className="max-h-[70vh] w-full object-contain bg-surface" />
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <p className="text-sm text-muted">{slides[index].caption}</p>
              <div className="flex gap-2">
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line" aria-label="Previous photograph" onClick={() => move(-1)}>
                  <ChevronLeft aria-hidden="true" size={18} />
                </button>
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line" aria-label="Next photograph" onClick={() => move(1)}>
                  <ChevronRight aria-hidden="true" size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
