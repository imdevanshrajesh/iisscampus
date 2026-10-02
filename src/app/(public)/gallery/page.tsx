import type { Metadata } from "next";
import { GalleryView } from "@/components/gallery/gallery-view";
import { classifyMediaUrl } from "@/lib/media/url";
import { getPublicCatalog } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photographs from published campus events.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const catalog = await getPublicCatalog();
  const groups = catalog.events.map((event) => {
    const images = event.images.filter((image) => classifyMediaUrl(image.url, catalog.mediaHosts).ok);
    return {
      event,
      images,
      placeholder: images.length
        ? null
        : event.isSample
          ? "Demonstration placeholder. Replace with an approved photograph."
          : "Photograph not available yet.",
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Photographs</p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight md:text-5xl">Gallery</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-muted">
        Images are grouped by event. Placeholders stand in until an approved photograph is added.
      </p>
      <div className="mt-12">
        {groups.length ? (
          <GalleryView groups={groups} hosts={catalog.mediaHosts} />
        ) : (
          <div className="rounded-xl border border-line px-6 py-12">
            <p className="text-lg font-medium">No published photographs yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
