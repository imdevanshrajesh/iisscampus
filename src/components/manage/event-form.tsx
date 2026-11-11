"use client";

import { useActionState, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, Bell, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { saveEvent, type ActionState } from "@/lib/manage/actions";
import { FormAutoSave } from "@/components/manage/form-auto-save";
import { ImageUrlHint } from "@/components/manage/image-url-hint";
import { ImageUploader } from "@/components/manage/image-uploader";
import { MassImageUploader } from "@/components/manage/mass-image-uploader";
import { ResourceRepeater } from "@/components/manage/resource-repeater";
import { EventAiCopilot } from "@/components/manage/event-ai-copilot";
import { IMAGE_URL_EXAMPLE } from "@/lib/media/guide";
import { classifyMediaUrl } from "@/lib/media/url";
import type {
  Announcement,
  CampusEvent,
  CampusRole,
  Category,
  ContentResource,
  ParticipatingGroup,
  ScheduleItem,
} from "@/lib/types";

type ImageDraft = {
  url: string;
  alt: string;
  caption: string;
  attribution: string;
  pinned: boolean;
};

const fieldClass =
  "w-full rounded-lg border border-line bg-[#fbfaf4] px-3 py-2.5 text-sm outline-none transition-colors focus:border-navy focus:bg-white";

export function EventForm({
  event,
  categories,
  events,
  role,
  mediaHosts,
  announcements = [],
}: {
  event: CampusEvent | null;
  categories: Category[];
  events: CampusEvent[];
  role: CampusRole;
  mediaHosts: string[];
  announcements?: Announcement[];
}) {
  const [state, action, pending] = useActionState(saveEvent, {} as ActionState);
  const [title, setTitle] = useState(event?.title ?? "");
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(event));
  const [coverUrl, setCoverUrl] = useState(event?.coverImageUrl ?? "");
  const [coverAlt, setCoverAlt] = useState(event?.coverAlt ?? event?.title ?? "");
  const [coverAltEdited, setCoverAltEdited] = useState(Boolean(event?.coverAlt));
  const [coverFailed, setCoverFailed] = useState(false);
  const [listing, setListing] = useState(event?.listing ?? "event");
  const [images, setImages] = useState<ImageDraft[]>(
    event?.images.map((image) => ({
      url: image.url,
      alt: image.alt,
      caption: image.caption ?? "",
      attribution: image.attribution ?? "",
      pinned: Boolean(image.pinned),
    })) ?? [],
  );
  const [schedule, setSchedule] = useState<ScheduleItem[]>(event?.schedule ?? []);
  const [groups, setGroups] = useState<ParticipatingGroup[]>(event?.groups ?? []);
  const [resources, setResources] = useState<ContentResource[]>(event?.resources ?? []);
  const [registrationEnabled, setRegistrationEnabled] = useState(Boolean(event?.registrationEnabled));
  const [pushToArigo, setPushToArigo] = useState(Boolean(event?.pushToArigo));
  const [registrationUrl, setRegistrationUrl] = useState(event?.registrationUrl ?? "");
  const [registrationProvider, setRegistrationProvider] = useState<"arigo" | "page" | "google_form">(
    event?.registrationProvider === "page" || event?.registrationProvider === "google_form"
      ? event.registrationProvider
      : "arigo",
  );
  const [registrationLimit, setRegistrationLimit] = useState(
    event?.registrationLimit != null ? String(event.registrationLimit) : "",
  );
  const [registrationCount, setRegistrationCount] = useState(String(event?.registrationCount ?? 0));
  const limitNumber = Number(registrationLimit);
  const countNumber = Number(registrationCount);
  const limitSet = registrationLimit.trim() !== "" && Number.isFinite(limitNumber) && limitNumber > 0;
  const registrationFull = limitSet && Number.isFinite(countNumber) && countNumber >= limitNumber;
  const locked =
    role === "editor" &&
    (event?.publicationStatus === "published" || event?.publicationStatus === "archived");
  const cover = classifyMediaUrl(coverUrl, mediaHosts);
  const linkedNotices = event ? announcements.filter((a) => a.eventId === event.id) : [];

  const [shortDescription, setShortDescription] = useState(event?.shortDescription ?? "");
  const [fullDescription, setFullDescription] = useState(event?.fullDescription ?? "");
  const [categoryId, setCategoryId] = useState(event?.categoryId ?? categories[0]?.id ?? "");
  const [hostName, setHostName] = useState(event?.hostName ?? "");
  const [locationName, setLocationName] = useState(event?.locationName ?? "");
  const [locationMapUrl, setLocationMapUrl] = useState(event?.locationMapUrl ?? "");
  const [eventDate, setEventDate] = useState(event?.eventDate ?? "");
  const [endDate, setEndDate] = useState(event?.endDate ?? "");
  const [startTime, setStartTime] = useState(event?.startTime ?? "");
  const [endTime, setEndTime] = useState(event?.endTime ?? "");
  const [gradeFrom, setGradeFrom] = useState(event?.gradeFrom != null ? String(event.gradeFrom) : "");
  const [gradeTo, setGradeTo] = useState(event?.gradeTo != null ? String(event.gradeTo) : "");
  const [feeAed, setFeeAed] = useState(event?.feeAed != null ? String(event.feeAed) : "");
  const [capacity, setCapacity] = useState(event?.capacity != null ? String(event.capacity) : "");
  const [packingList, setPackingList] = useState(event?.packingList ?? "");
  const [purpose, setPurpose] = useState(event?.purpose ?? "");
  const [activities, setActivities] = useState(event?.activities ?? "");
  const [eventStatus, setEventStatus] = useState(event?.eventStatus ?? "");
  const [clientError, setClientError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [createdEventId, setCreatedEventId] = useState<string>("");
  const activeEventId = event?.id ?? createdEventId;
  const [pinBatchOnGallery, setPinBatchOnGallery] = useState<boolean>(false);

  const missingRequiredFields: string[] = [];
  if (!title.trim() || title.trim().length < 2) missingRequiredFields.push("Title (min 2 characters)");
  if (!slug.trim() || slug.trim().length < 2) missingRequiredFields.push("Address slug (min 2 characters)");
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) missingRequiredFields.push("Address slug format (lowercase letters, numbers, and hyphens only)");
  if (!categoryId.trim()) missingRequiredFields.push("Primary category");
  if (!shortDescription.trim() || shortDescription.trim().length < 10) missingRequiredFields.push("Short description (min 10 characters)");
  if (!fullDescription.trim() || fullDescription.trim().length < 20) missingRequiredFields.push("Full description (min 20 characters)");
  if (listing === "external" && !hostName.trim()) missingRequiredFields.push("Host school name");
  if (coverUrl.trim() && !coverAlt.trim() && !title.trim()) missingRequiredFields.push("Event Title (used for cover image alternative text)");
  if (registrationEnabled) {
    if (registrationProvider === "arigo" && !pushToArigo) missingRequiredFields.push("Push to Arigo (required for Arigo)");
    if ((registrationProvider === "page" || registrationProvider === "google_form") && !registrationUrl.trim()) missingRequiredFields.push("Registration link or path");
  }

  const isFormValid = missingRequiredFields.length === 0;

  const handleAiApply = (fields: Record<string, any>) => {
    if (fields.title) {
      setTitle(fields.title);
      setSlug(fields.slug || slugify(fields.title));
      setSlugEdited(true);
      if (!coverAltEdited || !coverAlt.trim()) {
        setCoverAlt(fields.title);
      }
    }
    if (fields.shortDescription) setShortDescription(fields.shortDescription);
    if (fields.fullDescription) setFullDescription(fields.fullDescription);
    if (fields.categoryId) setCategoryId(fields.categoryId);
    if (fields.listing) setListing(fields.listing);
    if (fields.hostName) setHostName(fields.hostName);
    if (fields.locationName) setLocationName(fields.locationName);
    if (fields.locationMapUrl) setLocationMapUrl(fields.locationMapUrl);
    if (fields.eventDate) setEventDate(fields.eventDate);
    if (fields.endDate) setEndDate(fields.endDate);
    if (fields.startTime) setStartTime(fields.startTime);
    if (fields.endTime) setEndTime(fields.endTime);
    if (fields.gradeFrom != null) setGradeFrom(String(fields.gradeFrom));
    if (fields.gradeTo != null) setGradeTo(String(fields.gradeTo));
    if (fields.feeAed != null) setFeeAed(String(fields.feeAed));
    if (fields.capacity != null) setCapacity(String(fields.capacity));
    if (fields.packingList) setPackingList(fields.packingList);
    if (fields.purpose) setPurpose(fields.purpose);
    if (fields.activities) setActivities(fields.activities);
    if (fields.eventStatus) setEventStatus(fields.eventStatus);
    if (Array.isArray(fields.schedule) && fields.schedule.length > 0) {
      setSchedule(fields.schedule);
    }
    setOpenPanels((prev) => ({
      ...prev,
      event: true,
      venue: true,
      programme: true,
    }));
  };

  const ALL_PANEL_IDS = ["event", "venue", "cover", "gallery", "programme", "registration", "links", "notices"];
  // Event Details open by default so essential required fields are visible immediately
  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>(() => ({ event: true }));

  const togglePanel = (id: string) => {
    setOpenPanels((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAllPanels = () => {
    const map: Record<string, boolean> = {};
    for (const id of ALL_PANEL_IDS) map[id] = true;
    setOpenPanels(map);
  };

  const collapseAllPanels = () => {
    setOpenPanels({});
  };

  const allPanelsCollapsed = Object.values(openPanels).every((v) => !v);

  function updateImage(index: number, patch: Partial<ImageDraft>) {
    setImages((current) => current.map((image, imageIndex) => (imageIndex === index ? { ...image, ...patch } : image)));
  }

  function moveImage(index: number, direction: number) {
    setImages((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!isFormValid) {
      e.preventDefault();
      if (!title.trim() || title.trim().length < 2 || !slug.trim() || !categoryId.trim() || shortDescription.trim().length < 10 || fullDescription.trim().length < 20 || (listing === "external" && !hostName.trim())) {
        setOpenPanels((prev) => ({ ...prev, event: true }));
      } else if (coverUrl.trim() && !coverAlt.trim() && !title.trim()) {
        setOpenPanels((prev) => ({ ...prev, cover: true }));
      } else if (registrationEnabled) {
        setOpenPanels((prev) => ({ ...prev, registration: true }));
      }
      setClientError(`Please fill in all required fields marked with * before submitting: ${missingRequiredFields.join(", ")}`);
      return;
    }
    if (coverUrl.trim() && !coverAlt.trim() && title.trim()) {
      setCoverAlt(title.trim());
    }
    setClientError(null);
  };

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit} noValidate className="grid gap-5">
      {activeEventId ? <input type="hidden" name="id" value={activeEventId} /> : null}
      <FormAutoSave
        formRef={formRef}
        draftKey={activeEventId ? `event:${activeEventId}` : "event:new"}
        serverAction={saveEvent}
        recordId={activeEventId}
        canAutoSaveServer={isFormValid && !locked}
        disabled={locked}
        externalSuccess={state?.ok}
        externalError={state?.error}
        className="sticky top-2 z-20 rounded-xl border border-line bg-surface/95 px-3.5 py-2 shadow-xs backdrop-blur-xs"
        watchValue={{
          title,
          slug,
          coverUrl,
          coverAlt,
          listing,
          images,
          schedule,
          groups,
          resources,
          registrationEnabled,
          pushToArigo,
          registrationUrl,
          registrationProvider,
          registrationLimit,
          registrationCount,
          shortDescription,
          fullDescription,
          categoryId,
          hostName,
          locationName,
          locationMapUrl,
          eventDate,
          endDate,
          startTime,
          endTime,
          gradeFrom,
          gradeTo,
          feeAed,
          capacity,
          packingList,
          purpose,
          activities,
          eventStatus,
        }}
        onCreatedId={(newId) => {
          setCreatedEventId(newId);
          if (typeof window !== "undefined" && !event?.id) {
            window.history.replaceState(null, "", `/manage/events/${newId}/edit`);
          }
        }}
        onRestoreDraft={(fields) => {
          const first = (key: string) => fields[key]?.[0];
          const parseArr = <T,>(raw: string | undefined): T[] | null => {
            if (!raw) return null;
            try {
              const parsed = JSON.parse(raw);
              return Array.isArray(parsed) ? (parsed as T[]) : null;
            } catch {
              return null;
            }
          };
          if (first("title") !== undefined) setTitle(first("title")!);
          if (first("slug") !== undefined) {
            setSlug(first("slug")!);
            setSlugEdited(true);
          }
          if (first("coverUrl") !== undefined) setCoverUrl(first("coverUrl")!);
          if (first("coverAlt") !== undefined) {
            setCoverAlt(first("coverAlt")!);
            setCoverAltEdited(true);
          }
          if (first("listing") === "event" || first("listing") === "competition" || first("listing") === "external") {
            setListing(first("listing") as typeof listing);
          }
          if (first("shortDescription") !== undefined) setShortDescription(first("shortDescription")!);
          if (first("fullDescription") !== undefined) setFullDescription(first("fullDescription")!);
          if (first("categoryId") !== undefined) setCategoryId(first("categoryId")!);
          if (first("hostName") !== undefined) setHostName(first("hostName")!);
          if (first("locationName") !== undefined) setLocationName(first("locationName")!);
          if (first("locationMapUrl") !== undefined) setLocationMapUrl(first("locationMapUrl")!);
          if (first("eventDate") !== undefined) setEventDate(first("eventDate")!);
          if (first("endDate") !== undefined) setEndDate(first("endDate")!);
          if (first("startTime") !== undefined) setStartTime(first("startTime")!);
          if (first("endTime") !== undefined) setEndTime(first("endTime")!);
          if (first("gradeFrom") !== undefined) setGradeFrom(first("gradeFrom")!);
          if (first("gradeTo") !== undefined) setGradeTo(first("gradeTo")!);
          if (first("feeAed") !== undefined) setFeeAed(first("feeAed")!);
          if (first("capacity") !== undefined) setCapacity(first("capacity")!);
          if (first("packingList") !== undefined) setPackingList(first("packingList")!);
          if (first("purpose") !== undefined) setPurpose(first("purpose")!);
          if (first("activities") !== undefined) setActivities(first("activities")!);
          if (first("eventStatus") !== undefined) setEventStatus(first("eventStatus")!);
          if (first("registrationUrl") !== undefined) setRegistrationUrl(first("registrationUrl")!);
          if (first("registrationLimit") !== undefined) setRegistrationLimit(first("registrationLimit")!);
          if (first("registrationCount") !== undefined) setRegistrationCount(first("registrationCount")!);
          const restoredImages = parseArr<ImageDraft>(first("images"));
          if (restoredImages) setImages(restoredImages);
          const restoredSchedule = parseArr<ScheduleItem>(first("schedule"));
          if (restoredSchedule) setSchedule(restoredSchedule);
          const restoredGroups = parseArr<ParticipatingGroup>(first("groups"));
          if (restoredGroups) setGroups(restoredGroups);
          const restoredResources = parseArr<ContentResource>(first("resources"));
          if (restoredResources) setResources(restoredResources);
        }}
      />
      <input
        type="hidden"
        name="images"
        value={JSON.stringify(
          images
            .filter((image) => image.url.trim())
            .map((image) => ({
              ...image,
              alt: image.alt.trim() || title.trim() || "Event photograph",
            }))
        )}
      />
      <input type="hidden" name="schedule" value={JSON.stringify(schedule.filter((item) => item.time.trim() && item.title.trim()))} />
      <input type="hidden" name="groups" value={JSON.stringify(groups.filter((group) => group.name.trim()))} />
      <input type="hidden" name="resources" value={JSON.stringify(resources.filter((item) => item.title.trim()))} />

      {clientError ? <p className="rounded-xl border border-red-300 bg-red-50 text-red-900 px-4 py-3 text-sm font-medium">{clientError}</p> : null}
      {state.error ? <p className="rounded-xl border border-red-300 bg-red-50 text-red-900 px-4 py-3 text-sm font-medium">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent font-medium">{state.ok}</p> : null}
      {locked ? (
        <p className="text-sm text-muted">
          This record is {event?.publicationStatus}. An administrator needs to change that before an editor can revise it.
        </p>
      ) : null}

      {/* AI Event Copilot */}
      <EventAiCopilot
        event={event}
        categories={categories}
        onApply={handleAiApply}
        onOpenPanel={(panelId) => togglePanel(panelId)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-xs">
        <div>
          <p className="text-xs font-semibold text-ink">Form Sections</p>
          <p className="text-[11px] text-muted">Essential details are open by default; expand other sections to configure venue, cover, and registration.</p>
        </div>
        <div className="flex items-center gap-2">
          {allPanelsCollapsed ? (
            <button
              type="button"
              onClick={expandAllPanels}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-[#fbfaf4] px-3 py-1.5 text-xs font-medium text-ink transition hover:border-navy hover:bg-white"
            >
              <ChevronsUpDown className="h-3.5 w-3.5 text-accent" />
              <span>Expand All Sections</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={collapseAllPanels}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-[#fbfaf4] px-3 py-1.5 text-xs font-medium text-ink transition hover:border-navy hover:bg-white"
            >
              <ChevronsDownUp className="h-3.5 w-3.5 text-accent" />
              <span>Collapse All</span>
            </button>
          )}
        </div>
      </div>

      <fieldset disabled={locked} className="grid gap-5">
        <Panel
          title="Event Details"
          hint="The title, address slug, category, and descriptions."
          badge={title ? <span className="rounded-full bg-navy/5 px-2 py-0.5 text-[10px] font-bold text-navy truncate max-w-[200px]">{title}</span> : null}
          isOpen={Boolean(openPanels.event)}
          onToggle={() => togglePanel("event")}
          hasError={!title.trim() || !slug.trim() || !categoryId.trim() || shortDescription.trim().length < 10 || fullDescription.trim().length < 20}
        >
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          <span>Title <span className="text-red-500 font-bold" title="Required">*</span></span>
          <input name="title" value={title} onChange={(event) => {
            const next = event.target.value;
            setTitle(next);
            if (!slugEdited) setSlug(slugify(next));
            if (!coverAltEdited || !coverAlt.trim() || coverAlt === title) {
              setCoverAlt(next);
            }
          }} required className={fieldClass} placeholder="e.g. Annual Inter-School Science Fair 2026" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          <span>Address Slug <span className="text-red-500 font-bold" title="Required">*</span></span>
          <input name="slug" value={slug} onChange={(event) => {
            setSlugEdited(true);
            setSlug(event.target.value);
          }} required className={fieldClass} placeholder="e.g. annual-inter-school-science-fair-2026" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          <span className="flex items-center justify-between">
            <span>Short Description <span className="text-red-500 font-bold" title="Required">*</span></span>
            <span className={`text-xs ${shortDescription.trim().length >= 10 ? "text-muted" : "text-amber-600 font-medium"}`}>
              {shortDescription.trim().length}/10 min chars
            </span>
          </span>
          <textarea
            name="shortDescription"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            required
            rows={3}
            className={fieldClass}
            placeholder="A punchy 1-2 sentence overview shown on event cards across the website..."
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          <span className="flex items-center justify-between">
            <span>Full Description <span className="text-red-500 font-bold" title="Required">*</span></span>
            <span className={`text-xs ${fullDescription.trim().length >= 20 ? "text-muted" : "text-amber-600 font-medium"}`}>
              {fullDescription.trim().length}/20 min chars
            </span>
          </span>
          <textarea
            name="fullDescription"
            value={fullDescription}
            onChange={(e) => setFullDescription(e.target.value)}
            required
            rows={8}
            className={fieldClass}
            placeholder="Comprehensive description of the event, eligibility, agenda, student guidelines..."
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          Listing
          <select name="listing" value={listing} onChange={(change) => setListing(change.target.value as CampusEvent["listing"])} className={fieldClass}>
            <option value="event">Event</option>
            <option value="competition">Competition we host</option>
            <option value="external">Competition at another school</option>
          </select>
        </label>
        <p className="text-sm text-muted">
          Competitions we host stay on the competitions page. Competitions at another school are listed underneath, for students who want to join.
        </p>
        {listing === "external" ? (
          <fieldset className="grid gap-3 rounded-xl border border-line p-4">
            <legend className="px-1 text-sm font-medium">Where it is hosted</legend>
            <label className="grid gap-1.5 text-sm font-medium text-ink">
              <span>Host School <span className="text-red-500 font-bold" title="Required">*</span></span>
              <input
                name="hostName"
                required
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className={fieldClass}
                placeholder="Name of the school hosting it"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Location
              <input
                name="locationName"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className={fieldClass}
                placeholder="Hall, ground, or city"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Map
              <input
                name="locationMapUrl"
                value={locationMapUrl}
                onChange={(e) => setLocationMapUrl(e.target.value)}
                className={fieldClass}
                placeholder="https://maps.google.com/..."
              />
            </label>
            <p className="text-xs leading-5 text-muted">
              The location is the place name only. The map link pins that school. Paste the long Google Maps link from the address bar, or a maps.app.goo.gl share link.
            </p>
          </fieldset>
        ) : (
          <input type="hidden" name="hostName" value="" />
        )}
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          <span>Primary Category <span className="text-red-500 font-bold" title="Required">*</span></span>
          <select
            name="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={fieldClass}
            required
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm">
          Extra categories
          <select
            name="categoryIds"
            multiple
            defaultValue={(event?.categoryIds ?? []).filter((id) => id !== event?.categoryId)}
            className={`${fieldClass} min-h-28`}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <p className="text-sm text-muted">Hold Ctrl or Cmd to select more than one. The primary category is always included.</p>
        </Panel>

        <Panel
          title="When and Where"
          hint="Start and end days, times, venue, and who can take part."
          badge={event?.eventDate ? <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">{event.eventDate}</span> : null}
          isOpen={Boolean(openPanels.venue)}
          onToggle={() => togglePanel("venue")}
        >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            Start date
            <input
              type="date"
              name="eventDate"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            End date
            <input
              type="date"
              name="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            Start time
            <input
              type="time"
              name="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            End time
            <input
              type="time"
              name="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
        {listing === "external" ? null : (
          <>
            <label className="grid gap-1.5 text-sm">
              Venue
              <input
                name="locationName"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className={fieldClass}
                placeholder="Auditorium"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Map
              <input
                name="locationMapUrl"
                value={locationMapUrl}
                onChange={(e) => setLocationMapUrl(e.target.value)}
                className={fieldClass}
                placeholder="https://www.google.com/maps/place/..."
              />
            </label>
            <p className="text-sm text-muted">
              Venue is only the room name, such as Auditorium. The map link pins the school. Paste the long Google Maps link from the address bar, or a maps.app.goo.gl share link.
            </p>
          </>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            Grade from
            <input
              type="number"
              min={1}
              max={12}
              name="gradeFrom"
              value={gradeFrom}
              onChange={(e) => setGradeFrom(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            Grade to
            <input
              type="number"
              min={1}
              max={12}
              name="gradeTo"
              value={gradeTo}
              onChange={(e) => setGradeTo(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            Fee (AED)
            <input
              type="number"
              min={0}
              step="0.01"
              name="feeAed"
              value={feeAed}
              onChange={(e) => setFeeAed(e.target.value)}
              className={fieldClass}
              placeholder="Blank = not set"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            Places at the venue
            <input
              type="number"
              min={1}
              name="capacity"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
        <p className="text-sm text-muted">Venue places are separate from the registration limit further down.</p>
        <label className="grid gap-1.5 text-sm">
          What to bring
          <textarea
            name="packingList"
            value={packingList}
            onChange={(e) => setPackingList(e.target.value)}
            rows={4}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          Status
          <select
            name="eventStatus"
            value={eventStatus}
            onChange={(e) => setEventStatus(e.target.value as any)}
            className={fieldClass}
          >
            <option value="">Not set</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        {role === "administrator" ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featured" defaultChecked={event?.featured} />
            Feature on the homepage
          </label>
        ) : null}
        </Panel>

        <Panel
          title="Cover Image"
          hint="The main hero photo displayed in cards and page headers."
          badge={coverUrl ? <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Image set</span> : null}
          isOpen={Boolean(openPanels.cover)}
          onToggle={() => togglePanel("cover")}
          hasError={Boolean(coverUrl.trim() && !coverAlt.trim() && !title.trim())}
        >
          <ImageUploader
            name="coverImageUrl"
            value={coverUrl}
            onChange={(url) => {
              setCoverUrl(url);
              setCoverFailed(false);
              if (url && (!coverAlt.trim() || !coverAltEdited)) {
                setCoverAlt(title.trim());
              }
            }}
            folder="Events"
            targetName={`cover-${slug.trim() || title.trim() || "event"}`}
            label="Cover Photograph"
            hint="Uploads directly to your RustFS iissimages bucket. Use the visual framing tool to pick what shows on cards."
            aspectRatio="16:10"
          />
          {coverUrl && !cover.ok ? <p className="text-sm text-muted">{cover.message}</p> : null}
          <label className="grid gap-1.5 text-sm font-medium text-ink">
            <span className="flex items-center justify-between">
              <span>Alternative Text</span>
              <span className="text-[11px] font-normal text-muted">Auto-fills with event name</span>
            </span>
            <input
              name="coverAlt"
              value={coverAlt}
              onChange={(e) => {
                setCoverAltEdited(true);
                setCoverAlt(e.target.value);
              }}
              placeholder={title || "Auto-fills with event name..."}
              className={fieldClass}
            />
            <span className="text-[11px] text-muted font-normal">
              Used for accessibility. Automatically matches the event name so you don't need to type random text.
            </span>
          </label>
          <label className="grid gap-1.5 text-sm">
            Attribution
            <input name="coverAttribution" defaultValue={event?.coverAttribution ?? ""} className={fieldClass} />
          </label>
        </Panel>

        <Panel
          title="Gallery Images"
          hint="Pin photographs to show them on the Gallery page and in the event preview. The order here is the order visitors see."
          badge={<span className="rounded-full bg-navy/5 px-2 py-0.5 text-[10px] font-bold text-navy">{images.length} photo{images.length === 1 ? "" : "s"}</span>}
          isOpen={Boolean(openPanels.gallery)}
          onToggle={() => togglePanel("gallery")}
        >
          <div className="grid gap-3">
            <label className="flex items-center gap-2 text-xs text-ink select-none cursor-pointer">
              <input
                type="checkbox"
                checked={pinBatchOnGallery}
                onChange={(e) => setPinBatchOnGallery(e.target.checked)}
                className="h-4 w-4 accent-navy"
              />
              <span>Pin mass-uploaded photographs to the public Gallery page</span>
            </label>
            <MassImageUploader
              folder="Gallery"
              disabled={locked}
              title="Mass Upload Gallery Photos"
              subtitle="Drop or select multiple photos at once — they automatically optimize, upload, and appear below."
              onImageUploaded={({ url, alt }) => {
                const resolvedAlt = title.trim() || alt || "Event photograph";
                setImages((current) => [
                  ...current,
                  {
                    url,
                    alt: resolvedAlt,
                    caption: "",
                    attribution: "",
                    pinned: pinBatchOnGallery,
                  },
                ]);
              }}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-accent"
              onClick={() =>
                setImages((current) => [
                  ...current,
                  { url: "", alt: title.trim() || "Event photograph", caption: "", attribution: "", pinned: false },
                ])
              }
            >
              <Plus size={16} aria-hidden="true" /> Add single image
            </button>
          </div>
          {images.map((image, index) => {
            const classified = classifyMediaUrl(image.url, mediaHosts);
            return (
              <div key={index} className="grid gap-3 rounded-xl border border-line p-4 bg-wash/20">
                <ImageUploader
                  name={`gallery_${index}`}
                  value={image.url}
                  onChange={(url) => {
                    const nextAlt = image.alt.trim() || title.trim() || "Event photograph";
                    updateImage(index, { url, alt: nextAlt });
                  }}
                  folder="Gallery"
                  targetName={`gallery-${slug.trim() || title.trim() || "event"}-${index + 1}`}
                  label={`Gallery Photograph #${index + 1}`}
                  hint="Upload directly to RustFS or frame the image."
                  aspectRatio="4:3"
                />
                {image.url && !classified.ok ? <p className="text-sm text-muted">{classified.message}</p> : null}
                <label className="grid gap-1.5 text-sm">
                  <span className="flex items-center justify-between">
                    <span>Alternative text</span>
                    <span className="text-[11px] text-muted">Auto-fills with event name</span>
                  </span>
                  <input
                    value={image.alt}
                    onChange={(event) => updateImage(index, { alt: event.target.value })}
                    placeholder={title || "Event name"}
                    className={fieldClass}
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  Caption
                  <input value={image.caption} onChange={(event) => updateImage(index, { caption: event.target.value })} className={fieldClass} />
                </label>
                <label className="grid gap-1.5 text-sm">
                  Attribution
                  <input value={image.attribution} onChange={(event) => updateImage(index, { attribution: event.target.value })} className={fieldClass} />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={image.pinned}
                    onChange={(event) => updateImage(index, { pinned: event.target.checked })}
                  />
                  Pin on Gallery and in the preview
                </label>
                <div className="flex gap-2">
                  <button type="button" aria-label="Move image up" onClick={() => moveImage(index, -1)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line"><ArrowUp size={16} /></button>
                  <button type="button" aria-label="Move image down" onClick={() => moveImage(index, 1)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line"><ArrowDown size={16} /></button>
                  <button type="button" aria-label="Remove image" onClick={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line"><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })}
        </Panel>

        <Panel
          title="Programme, Schedule & Resources"
          hint="Purpose, activities, the running order, and files visitors can open."
          isOpen={Boolean(openPanels.programme)}
          onToggle={() => togglePanel("programme")}
        >
        <label className="grid gap-1.5 text-sm">
          Purpose
          <textarea
            name="purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={4}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          Activities
          <textarea
            name="activities"
            value={activities}
            onChange={(e) => setActivities(e.target.value)}
            rows={4}
            className={fieldClass}
          />
        </label>

        <Repeater
          title="Schedule"
          items={schedule}
          onAdd={() => setSchedule((current) => [...current, { time: "", title: "", detail: "" }])}
          render={(item, index) => (
            <div className="grid gap-3 md:grid-cols-3">
              <input aria-label="Time" value={item.time} onChange={(event) => setSchedule((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, time: event.target.value } : row))} className={fieldClass} />
              <input aria-label="Schedule title" value={item.title} onChange={(event) => setSchedule((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, title: event.target.value } : row))} className={fieldClass} />
              <input aria-label="Schedule detail" value={item.detail ?? ""} onChange={(event) => setSchedule((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, detail: event.target.value } : row))} className={fieldClass} />
            </div>
          )}
          onRemove={(index) => setSchedule((current) => current.filter((_, rowIndex) => rowIndex !== index))}
        />

        <Repeater
          title="Groups"
          items={groups}
          onAdd={() => setGroups((current) => [...current, { name: "", detail: "" }])}
          render={(item, index) => (
            <div className="grid gap-3 md:grid-cols-2">
              <input aria-label="Group name" value={item.name} onChange={(event) => setGroups((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value } : row))} className={fieldClass} />
              <input aria-label="Group detail" value={item.detail ?? ""} onChange={(event) => setGroups((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, detail: event.target.value } : row))} className={fieldClass} />
            </div>
          )}
          onRemove={(index) => setGroups((current) => current.filter((_, rowIndex) => rowIndex !== index))}
        />

        <ResourceRepeater resources={resources} onChange={setResources} folder="Events" />
        </Panel>

        <Panel
          title="Registration & Capacity"
          hint="The due date sits next to the button. When the recorded number reaches the limit, visitors get the other form instead."
          badge={registrationEnabled ? <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Enabled</span> : null}
          isOpen={Boolean(openPanels.registration)}
          onToggle={() => togglePanel("registration")}
          hasError={registrationEnabled && ((registrationProvider === "arigo" && !pushToArigo) || ((registrationProvider === "page" || registrationProvider === "google_form") && !registrationUrl.trim()))}
        >
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="registrationEnabled"
              checked={registrationEnabled}
              onChange={(e) => setRegistrationEnabled(e.target.checked)}
            />
            Show registration
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="pushToArigo"
              checked={pushToArigo}
              onChange={(e) => setPushToArigo(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Push to Arigo {registrationEnabled && registrationProvider === "arigo" ? <span className="text-red-500 font-bold" title="Required when registration uses Arigo">*</span> : null}
              <span className="mt-1 block text-muted">
                Lists this on Arigo as a partnered school event when you publish. Untick to remove it from Arigo.
              </span>
            </span>
          </label>
          <p className="text-sm text-muted">
            With Push to Arigo ticked, Arigo builds the event page from these details when you publish. Register now
            opens that page. Visitors can read it without an account, and Arigo asks them to sign up only when they
            register.
          </p>
          <label className="grid gap-1.5 text-sm font-medium text-ink">
            How to register
            <select
              name="registrationProvider"
              value={registrationProvider ?? "arigo"}
              onChange={(change) => {
                const value = change.target.value;
                if (value === "page" || value === "google_form" || value === "arigo") {
                  setRegistrationProvider(value);
                }
              }}
              className={fieldClass}
            >
              <option value="arigo">Arigo</option>
              <option value="page">Page on this site</option>
              <option value="google_form">Google Form</option>
            </select>
          </label>
          {registrationProvider === "page" || registrationProvider === "google_form" ? (
            <label className="grid gap-1.5 text-sm font-medium text-ink">
              <span>Registration URL or path <span className="text-red-500 font-bold" title="Required">*</span></span>
              <input
                name="registrationUrl"
                value={registrationUrl}
                onChange={(e) => setRegistrationUrl(e.target.value)}
                placeholder={registrationProvider === "page" ? "/events/..." : "https://forms.gle/..."}
                className={fieldClass}
              />
            </label>
          ) : (
            <>
              <input type="hidden" name="registrationUrl" value={registrationUrl} />
              <p className="text-sm text-muted">
                {registrationUrl
                  ? `Register link: ${registrationUrl}`
                  : "The register link is filled in when you publish."}
              </p>
            </>
          )}
          <label className="grid gap-1.5 text-sm">
            Button label
            <input name="registrationLabel" defaultValue={event?.registrationLabel ?? ""} placeholder="Register now" className={fieldClass} />
          </label>
          <label className="grid gap-1.5 text-sm">
            Registration due
            <input type="date" name="registrationDeadline" defaultValue={event?.registrationDeadline ?? ""} className={fieldClass} />
          </label>
          <p className="text-sm text-muted">Shown beside the register button. After this day, registration closes, including the other form.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              Registration limit
              <input
                type="number"
                min={1}
                name="registrationLimit"
                value={registrationLimit}
                onChange={(change) => setRegistrationLimit(change.target.value)}
                placeholder="No limit"
                className={fieldClass}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Registrations so far
              <input
                type="number"
                min={0}
                name="registrationCount"
                value={registrationCount}
                onChange={(change) => setRegistrationCount(change.target.value)}
                className={fieldClass}
              />
            </label>
          </div>
          <p className="text-sm text-muted">
            Update the number as people register. This site does not count Arigo or Google Form responses on its own.
          </p>
          {registrationFull ? (
            <p className="rounded-lg border border-accent/30 bg-wash px-3 py-2 text-sm text-ink">
              This event is at the limit. Visitors will see the other form.
            </p>
          ) : limitSet ? (
            <p className="text-sm text-muted">
              {Math.max(0, limitNumber - (Number.isFinite(countNumber) ? countNumber : 0))} places left on the main registration.
            </p>
          ) : null}
          <label className="grid gap-1.5 text-sm">
            Google Form when full
            <input
              name="overflowRegistrationUrl"
              defaultValue={event?.overflowRegistrationUrl ?? ""}
              placeholder="https://forms.gle/..."
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            Form button label
            <input
              name="overflowRegistrationLabel"
              defaultValue={event?.overflowRegistrationLabel ?? ""}
              placeholder="Register on the form"
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            Instructions
            <textarea name="registrationInstructions" defaultValue={event?.registrationInstructions ?? ""} rows={3} className={fieldClass} />
          </label>
        </Panel>

        <Panel
          title="Links & Related Fixtures"
          hint="External social links and related campus activities."
          isOpen={Boolean(openPanels.links)}
          onToggle={() => togglePanel("links")}
        >
        <label className="grid gap-1.5 text-sm">
          Instagram URL
          <input name="instagramUrl" defaultValue={event?.instagramUrl ?? ""} className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>Video URL (YouTube / Vimeo / Direct Stream)</span>
          <input
            name="videoUrl"
            defaultValue={event?.videoUrl ?? ""}
            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/... or Vimeo"
            className={fieldClass}
          />
          <span className="text-[11px] text-muted">
            Supports YouTube videos, YouTube Shorts, Vimeo links, and direct video URLs. Embeds automatically on the event page.
          </span>
        </label>
        <label className="grid gap-1.5 text-sm">
          Related events
          <select name="relatedIds" multiple defaultValue={event?.relatedIds ?? []} className={`${fieldClass} min-h-28`}>
            {events.filter((item) => item.id !== event?.id).map((item) => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
          </select>
        </label>
        </Panel>

        <Panel
          title="Official Notices & Circulars"
          hint="Urgent bulletins, permission slips, or logistical updates attached directly to this event. They will show prominently on the public event page."
          badge={linkedNotices.length > 0 ? <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">{linkedNotices.length} notice{linkedNotices.length === 1 ? "" : "s"}</span> : null}
          isOpen={Boolean(openPanels.notices)}
          onToggle={() => togglePanel("notices")}
        >
          {event ? (
            <div className="grid gap-3">
              {linkedNotices.length > 0 ? (
                <div className="divide-y divide-line rounded-xl border border-line bg-[#fbfaf4]">
                  {linkedNotices.map((notice) => (
                    <div key={notice.id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block h-2 w-2 rounded-full ${notice.enabled ? "bg-emerald-500" : "bg-muted"}`} />
                          <span className="font-medium text-ink">{notice.title}</span>
                          {!notice.enabled ? (
                            <span className="rounded bg-muted/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted">Disabled</span>
                          ) : null}
                          {notice.resources.length > 0 ? (
                            <span className="text-xs text-muted">({notice.resources.length} resource{notice.resources.length > 1 ? "s" : ""})</span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted">{notice.body}</p>
                      </div>
                      <a
                        href={`/manage/announcements?edit=${notice.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Edit notice
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No campus notices or circulars are currently linked to this event.</p>
              )}

              <div className="pt-1">
                <a
                  href={`/manage/announcements?eventId=${event.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-ink transition-colors hover:border-navy hover:bg-[#fbfaf4]"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Bell className="h-3.5 w-3.5 text-accent" />
                  + Issue Notice for This Event
                  <ArrowUpRight className="h-3 w-3 text-muted" />
                </a>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">
              You can issue and attach official notices, circulars, or permission slips once this event has been created and saved.
            </p>
          )}
        </Panel>
      </fieldset>

      <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white p-3 shadow-[0_8px_30px_rgba(28,36,56,0.08)]">
        {!isFormValid && (
          <div className="w-full flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200/80 px-3 py-2 text-xs text-amber-900">
            <span className="font-bold shrink-0">Required (*):</span>
            <span className="line-clamp-2">Fill in {missingRequiredFields.join(", ")} to submit.</span>
          </div>
        )}
        <button
          type="submit"
          name="intent"
          value="save"
          className="rounded-md bg-navy px-4 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          disabled={locked || pending || !isFormValid}
        >
          {pending ? "Saving..." : event?.publicationStatus === "published" ? "Save changes" : "Save draft"}
        </button>
        {event?.publicationStatus === "draft" ? (
          <button
            type="submit"
            name="intent"
            value="submit"
            className="rounded-md border border-line px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
            disabled={locked || pending || !isFormValid}
          >
            Submit for review
          </button>
        ) : null}
        {role === "administrator" && event ? (
          <>
            <button
              type="submit"
              name="intent"
              value="publish"
              className="rounded-md bg-accent px-4 py-2 text-sm text-accent-ink disabled:opacity-50 disabled:cursor-not-allowed transition"
              disabled={locked || pending || !isFormValid}
            >
              Publish
            </button>
            <button
              type="submit"
              name="intent"
              value="unpublish"
              className="rounded-md border border-line px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
              disabled={locked || pending}
            >
              Unpublish
            </button>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="confirmArchive" value="yes" />
              Confirm archive
            </label>
            <button
              type="submit"
              name="intent"
              value="archive"
              className="rounded-md border border-line px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
              disabled={locked || pending}
            >
              Archive
            </button>
            {event.publicationStatus === "archived" ? (
              <button
                type="submit"
                name="intent"
                value="restore"
                className="rounded-md border border-line px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                disabled={locked || pending}
              >
                Restore to draft
              </button>
            ) : null}
          </>
        ) : null}
        {event ? (
          <a
            href={`/events/${event.slug}?preview=1`}
            className="self-center text-sm text-accent ml-auto"
            rel="noopener noreferrer"
            target="_blank"
          >
            Preview
          </a>
        ) : null}
      </div>
    </form>
  );
}

function Panel({
  title,
  hint,
  badge,
  isOpen,
  onToggle,
  children,
  hasError,
}: {
  title: string;
  hint?: string;
  badge?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  hasError?: boolean;
}) {
  return (
    <section className={`rounded-2xl border ${hasError ? "border-amber-400/80 ring-1 ring-amber-300" : "border-line"} bg-white shadow-[0_1px_0_rgba(20,27,56,0.04)] overflow-hidden transition`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-white hover:bg-[#fbfaf4] transition cursor-pointer select-none border-b border-transparent data-[open=true]:border-line"
        data-open={isOpen}
      >
        <div className="min-w-0 pr-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
            {badge}
          </div>
          {hint ? <p className="mt-0.5 text-xs text-muted leading-5">{hint}</p> : null}
        </div>
        <div className="flex items-center gap-2 text-muted shrink-0">
          <span className="text-xs font-medium">{isOpen ? "Hide" : "Edit"}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-accent transition-transform" />
          ) : (
            <ChevronRight className="h-4 w-4 transition-transform" />
          )}
        </div>
      </button>
      <div className={`p-4 sm:p-5 pt-3 grid gap-4 bg-[#faf9f5]/40 ${isOpen ? "" : "hidden"}`}>{children}</div>
    </section>
  );
}

function Repeater<T>({
  title,
  items,
  onAdd,
  onRemove,
  render,
}: {
  title: string;
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  render: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">{title}</h2>
        <button type="button" onClick={onAdd} className="text-sm text-accent">Add</button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="grid gap-2">
          {render(item, index)}
          <button type="button" onClick={() => onRemove(index)} className="justify-self-start text-xs text-muted">Remove</button>
        </div>
      ))}
    </div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
