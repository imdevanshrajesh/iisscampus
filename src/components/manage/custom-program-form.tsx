"use client";

import { useActionState, useState } from "react";
import { ImageUrlHint } from "@/components/manage/image-url-hint";
import { deleteCustomProgram, saveCustomProgram, type ActionState } from "@/lib/manage/actions";
import { IMAGE_URL_EXAMPLE } from "@/lib/media/guide";
import { classifyMediaUrl } from "@/lib/media/url";
import type { CampusEvent, CustomProgram, CustomProgramLink, CustomProgramPhoto } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

function moveItem<T>(items: T[], index: number, delta: number) {
  const next = index + delta;
  if (next < 0 || next >= items.length) return items;
  const copy = [...items];
  const [item] = copy.splice(index, 1);
  if (!item) return items;
  copy.splice(next, 0, item);
  return copy;
}

export function CustomProgramForm({
  program,
  events,
  mediaHosts,
}: {
  program: CustomProgram | null;
  events: CampusEvent[];
  mediaHosts: string[];
}) {
  const [state, action, pending] = useActionState(saveCustomProgram, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteCustomProgram, {} as ActionState);
  const [photos, setPhotos] = useState<CustomProgramPhoto[]>(program?.photos ?? []);
  const [links, setLinks] = useState<CustomProgramLink[]>(program?.links ?? []);

  const photoPayload = photos.filter((photo) => photo.url.trim() && photo.alt.trim());
  const linkPayload = links.filter((link) => link.label.trim() && link.url.trim());

  return (
    <div className="grid gap-4 rounded-xl border border-line p-4">
      <form action={action} className="grid gap-3">
        {program ? <input type="hidden" name="id" value={program.id} /> : null}
        <input type="hidden" name="photos" value={JSON.stringify(photoPayload)} />
        <input type="hidden" name="links" value={JSON.stringify(linkPayload)} />
        <label className="grid gap-1.5 text-sm">
          Title
          <input name="title" defaultValue={program?.title ?? ""} required maxLength={120} className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm">
          Summary
          <textarea
            name="summary"
            defaultValue={program?.summary ?? ""}
            rows={4}
            maxLength={4000}
            className={fieldClass}
          />
        </label>
        <div className="grid gap-3 md:grid-cols-[8rem_1fr]">
          <label className="grid gap-1.5 text-sm">
            Order
            <input type="number" name="sortOrder" defaultValue={program?.sortOrder ?? 0} className={fieldClass} />
          </label>
          <label className="grid gap-1.5 text-sm">
            Related event
            <select name="eventId" defaultValue={program?.eventId ?? ""} className={fieldClass}>
              <option value="">None</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-[12rem_1fr]">
          <label className="grid gap-1.5 text-sm">
            Website label
            <input
              name="websiteLabel"
              defaultValue={program?.websiteLabel ?? ""}
              maxLength={80}
              placeholder="Website"
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            Main website
            <input
              name="websiteUrl"
              defaultValue={program?.websiteUrl ?? ""}
              placeholder="https://"
              className={fieldClass}
            />
          </label>
        </div>

        <div className="grid gap-3 border-t border-line pt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Photos</h2>
            <button
              type="button"
              className="text-sm text-accent"
              onClick={() => setPhotos([...photos, { url: "", alt: "" }])}
            >
              Add photo
            </button>
          </div>
          <ImageUrlHint />
          {photos.map((photo, index) => {
            const image = photo.url ? classifyMediaUrl(photo.url, mediaHosts) : null;
            return (
              <div key={index} className="grid gap-3 rounded-xl border border-line p-4">
                <label className="grid gap-1.5 text-sm">
                  Image URL
                  <input
                    value={photo.url}
                    onChange={(event) =>
                      setPhotos(photos.map((item, itemIndex) => (itemIndex === index ? { ...item, url: event.target.value } : item)))
                    }
                    placeholder={IMAGE_URL_EXAMPLE}
                    className={fieldClass}
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  Description
                  <input
                    value={photo.alt}
                    onChange={(event) =>
                      setPhotos(photos.map((item, itemIndex) => (itemIndex === index ? { ...item, alt: event.target.value } : item)))
                    }
                    className={fieldClass}
                  />
                </label>
                {image && !image.ok ? <p className="text-sm text-muted">{image.message}</p> : null}
                {image?.ok ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.url} alt="" className="max-h-48 w-auto max-w-full rounded-xl border border-line object-contain" />
                ) : null}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setPhotos(moveItem(photos, index, -1))} className="text-xs text-muted">
                    Move up
                  </button>
                  <button type="button" onClick={() => setPhotos(moveItem(photos, index, 1))} className="text-xs text-muted">
                    Move down
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, itemIndex) => itemIndex !== index))}
                    className="text-xs text-muted"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 border-t border-line pt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Links</h2>
            <button
              type="button"
              className="text-sm text-accent"
              onClick={() => setLinks([...links, { label: "", url: "" }])}
            >
              Add link
            </button>
          </div>
          {links.map((link, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-line p-4 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                Label
                <input
                  value={link.label}
                  onChange={(event) =>
                    setLinks(links.map((item, itemIndex) => (itemIndex === index ? { ...item, label: event.target.value } : item)))
                  }
                  className={fieldClass}
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                URL
                <input
                  value={link.url}
                  onChange={(event) =>
                    setLinks(links.map((item, itemIndex) => (itemIndex === index ? { ...item, url: event.target.value } : item)))
                  }
                  placeholder="https://"
                  className={fieldClass}
                />
              </label>
              <div className="flex gap-3 md:col-span-2">
                <button type="button" onClick={() => setLinks(moveItem(links, index, -1))} className="text-xs text-muted">
                  Move up
                </button>
                <button type="button" onClick={() => setLinks(moveItem(links, index, 1))} className="text-xs text-muted">
                  Move down
                </button>
                <button
                  type="button"
                  onClick={() => setLinks(links.filter((_, itemIndex) => itemIndex !== index))}
                  className="text-xs text-muted"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={program?.published ?? true} />
          Published
        </label>
        {state.error ? <p className="text-sm">{state.error}</p> : null}
        {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
        <button type="submit" disabled={pending} className="justify-self-start rounded-md bg-navy px-4 py-2 text-sm text-white">
          {program ? "Save" : "Add program"}
        </button>
      </form>
      {program ? (
        <form action={deleteAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={program.id} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="confirm" value="yes" />
            Confirm delete
          </label>
          <button type="submit" disabled={deleting} className="rounded-md border border-line px-3 py-1.5 text-sm">
            Delete
          </button>
          {deleteState.error ? <p className="text-sm">{deleteState.error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
