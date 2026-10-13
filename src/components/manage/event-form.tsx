"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { saveEvent, type ActionState } from "@/lib/manage/actions";
import { ImageUrlHint } from "@/components/manage/image-url-hint";
import { ResourceRepeater } from "@/components/manage/resource-repeater";
import { IMAGE_URL_EXAMPLE } from "@/lib/media/guide";
import { classifyMediaUrl } from "@/lib/media/url";
import type {
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

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function EventForm({
  event,
  categories,
  events,
  role,
  mediaHosts,
}: {
  event: CampusEvent | null;
  categories: Category[];
  events: CampusEvent[];
  role: CampusRole;
  mediaHosts: string[];
}) {
  const [state, action, pending] = useActionState(saveEvent, {} as ActionState);
  const [title, setTitle] = useState(event?.title ?? "");
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(event));
  const [coverUrl, setCoverUrl] = useState(event?.coverImageUrl ?? "");
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
  const locked =
    role === "editor" &&
    (event?.publicationStatus === "published" || event?.publicationStatus === "archived");
  const cover = classifyMediaUrl(coverUrl, mediaHosts);

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

  return (
    <form action={action} className="grid gap-8">
      {event ? <input type="hidden" name="id" value={event.id} /> : null}
      <input type="hidden" name="images" value={JSON.stringify(images.filter((image) => image.url.trim()))} />
      <input type="hidden" name="schedule" value={JSON.stringify(schedule.filter((item) => item.time.trim() && item.title.trim()))} />
      <input type="hidden" name="groups" value={JSON.stringify(groups.filter((group) => group.name.trim()))} />
      <input type="hidden" name="resources" value={JSON.stringify(resources.filter((item) => item.title.trim()))} />

      {state.error ? <p className="rounded-md border border-line bg-wash px-3 py-2 text-sm">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
      {locked ? (
        <p className="text-sm text-muted">
          This record is {event?.publicationStatus}. An administrator needs to change that before an editor can revise it.
        </p>
      ) : null}

      <fieldset disabled={locked} className="grid gap-5">
        <label className="grid gap-1.5 text-sm">
          Title
          <input name="title" value={title} onChange={(event) => {
            setTitle(event.target.value);
            if (!slugEdited) setSlug(slugify(event.target.value));
          }} required className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm">
          Address
          <input name="slug" value={slug} onChange={(event) => {
            setSlugEdited(true);
            setSlug(event.target.value);
          }} required className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm">
          Short description
          <textarea name="shortDescription" defaultValue={event?.shortDescription} required rows={3} className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm">
          Full description
          <textarea name="fullDescription" defaultValue={event?.fullDescription} required rows={8} className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm">
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
            <label className="grid gap-1.5 text-sm">
              Host school
              <input
                name="hostName"
                required
                defaultValue={event?.hostName ?? ""}
                className={fieldClass}
                placeholder="Name of the school hosting it"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Location
              <input
                name="locationName"
                defaultValue={event?.locationName ?? ""}
                className={fieldClass}
                placeholder="Hall, ground, or city"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Map
              <input
                name="locationMapUrl"
                defaultValue={event?.locationMapUrl ?? ""}
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
        <label className="grid gap-1.5 text-sm">
          Primary category
          <select name="categoryId" defaultValue={event?.categoryId ?? categories[0]?.id} className={fieldClass}>
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
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            Start date
            <input type="date" name="eventDate" defaultValue={event?.eventDate ?? ""} className={fieldClass} />
          </label>
          <label className="grid gap-1.5 text-sm">
            End date
            <input type="date" name="endDate" defaultValue={event?.endDate ?? ""} className={fieldClass} />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            Start time
            <input type="time" name="startTime" defaultValue={event?.startTime ?? ""} className={fieldClass} />
          </label>
          <label className="grid gap-1.5 text-sm">
            End time
            <input type="time" name="endTime" defaultValue={event?.endTime ?? ""} className={fieldClass} />
          </label>
        </div>
        {listing === "external" ? null : (
          <>
            <label className="grid gap-1.5 text-sm">
              Venue
              <input name="locationName" defaultValue={event?.locationName ?? ""} className={fieldClass} placeholder="Auditorium" />
            </label>
            <label className="grid gap-1.5 text-sm">
              Map
              <input name="locationMapUrl" defaultValue={event?.locationMapUrl ?? ""} className={fieldClass} placeholder="https://www.google.com/maps/place/..." />
            </label>
            <p className="text-sm text-muted">
              Venue is only the room name, such as Auditorium. The map link pins the school. Paste the long Google Maps link from the address bar, or a maps.app.goo.gl share link.
            </p>
          </>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            Grade from
            <input type="number" min={1} max={12} name="gradeFrom" defaultValue={event?.gradeFrom ?? ""} className={fieldClass} />
          </label>
          <label className="grid gap-1.5 text-sm">
            Grade to
            <input type="number" min={1} max={12} name="gradeTo" defaultValue={event?.gradeTo ?? ""} className={fieldClass} />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            Fee (AED)
            <input type="number" min={0} step="0.01" name="feeAed" defaultValue={event?.feeAed ?? ""} className={fieldClass} placeholder="Blank = not set" />
          </label>
          <label className="grid gap-1.5 text-sm">
            Places available
            <input type="number" min={1} name="capacity" defaultValue={event?.capacity ?? ""} className={fieldClass} />
          </label>
        </div>
        <label className="grid gap-1.5 text-sm">
          What to bring
          <textarea name="packingList" defaultValue={event?.packingList ?? ""} rows={4} className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm">
          Status
          <select name="eventStatus" defaultValue={event?.eventStatus ?? ""} className={fieldClass}>
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

        <div className="grid gap-3 border-t border-line pt-5">
          <h2 className="text-lg font-medium">Cover image</h2>
          <label className="grid gap-1.5 text-sm">
            Image URL
            <input name="coverImageUrl" value={coverUrl} onChange={(event) => {
              setCoverUrl(event.target.value);
              setCoverFailed(false);
            }} className={fieldClass} placeholder={IMAGE_URL_EXAMPLE} />
          </label>
          <ImageUrlHint />
          {coverUrl && !cover.ok ? <p className="text-sm text-muted">{cover.message}</p> : null}
          {cover.ok ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover.url}
              alt=""
              className="aspect-[4/3] max-w-sm rounded-xl border border-line object-cover"
              onError={() => setCoverFailed(true)}
            />
          ) : null}
          {coverFailed ? (
            <p className="text-sm text-muted">This URL did not load as an image. It may be private, expired, or not a direct image address.</p>
          ) : null}
          <label className="grid gap-1.5 text-sm">
            Alternative text
            <input name="coverAlt" defaultValue={event?.coverAlt ?? ""} className={fieldClass} />
          </label>
          <label className="grid gap-1.5 text-sm">
            Attribution
            <input name="coverAttribution" defaultValue={event?.coverAttribution ?? ""} className={fieldClass} />
          </label>
        </div>

        <div className="grid gap-4 border-t border-line pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Gallery</h2>
              <p className="mt-1 text-sm text-muted">
                Pin photographs to show them on the Gallery page and in the event preview. The order here is the order visitors see.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-accent"
              onClick={() =>
                setImages((current) => [...current, { url: "", alt: "", caption: "", attribution: "", pinned: false }])
              }
            >
              <Plus size={16} aria-hidden="true" /> Add image
            </button>
          </div>
          {images.map((image, index) => {
            const classified = classifyMediaUrl(image.url, mediaHosts);
            return (
              <div key={index} className="grid gap-3 rounded-xl border border-line p-4">
                <label className="grid gap-1.5 text-sm">
                  Image URL
                  <input
                    value={image.url}
                    onChange={(event) => updateImage(index, { url: event.target.value })}
                    className={fieldClass}
                    placeholder={IMAGE_URL_EXAMPLE}
                  />
                </label>
                <ImageUrlHint />
                {image.url && !classified.ok ? <p className="text-sm text-muted">{classified.message}</p> : null}
                {classified.ok ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={classified.url} alt="" className="aspect-[4/3] max-w-xs rounded-lg object-cover" />
                ) : null}
                <label className="grid gap-1.5 text-sm">
                  Alternative text
                  <input value={image.alt} onChange={(event) => updateImage(index, { alt: event.target.value })} className={fieldClass} />
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
        </div>

        <label className="grid gap-1.5 text-sm">
          Purpose
          <textarea name="purpose" defaultValue={event?.purpose ?? ""} rows={4} className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm">
          Activities
          <textarea name="activities" defaultValue={event?.activities ?? ""} rows={4} className={fieldClass} />
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

        <ResourceRepeater resources={resources} onChange={setResources} />

        <fieldset className="grid gap-3 border-t border-line pt-5">
          <legend className="text-lg font-medium">Registration</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="registrationEnabled" defaultChecked={event?.registrationEnabled} />
            Show Register now
          </label>
          <p className="text-sm text-muted">
            Choose Arigo signup, a page on this site, or a Google Form. The public page uses that choice for the Register now button.
          </p>
          <label className="grid gap-1.5 text-sm">
            How to register
            <select name="registrationProvider" defaultValue={event?.registrationProvider ?? "arigo"} className={fieldClass}>
              <option value="arigo">Arigo</option>
              <option value="page">Page on this site</option>
              <option value="google_form">Google Form</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            Registration URL or path
            <input
              name="registrationUrl"
              defaultValue={event?.registrationUrl ?? ""}
              placeholder="Blank for Arigo · /events/... · https://forms.gle/..."
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            Button label
            <input name="registrationLabel" defaultValue={event?.registrationLabel ?? ""} placeholder="Register now" className={fieldClass} />
          </label>
          <label className="grid gap-1.5 text-sm">
            Deadline
            <input type="date" name="registrationDeadline" defaultValue={event?.registrationDeadline ?? ""} className={fieldClass} />
          </label>
          <label className="grid gap-1.5 text-sm">
            Instructions
            <textarea name="registrationInstructions" defaultValue={event?.registrationInstructions ?? ""} rows={3} className={fieldClass} />
          </label>
        </fieldset>

        <label className="grid gap-1.5 text-sm">
          Instagram URL
          <input name="instagramUrl" defaultValue={event?.instagramUrl ?? ""} className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm">
          Video URL
          <input name="videoUrl" defaultValue={event?.videoUrl ?? ""} className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm">
          Related events
          <select name="relatedIds" multiple defaultValue={event?.relatedIds ?? []} className={`${fieldClass} min-h-28`}>
            {events.filter((item) => item.id !== event?.id).map((item) => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
          </select>
        </label>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button type="submit" name="intent" value="save" className="rounded-md bg-navy px-4 py-2 text-sm text-white" disabled={locked}>
          {pending ? "Saving" : event?.publicationStatus === "published" ? "Save changes" : "Save draft"}
        </button>
        {event?.publicationStatus === "draft" ? (
          <button type="submit" name="intent" value="submit" className="rounded-md border border-line px-4 py-2 text-sm" disabled={locked}>
            Submit for review
          </button>
        ) : null}
        {role === "administrator" && event ? (
          <>
            <button type="submit" name="intent" value="publish" className="rounded-md bg-accent px-4 py-2 text-sm text-accent-ink">
              Publish
            </button>
            <button type="submit" name="intent" value="unpublish" className="rounded-md border border-line px-4 py-2 text-sm">
              Unpublish
            </button>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="confirmArchive" value="yes" />
              Confirm archive
            </label>
            <button type="submit" name="intent" value="archive" className="rounded-md border border-line px-4 py-2 text-sm">
              Archive
            </button>
            {event.publicationStatus === "archived" ? (
              <button type="submit" name="intent" value="restore" className="rounded-md border border-line px-4 py-2 text-sm">
                Restore to draft
              </button>
            ) : null}
          </>
        ) : null}
        {event ? (
          <a
            href={`/events/${event.slug}?preview=1`}
            className="self-center text-sm text-accent"
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
    <div className="grid gap-3 border-t border-line pt-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{title}</h2>
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
