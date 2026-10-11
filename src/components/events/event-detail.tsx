import Link from "next/link";
import { ResourceCards } from "@/components/content/resource-cards";
import { GalleryView } from "@/components/gallery/gallery-view";
import { MediaFrame } from "@/components/media/media-frame";
import { EventCard } from "@/components/events/event-card";
import { categoryById, formatEventDate, paragraphs, relatedPublishedEvents } from "@/lib/data/catalog";
import { classifyMediaUrl, classifyNavigationUrl } from "@/lib/media/url";
import { presentVideo } from "@/lib/media/video";
import { registrationState } from "@/lib/registration";
import type { Achievement, CampusEvent, Category } from "@/lib/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-10">
      <h2 className="text-2xl font-medium tracking-tight">{title}</h2>
      <div className="mt-4 max-w-2xl space-y-4 text-base leading-7 text-ink">{children}</div>
    </section>
  );
}

export function EventDetail({
  event,
  events,
  categories,
  achievements,
  hosts,
  preview = false,
}: {
  event: CampusEvent;
  events: CampusEvent[];
  categories: Category[];
  achievements: Achievement[];
  hosts: readonly string[];
  preview?: boolean;
}) {
  const category = categoryById(categories, event.categoryId);
  const date = formatEventDate(event.eventDate);
  const end = formatEventDate(event.endDate);
  const registration = registrationState(event);
  const instagram = classifyNavigationUrl(event.instagramUrl);
  const video = presentVideo(event.videoUrl);
  const related = relatedPublishedEvents(events, event);
  const results = achievements.filter((item) => item.eventId === event.id && item.publicationStatus === "published");
  const galleryImages = event.images.filter((image) => classifyMediaUrl(image.url, hosts).ok);

  return (
    <article>
      {preview ? (
        <p className="border-b border-line bg-wash px-5 py-3 text-sm text-ink md:px-8">
          This preview is not on the public site.
        </p>
      ) : null}
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:px-8 lg:grid-cols-12 lg:py-16">
        <div className="lg:col-span-5">
          <MediaFrame
            url={event.coverImageUrl}
            alt={event.coverAlt}
            hosts={hosts}
            title={event.title}
            kicker={category?.name}
            priority
          />
          {event.coverAttribution ? (
            <p className="mt-3 text-xs text-muted">{event.coverAttribution}</p>
          ) : null}
        </div>
        <div className="lg:col-span-7 lg:pt-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
            {[category?.name, event.isSample ? "Sample" : null, event.eventStatus && !event.isSample ? event.eventStatus : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <h1 className="font-display mt-4 text-balance text-4xl text-ink md:text-6xl">{event.title}</h1>
          {date ? (
            <p className="mt-5 text-sm text-muted">
              {date}
              {end && end !== date ? ` – ${end}` : ""}
            </p>
          ) : null}
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">{event.shortDescription}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {registration.state === "open" ? (
              <a
                href={registration.href}
                className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink"
                rel="noopener noreferrer"
              >
                {registration.label}
              </a>
            ) : null}
            {registration.state === "closed" ? (
              <p className="text-sm text-muted">Registration has closed.</p>
            ) : null}
            {instagram.ok ? (
              <a href={instagram.url} className="rounded-md border border-line px-4 py-2.5 text-sm" rel="noopener noreferrer">
                Instagram
              </a>
            ) : null}
          </div>
          {registration.state === "open" && event.registrationInstructions ? (
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted">{event.registrationInstructions}</p>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Section title="Overview">
          {paragraphs(event.fullDescription).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Section>
        {event.purpose ? (
          <Section title="Purpose">
            {paragraphs(event.purpose).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Section>
        ) : null}
        {event.activities ? (
          <Section title="Activities">
            {paragraphs(event.activities).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Section>
        ) : null}
        {event.schedule.length ? (
          <Section title="Schedule">
            <ol className="space-y-4">
              {event.schedule.map((item) => (
                <li key={`${item.time}-${item.title}`}>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">{item.time}</p>
                  <p className="mt-1 font-medium">{item.title}</p>
                  {item.detail ? <p className="text-sm text-muted">{item.detail}</p> : null}
                </li>
              ))}
            </ol>
          </Section>
        ) : null}
        {event.groups.length ? (
          <Section title="Participants">
            <ul className="space-y-3">
              {event.groups.map((group) => (
                <li key={group.name}>
                  <p className="font-medium">{group.name}</p>
                  {group.detail ? <p className="text-sm text-muted">{group.detail}</p> : null}
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
        <ResourceCards resources={event.resources} title="Competition details" />
        {results.length ? (
          <Section title="Results">
            <ul className="space-y-4">
              {results.map((result) => (
                <li key={result.id}>
                  <p className="font-medium">{result.title}</p>
                  <p className="text-sm text-muted">
                    {[result.competitionName, result.award, result.winnerName].filter(Boolean).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
        {video ? (
          <Section title="Video">
            {video.kind === "link" ? (
              <a href={video.href} className="text-accent" rel="noopener noreferrer">
                Watch the video
              </a>
            ) : (
              <iframe
                className="aspect-video w-full rounded-xl border border-line"
                src={video.src}
                title={`${event.title} video`}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </Section>
        ) : null}
        <section className="border-t border-line py-10">
          <h2 className="text-2xl font-medium tracking-tight">Photographs</h2>
          <div className="mt-6">
            <GalleryView
              groups={[
                {
                  event,
                  images: galleryImages,
                  placeholder: galleryImages.length
                    ? null
                    : event.isSample
                      ? "Demonstration placeholder. Replace with an approved photograph."
                      : "Photograph not available yet.",
                },
              ]}
              hosts={hosts}
            />
          </div>
        </section>
        {related.length ? (
          <section className="border-t border-line py-10">
            <h2 className="text-2xl font-medium tracking-tight">Related</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {related.map((item) => (
                <EventCard key={item.id} event={item} categories={categories} hosts={hosts} />
              ))}
            </div>
          </section>
        ) : null}
        <p className="border-t border-line py-8 text-sm">
          <Link href="/events" className="text-accent">
            All events
          </Link>
        </p>
      </div>
    </article>
  );
}
