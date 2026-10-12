import type { Metadata } from "next";
import { GalleryView } from "@/components/gallery/gallery-view";
import { classifyMediaUrl } from "@/lib/media/url";
import { getPublicCatalog } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Pinned photographs from published campus events.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const catalog = await getPublicCatalog();
  const groups = catalog.events.flatMap((event) => {
    const pinned = event.images.filter(
      (image) => image.pinned && classifyMediaUrl(image.url, catalog.mediaHosts).ok,
    );
    if (!pinned.length) return [];
    return [
      {
        event,
        images: pinned,
        totalCount: event.images.filter((image) => classifyMediaUrl(image.url, catalog.mediaHosts).ok).length,
        placeholder: null as string | null,
      },
    ];
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <p className="text-sm text-accent">Photographs</p>
      <h1 className="font-display mt-3 text-5xl text-ink md:text-6xl">Gallery</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-muted">
        Selected photographs pinned from published activities. Open an event for the full set and details.
      </p>
      <div className="mt-12">
        {groups.length ? (
          <GalleryView groups={groups} hosts={catalog.mediaHosts} showEventActions />
        ) : (
          <div className="rounded-xl border border-line px-6 py-12">
            <p className="text-lg font-medium">No pinned photographs yet.</p>
            <p className="mt-2 text-sm text-muted">
              From the content desk, edit an event, tick Pin on Gallery page on a photograph, and publish.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
