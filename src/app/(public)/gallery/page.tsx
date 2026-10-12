import type { Metadata } from "next";
import Link from "next/link";
import { GalleryView } from "@/components/gallery/gallery-view";
import { formatEventDate } from "@/lib/data/catalog";
import { classifyMediaUrl } from "@/lib/media/url";
import { presentVideo } from "@/lib/media/video";
import { getPublicCatalog } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photographs and media from published campus events.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const catalog = await getPublicCatalog();
  const groups = catalog.events.flatMap((event) => {
    if (!event.images.length) return [];
    const images = event.images.filter((image) => classifyMediaUrl(image.url, catalog.mediaHosts).ok);
    return [
      {
        event,
        images,
        placeholder: images.length ? null : "Photograph not available yet.",
      },
    ];
  });

  const past = catalog.events
    .filter((event) => event.eventStatus === "completed" && !event.isSample)
    .filter((event) => event.images.length || event.videoUrl);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <p className="text-sm text-accent">Photographs</p>
      <h1 className="font-display mt-3 text-5xl text-ink md:text-6xl">Gallery</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-muted">
        Images are grouped by event. An event leaves this page when its photographs are removed.
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

      {past.length ? (
        <section className="mt-16 border-t border-line pt-12">
          <p className="text-sm text-accent">Past events</p>
          <h2 className="font-display mt-3 text-4xl text-ink">Finished activities</h2>
          <p className="mt-3 max-w-xl text-base leading-7 text-muted">
            Photographs and videos from completed events and competitions.
          </p>
          <ul className="mt-8 grid gap-6 md:grid-cols-2">
            {past.map((event) => {
              const video = presentVideo(event.videoUrl);
              const cover = event.images.find((image) => classifyMediaUrl(image.url, catalog.mediaHosts).ok);
              return (
                <li key={event.id} className="overflow-hidden rounded-2xl border border-line bg-white">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover.url} alt={cover.alt} className="aspect-[16/10] w-full object-cover" loading="lazy" />
                  ) : null}
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted">
                      {formatEventDate(event.eventDate) ?? "Date open"}
                      {event.listing === "competition" ? " · Competition" : ""}
                    </p>
                    <h3 className="font-display mt-2 text-2xl text-ink">
                      <Link href={`/events/${event.slug}`}>{event.title}</Link>
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{event.shortDescription}</p>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm">
                      <Link href={`/events/${event.slug}`} className="text-accent">
                        Open page
                      </Link>
                      {video?.kind === "link" ? (
                        <a href={video.href} className="text-accent" rel="noopener noreferrer" target="_blank">
                          Watch video
                        </a>
                      ) : null}
                    </div>
                    {video && video.kind !== "link" ? (
                      <iframe
                        className="mt-4 aspect-video w-full rounded-xl border border-line"
                        src={video.src}
                        title={`${event.title} video`}
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
