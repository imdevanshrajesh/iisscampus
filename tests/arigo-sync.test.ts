import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildHostedEventPayload,
  campusRegistrationUsesArigo,
  shouldSendEventToArigo,
  type ArigoCampusEvent,
} from "../src/lib/arigo/event-payload.ts";

const eventId = "3f1c2a40-7b2e-4d1a-9c3e-6a8b0d2e4f10";

function event(patch: Partial<ArigoCampusEvent> = {}): ArigoCampusEvent {
  return {
    id: eventId,
    title: "Science fair",
    slug: "science-fair",
    listing: "event",
    shortDescription: "Projects from grades 6 to 8.",
    fullDescription: "Students present a project in the school auditorium.",
    eventDate: "2026-11-12",
    endDate: null,
    startTime: "09:00:00",
    endTime: "12:30",
    locationName: "Auditorium",
    locationMapUrl: "https://maps.google.com/?q=school",
    gradeFrom: 6,
    gradeTo: 8,
    feeAed: 25,
    capacity: 40,
    registrationEnabled: true,
    registrationProvider: "arigo",
    registrationDeadline: "2026-11-01",
    registrationInstructions: "Bring your project board.",
    publicationStatus: "published",
    ...patch,
  };
}

describe("campus event payload for Arigo", () => {
  it("sends published school events with the register page details", () => {
    const body = buildHostedEventPayload(event(), {
      campusOrigin: "https://campus.buildkre.com/",
      hostSlug: "india-international-school",
    });

    assert.equal(body.published, true);
    assert.equal(body.registrationOpen, true);
    assert.equal(body.externalId, eventId);
    assert.equal(body.source, "iisscampus");
    assert.equal(body.listing, "event");
    assert.equal(body.startTime, "09:00");
    assert.equal(body.endTime, "12:30");
    assert.equal(body.venueName, "Auditorium");
    assert.equal(body.campusUrl, "https://campus.buildkre.com/events/science-fair");
    assert.equal(body.details.eventStatus, null);
    assert.equal(body.registrationDeadline, "2026-11-01");
    assert.equal(body.hostSlug, "india-international-school");
  });

  it("sends the campus page details, including a pdf", () => {
    const body = buildHostedEventPayload(
      event({
        purpose: "Raise money for the lab.",
        resources: [
          { title: "Rules", detail: null, href: "https://campus.buildkre.com/rules.pdf", kind: "pdf" },
        ],
        images: [{ url: "https://images.example/photo.jpg", alt: "Hall", caption: null }],
      }),
      { campusOrigin: "https://campus.buildkre.com", hostSlug: "india-international-school" },
    );
    assert.equal(body.details.purpose, "Raise money for the lab.");
    assert.equal(body.details.resources[0]?.kind, "pdf");
    assert.equal(body.details.resources[0]?.href, "https://campus.buildkre.com/rules.pdf");
    assert.equal(body.details.images[0]?.alt, "Hall");
  });

  it("sends a completed campus event as completed", () => {
    const body = buildHostedEventPayload(event({ eventStatus: "completed" }), {
      campusOrigin: "https://campus.buildkre.com",
      hostSlug: "india-international-school",
    });
    assert.equal(body.details.eventStatus, "completed");
    assert.equal(body.slug, "science-fair");
  });

  it("keeps the event visible when registration uses another method", () => {
    const body = buildHostedEventPayload(
      event({ registrationProvider: "google_form", registrationEnabled: true }),
      { campusOrigin: "https://campus.buildkre.com", hostSlug: "india-international-school" },
    );
    assert.equal(body.published, true);
    assert.equal(body.registrationOpen, false);
    assert.equal(campusRegistrationUsesArigo(event({ registrationProvider: "google_form" })), false);
  });

  it("hides drafts and events hosted at another school", () => {
    const draft = buildHostedEventPayload(event({ publicationStatus: "draft" }), {
      campusOrigin: "https://campus.buildkre.com",
      hostSlug: "india-international-school",
    });
    const external = buildHostedEventPayload(event({ listing: "external", publicationStatus: "published" }), {
      campusOrigin: "https://campus.buildkre.com",
      hostSlug: "india-international-school",
    });
    assert.equal(draft.published, false);
    assert.equal(external.published, false);
    assert.equal(external.listing, "event");
  });

  it("notifies Arigo when a published event is saved or taken down", () => {
    assert.equal(shouldSendEventToArigo("draft", "save"), false);
    assert.equal(shouldSendEventToArigo("published", "save"), true);
    assert.equal(shouldSendEventToArigo("published", "publish"), true);
    assert.equal(shouldSendEventToArigo("draft", "unpublish"), true);
    assert.equal(shouldSendEventToArigo("archived", "archive"), true);
  });
});
