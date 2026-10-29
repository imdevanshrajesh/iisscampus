import Link from "next/link";
import { ArrowRight, Eye, Maximize2 } from "lucide-react";
import { RevealOnScroll } from "@/components/home/reveal-on-scroll";
import { classifyMediaUrl } from "@/lib/media/url";
import type { CampusEvent } from "@/lib/types";

export function GalleryMosaic({
  events,
  hosts,
}: {
  events: CampusEvent[];
  hosts: readonly string[];
}) {
  const tiles = events
    .flatMap((event) => {
      const pinned = event.images.filter((image) => image.pinned);
      if (!pinned.length) return [];
      return pinned.slice(0, 2).map((image) => ({
        id: `${event.id}-${image.id}`,
        slug: event.slug,
        title: event.title,
        url: image.url,
        alt: image.alt,
        caption: image.caption,
      }));
    })
    .filter((tile) => classifyMediaUrl(tile.url, hosts).ok)
    .slice(0, 4);

  return (
    <div className="flex flex-col justify-between">
      <div className="flex items-end justify-between gap-4 border-b border-ink/80 pb-4">
        <div>
          <p className="kicker text-muted">Photographs</p>
          <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] leading-none text-ink mt-1">
            From the <span className="italic text-accent">Gallery</span>
          </h2>
        </div>
        <Link
          href="/gallery"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-accent transition group"
        >
          <span>All photographs</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {tiles.length ? (
        <div className="mt-8 grid grid-cols-2 gap-4">
          {tiles.map((tile, index) => {
            const classified = classifyMediaUrl(tile.url, hosts);
            if (!classified.ok) return null;

            return (
              <RevealOnScroll key={tile.id} delay={index * 70}>
                <Link
                  href={`/gallery#gallery-${tile.slug}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-line/80 bg-wash shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={classified.url}
                    alt={tile.alt || tile.title}
                    className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-108"
                    loading="lazy"
                  />

                  {/* Dark gradient overlay & Title */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity flex flex-col justify-end p-4">
                    <span className="text-[10px] uppercase tracking-wider text-gold font-bold">
                      {tile.title}
                    </span>
                    <p className="mt-0.5 text-xs font-medium text-white line-clamp-1">
                      {tile.caption || "View in gallery ↗"}
                    </p>
                  </div>

                  <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 size={12} />
                  </div>
                </Link>
              </RevealOnScroll>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4">
          {["Events", "Campus Life"].map((label, index) => (
            <RevealOnScroll key={label} delay={index * 90}>
              <div className="rounded-2xl border border-dashed border-line bg-wash/30 p-8 flex flex-col justify-between aspect-[4/3]">
                <span className="font-display text-4xl italic text-accent">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p className="kicker text-muted">{label}</p>
                  <p className="mt-1 text-xs text-muted">Pinned photos appear here once published.</p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      )}
    </div>
  );
}
