"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Image as ImageIcon, Pin, ExternalLink, CheckCircle2 } from "lucide-react";
import { MassImageUploader, type UploadedGalleryImage } from "@/components/manage/mass-image-uploader";
import { appendEventGalleryImageAction } from "@/lib/manage/actions";
import type { CampusEvent, GalleryImage } from "@/lib/types";

type ManageGalleryStudioProps = {
  events: CampusEvent[];
};

export function ManageGalleryStudio({ events }: ManageGalleryStudioProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(() => events[0]?.id ?? "");
  const [pinOnPublicGallery, setPinOnPublicGallery] = useState<boolean>(true);
  const [defaultCaption, setDefaultCaption] = useState<string>("");
  const [defaultAttribution, setDefaultAttribution] = useState<string>("");
  const [extraImagesByEvent, setExtraImagesByEvent] = useState<Record<string, GalleryImage[]>>({});
  const [batchMessage, setBatchMessage] = useState<string>("");

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? events[0] ?? null,
    [events, selectedEventId],
  );

  const mergedImagesFor = (event: CampusEvent): GalleryImage[] => {
    const appended = extraImagesByEvent[event.id] ?? [];
    if (!appended.length) return event.images;
    const seen = new Set(event.images.map((item) => item.id));
    return [...event.images, ...appended.filter((item) => !seen.has(item.id))];
  };

  const selectedImages = selectedEvent ? mergedImagesFor(selectedEvent) : [];

  const handleUploadedPhoto = async (uploaded: UploadedGalleryImage) => {
    if (!selectedEvent) {
      throw new Error("Create an event before uploading gallery photographs.");
    }

    const res = await appendEventGalleryImageAction({
      eventId: selectedEvent.id,
      url: uploaded.url,
      alt: uploaded.alt || `${selectedEvent.title} photograph`,
      caption: defaultCaption.trim() || null,
      attribution: defaultAttribution.trim() || null,
      pinned: pinOnPublicGallery,
    });

    if (res.error || !res.image) {
      throw new Error(res.error || "Could not attach image to the selected event.");
    }

    const savedImage = res.image;
    setExtraImagesByEvent((current) => ({
      ...current,
      [selectedEvent.id]: [...(current[selectedEvent.id] ?? []), savedImage],
    }));
  };

  if (events.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-line bg-surface p-8 text-center">
        <p className="text-sm text-muted">
          No events exist yet. Create an event first, then upload gallery photos in bulk here or inside the event editor.
        </p>
        <Link
          href="/manage/events/new"
          className="mt-4 inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
        >
          Create first event
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8">
      {/* Batch Gallery Uploader */}
      <section className="rounded-2xl border border-line bg-surface p-6 grid gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium text-ink">Mass Upload to Event Gallery</h2>
            <p className="text-sm text-muted mt-0.5">
              Choose an event and drop all your photos at once. Each photo compresses automatically, uploads to RustFS, and attaches to the event immediately.
            </p>
          </div>
          {selectedEvent ? (
            <Link
              href={`/manage/events/${selectedEvent.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-wash"
            >
              <ExternalLink size={13} />
              Edit {selectedEvent.title}
            </Link>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-1.5 text-sm">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
              Target Event
            </span>
            <select
              value={selectedEvent?.id ?? ""}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setBatchMessage("");
              }}
              className="h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink"
            >
              {events.map((event) => {
                const count = mergedImagesFor(event).length;
                return (
                  <option key={event.id} value={event.id}>
                    {event.title} ({count} {count === 1 ? "photo" : "photos"} • {event.publicationStatus})
                  </option>
                );
              })}
            </select>
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
              Batch Caption (optional)
            </span>
            <input
              type="text"
              value={defaultCaption}
              onChange={(e) => setDefaultCaption(e.target.value)}
              placeholder="Applied to every uploaded photo"
              className="h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
              Photographer Credit (optional)
            </span>
            <input
              type="text"
              value={defaultAttribution}
              onChange={(e) => setDefaultAttribution(e.target.value)}
              placeholder="Media team or student credit"
              className="h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink"
            />
          </label>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-ink cursor-pointer select-none">
          <input
            type="checkbox"
            checked={pinOnPublicGallery}
            onChange={(e) => setPinOnPublicGallery(e.target.checked)}
            className="h-4 w-4 accent-navy"
          />
          <Pin size={14} className="text-navy shrink-0" />
          <span>
            Pin uploaded photographs to the public <span className="font-medium">/gallery</span> page
          </span>
        </label>

        {batchMessage ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{batchMessage}</span>
          </div>
        ) : null}

        <MassImageUploader
          folder="Gallery"
          allowFolderChange
          disabled={!selectedEvent}
          title={selectedEvent ? `Upload Photos to "${selectedEvent.title}"` : "Select an event"}
          subtitle="Drag 2, 10, or 50 photos here. Files compress locally before upload and save one-by-one into this event."
          onImageUploaded={handleUploadedPhoto}
          onBatchSettled={({ succeeded, failed }) => {
            if (succeeded > 0 && failed === 0) {
              setBatchMessage(
                `Added ${succeeded} photograph${succeeded === 1 ? "" : "s"} to "${selectedEvent?.title ?? "event"}".`,
              );
            } else if (succeeded > 0) {
              setBatchMessage(
                `Added ${succeeded} photograph${succeeded === 1 ? "" : "s"}; ${failed} failed (click Retry above).`,
              );
            }
          }}
        />

        {/* Selected Event Live Preview Strip */}
        {selectedEvent ? (
          <div className="grid gap-3 border-t border-line pt-4">
            <div className="flex items-center justify-between gap-2 text-xs text-muted">
              <span className="font-medium text-ink flex items-center gap-1.5">
                <ImageIcon size={14} className="text-navy" />
                {selectedEvent.title} ({selectedImages.length} total •{" "}
                {selectedImages.filter((item) => item.pinned).length} pinned on public Gallery)
              </span>
              <Link
                href={`/manage/events/${selectedEvent.id}/edit`}
                className="text-accent hover:underline font-medium"
              >
                Manage captions, pinning &amp; order &rarr;
              </Link>
            </div>

            {selectedImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 md:grid-cols-6">
                {selectedImages.map((image) => (
                  <div
                    key={image.id}
                    className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-wash"
                    title={image.caption || image.alt}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />
                    {image.pinned ? (
                      <span className="absolute top-1.5 right-1.5 rounded-full bg-navy/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-xs">
                        Pinned
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">
                No gallery images on this event yet. Drop photos above to add them right away.
              </p>
            )}
          </div>
        ) : null}
      </section>

      {/* Event Overview List */}
      <section className="grid gap-3">
        <h2 className="text-lg font-medium text-ink">All Event Galleries</h2>
        <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {events.map((event) => {
            const images = mergedImagesFor(event);
            const pinnedCount = images.filter((image) => image.pinned).length;
            const isSelected = event.id === selectedEvent?.id;
            return (
              <div
                key={event.id}
                className={`flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition ${
                  isSelected ? "bg-wash/55" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">{event.title}</p>
                  <p className="text-sm text-muted">
                    {images.length} gallery {images.length === 1 ? "image" : "images"} ({pinnedCount} pinned) &bull;{" "}
                    {event.publicationStatus}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEventId(event.id);
                      setBatchMessage("");
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      isSelected
                        ? "border-navy bg-navy text-white"
                        : "border-line text-ink hover:bg-wash"
                    }`}
                  >
                    {isSelected ? "Selected" : "Select for upload"}
                  </button>
                  <Link href={`/manage/events/${event.id}/edit`} className="text-accent hover:underline">
                    Edit images
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
