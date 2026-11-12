import type { Metadata } from "next";
import { GalleryArchive } from "@/components/gallery/gallery-archive";
import { GalleryView } from "@/components/gallery/gallery-view";
import { classifyMediaUrl } from "@/lib/media/url";
import { getPublicCatalog } from "@/lib/data/queries";
import { hasActiveTerm, matchesAcademicTerm } from "@/lib/terms";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Pinned photographs from published campus events.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const catalog = await getPublicCatalog();
  const termConfigured = hasActiveTerm(catalog.activeTerm);

  const allGroups = catalog.events.flatMap((event) => {
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

  const currentGroups = termConfigured
    ? allGroups.filter((group) =>
        matchesAcademicTerm(
          {
            academicYear: group.event.academicYear,
            eventDate: group.event.eventDate,
            endDate: group.event.endDate,
            createdAt: group.event.createdAt,
          },
          catalog.activeTerm,
        ),
      )
    : allGroups;

  const currentIds = new Set(currentGroups.map((group) => group.event.id));
  const archivedGroups = termConfigured
    ? allGroups.filter((group) => !currentIds.has(group.event.id))
    : [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <p className="text-sm text-accent">Photographs</p>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-5xl text-ink md:text-6xl">Gallery</h1>
        {termConfigured && catalog.activeTerm.label ? (
          <span className="rounded-full border border-line bg-wash/50 px-3 py-1 text-xs font-semibold text-navy">
            {catalog.activeTerm.label}
          </span>
        ) : null}
      </div>
      <p className="mt-4 max-w-xl text-base leading-7 text-muted">
        Selected photographs pinned from published activities. Open an event for the full set and details.
      </p>
      <div className="mt-12">
        {currentGroups.length ? (
          <GalleryView groups={currentGroups} hosts={catalog.mediaHosts} showEventActions />
        ) : (
          <div className="rounded-xl border border-line px-6 py-12">
            <p className="text-lg font-medium">
              {archivedGroups.length
                ? `No pinned photographs in ${catalog.activeTerm.label || "the current term"} yet.`
                : "No pinned photographs yet."}
            </p>
            <p className="mt-2 text-sm text-muted">
              From the content desk, edit an event, tick Pin on Gallery page on a photograph, and publish.
            </p>
          </div>
        )}
      </div>

      <GalleryArchive groups={archivedGroups} hosts={catalog.mediaHosts} showEventActions />
    </div>
  );
}
