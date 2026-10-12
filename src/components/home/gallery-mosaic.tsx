import Link from "next/link";
import { RevealOnScroll } from "@/components/home/reveal-on-scroll";
import { MediaFrame } from "@/components/media/media-frame";
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
      }));
    })
    .slice(0, 6)
    .map((tile, index) => ({ ...tile, tall: index % 3 === 1 }));

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-[clamp(2.4rem,4vw,3.5rem)] leading-none text-ink">
          From the <span className="italic">gallery</span>
        </h2>
        <Link href="/gallery" className="text-link text-sm text-ink">
          All photographs
        </Link>
      </div>
      {tiles.length ? (
        <div className="gallery-mosaic mt-6">
          {tiles.map((tile, index) => (
            <RevealOnScroll key={tile.id} className={tile.tall ? "gallery-mosaic__tall" : ""} delay={index * 70}>
              <Link href={`/gallery#gallery-${tile.slug}`} className="gallery-tile block overflow-hidden rounded-2xl">
                <MediaFrame url={tile.url} alt={tile.alt} hosts={hosts} title={tile.title} kicker="Photo" />
                <span className="sr-only">{tile.title}</span>
              </Link>
            </RevealOnScroll>
          ))}
        </div>
      ) : (
        <div className="gallery-mosaic mt-6">
          {["Events", "Council", "Photographs"].map((label, index) => (
            <RevealOnScroll key={label} className={index === 1 ? "gallery-mosaic__tall" : ""} delay={index * 90}>
              <div className="placeholder-card h-full">
                <span className="font-display text-4xl italic text-accent">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p className="kicker text-muted">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/75">Pinned photographs appear once published.</p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      )}
    </div>
  );
}
