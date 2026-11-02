import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetail } from "@/components/events/event-detail";
import { getCampusActor } from "@/lib/auth/session";
import { getStaffWorkspace } from "@/lib/data/staff";
import { achievementsForEvent, getPublicAnnouncements, getPublicEvent } from "@/lib/data/queries";
import { siteConfig } from "@/lib/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { event } = await getPublicEvent(slug);
  if (!event) return { title: "Event" };
  return {
    title: event.title,
    description: event.shortDescription,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      title: event.title,
      description: event.shortDescription,
    },
  };
}

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const { catalog, event } = await getPublicEvent(slug);

  if (event) {
    const allNotices = await getPublicAnnouncements();
    const eventNotices = allNotices.filter((notice) => notice.eventId === event.id);

    return (
      <>
        {event.eventDate && !event.isSample ? (
          <EventJsonLd eventTitle={event.title} description={event.shortDescription} slug={event.slug} />
        ) : null}
        <EventDetail
          event={event}
          events={catalog.events}
          categories={catalog.categories}
          achievements={achievementsForEvent(catalog.achievements, event.id)}
          hosts={catalog.mediaHosts}
          notices={eventNotices}
        />
      </>
    );
  }

  if (first(query.preview) === "1") {
    const actor = await getCampusActor();
    if (actor) {
      const workspace = await getStaffWorkspace();
      const draft = workspace?.events.find((item) => item.slug === slug);
      if (draft && draft.publicationStatus !== "published") {
        const draftNotices = (workspace?.announcements ?? []).filter((notice) => notice.eventId === draft.id);
        return (
          <EventDetail
            event={draft}
            events={workspace?.events ?? []}
            categories={workspace?.categories ?? catalog.categories}
            achievements={achievementsForEvent(workspace?.achievements ?? [], draft.id)}
            hosts={workspace?.mediaHosts ?? []}
            notices={draftNotices}
            preview
          />
        );
      }
    }
  }

  notFound();
}

function EventJsonLd({
  eventTitle,
  description,
  slug,
}: {
  eventTitle: string;
  description: string;
  slug: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: eventTitle,
    description,
    url: `${siteConfig.url}/events/${slug}`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: "India International School, Sharjah",
      address: "Sharjah, United Arab Emirates",
    },
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
