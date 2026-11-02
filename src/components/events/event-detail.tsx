import Link from "next/link";
import { ArrowUpRight, Bell, Calendar } from "lucide-react";
import { ResourceCards } from "@/components/content/resource-cards";
import { GalleryView } from "@/components/gallery/gallery-view";
import { MediaFrame } from "@/components/media/media-frame";
import { ActivityFacts } from "@/components/events/activity-facts";
import { EventHighlights } from "@/components/events/event-highlights";
import { RegistrationOffer } from "@/components/events/registration-offer";
import { VenueBlock } from "@/components/events/venue-block";
import { EventCard } from "@/components/events/event-card";
import { formatAnnouncementDate, renderAnnouncementMessage } from "@/lib/announcements";
import { categoryById, eventCategoryIds, paragraphs, relatedPublishedEvents } from "@/lib/data/catalog";
import { classifyMediaUrl, classifyNavigationUrl } from "@/lib/media/url";
import { presentVideo } from "@/lib/media/video";
import type { Achievement, Announcement, CampusEvent, Category } from "@/lib/types";

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
  notices = [],
  preview = false,
}: {
  event: CampusEvent;
  events: CampusEvent[];
  categories: Category[];
  achievements: Achievement[];
  hosts: readonly string[];
  notices?: Announcement[];
  preview?: boolean;
}) {
  const categoryNames = eventCategoryIds(event)
    .map((id) => categoryById(categories, id)?.name)
    .filter(Boolean);
  const primaryCategory = categoryById(categories, event.categoryId);
  const instagram = classifyNavigationUrl(event.instagramUrl);
  const video = presentVideo(event.videoUrl);
  const related = relatedPublishedEvents(events, event);
  const results = achievements.filter((item) => item.eventId === event.id && item.publicationStatus === "published");
  const galleryImages = event.images.filter((image) => classifyMediaUrl(image.url, hosts).ok);
  const listingLabel =
    event.listing === "external"
      ? event.hostName || "Another school"
      : event.listing === "competition"
        ? "Competition"
        : null;

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
            kicker={primaryCategory?.name}
            priority
          />
          {event.coverAttribution ? (
            <p className="mt-3 text-xs text-muted">{event.coverAttribution}</p>
          ) : null}
        </div>
        <div className="lg:col-span-7 lg:pt-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
            {[
              listingLabel,
              categoryNames.join(", ") || null,
              event.eventStatus || null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <h1 className="font-display mt-4 text-balance text-4xl text-ink md:text-6xl">{event.title}</h1>
          {event.listing === "external" && event.hostName ? (
            <p className="mt-4 text-base text-ink">Hosted by {event.hostName}</p>
          ) : null}
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">{event.shortDescription}</p>
          <EventHighlights event={event} />
          {notices.length > 0 ? (
            <div className="mt-4">
              <a
                href="#event-notices"
                className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent hover:text-white"
              >
                <Bell size={13} />
                <span>{notices.length} Official Notice{notices.length === 1 ? "" : "s"} Issued</span>
                <span className="text-[11px] underline opacity-85">Read notice ↓</span>
              </a>
            </div>
          ) : null}
          <RegistrationOffer event={event}>
            {instagram.ok ? (
              <a
                href={instagram.url}
                className="rounded-md border border-line bg-white px-4 py-2.5 text-sm"
                rel="noopener noreferrer"
                target="_blank"
              >
                Instagram
              </a>
            ) : null}
          </RegistrationOffer>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <ActivityFacts event={event} />
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
        {notices.length ? (
          <section id="event-notices" className="border-t border-line py-10 scroll-mt-24">
            <div className="flex items-center gap-2 text-accent">
              <Bell size={20} />
              <h2 className="text-2xl font-medium tracking-tight text-ink">Official Notices &amp; Circulars</h2>
            </div>
            <p className="mt-2 text-sm text-muted">
              Official campus directives, rosters, and administrative bulletins published for this activity.
            </p>

            <div className="mt-6 space-y-4 max-w-3xl">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="rounded-2xl border border-line/90 bg-white/95 p-5 sm:p-6 shadow-xs transition hover:border-accent hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="rounded-full bg-navy/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
                      Official Bulletin
                    </span>
                    {formatAnnouncementDate(notice.createdAt) ? (
                      <span className="text-muted text-[11px] flex items-center gap-1">
                        <Calendar size={11} />
                        {formatAnnouncementDate(notice.createdAt)}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="font-display mt-3 text-xl font-medium text-ink">
                    {notice.title}
                  </h3>

                  {notice.body ? (
                    <div className="mt-3 text-sm leading-relaxed text-ink/85 border-t border-line/50 pt-3">
                      {renderAnnouncementMessage(notice.body)}
                    </div>
                  ) : null}

                  {notice.resources.length ? (
                    <div className="mt-4 pt-3 border-t border-line/60">
                      <ResourceCards resources={notice.resources} title="Notice Downloads &amp; Attachments" />
                    </div>
                  ) : null}

                  <div className="mt-4 pt-3 border-t border-line/50 flex items-center justify-between text-xs">
                    <Link
                      href={`/announcements?open=${notice.id}`}
                      className="font-semibold text-accent hover:underline flex items-center gap-1"
                    >
                      <span>Open on Main Bulletin Board</span>
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
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
              <a href={video.href} className="text-accent" rel="noopener noreferrer" target="_blank">
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
        <section id="photographs" className="border-t border-line py-10 scroll-mt-24">
          <h2 className="text-2xl font-medium tracking-tight">Photographs</h2>
          <div className="mt-6">
            <GalleryView
              groups={[
                {
                  event,
                  images: galleryImages,
                  totalCount: galleryImages.length,
                  placeholder: galleryImages.length
                    ? null
                    : "Photograph not available yet.",
                },
              ]}
              hosts={hosts}
            />
          </div>
        </section>
        {event.locationName || event.locationMapUrl ? (
          <section className="border-t border-line py-10">
            <VenueBlock event={event} className="max-w-xl" />
          </section>
        ) : null}
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
