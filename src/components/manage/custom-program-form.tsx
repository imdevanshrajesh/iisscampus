"use client";

import { useActionState, useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
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
  isOpen: controlledOpen,
  onToggle,
}: {
  program: CustomProgram | null;
  events: CampusEvent[];
  mediaHosts: string[];
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggle = onToggle ?? (() => setInternalOpen((prev) => !prev));

  const [state, action, pending] = useActionState(saveCustomProgram, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteCustomProgram, {} as ActionState);
  const [photos, setPhotos] = useState<CustomProgramPhoto[]>(program?.photos ?? []);
  const [links, setLinks] = useState<CustomProgramLink[]>(program?.links ?? []);

  const photoPayload = photos.filter((photo) => photo.url.trim() && photo.alt.trim());
  const linkPayload = links.filter((link) => link.label.trim() && link.url.trim());

  return (
    <div className="rounded-2xl border border-line bg-white shadow-[0_1px_0_rgba(20,27,56,0.04)] overflow-hidden transition">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-white hover:bg-[#fbfaf4] transition cursor-pointer select-none border-b border-transparent data-[open=true]:border-line"
        data-open={isOpen}
      >
        {program === null ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/5 text-navy">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Add New Custom Program</h2>
              <p className="text-xs text-muted">Click to draft a custom program card</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${
                program.published ? "bg-emerald-500" : "bg-muted"
              }`}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-ink truncate">{program.title}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    program.published ? "bg-emerald-500/10 text-emerald-700" : "bg-muted/15 text-muted"
                  }`}
                >
                  {program.published ? "Published" : "Draft"}
                </span>
                <span className="text-[10px] text-muted">Order #{program.sortOrder}</span>
                {photos.length > 0 ? (
                  <span className="text-[10px] text-muted">· {photos.length} photos</span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-muted truncate max-w-xl">
                {program.summary || "No summary provided."}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-muted shrink-0 pl-3">
          <span className="text-xs font-medium">{isOpen ? "Close" : program ? "Edit" : "Open"}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-accent transition-transform" />
          ) : (
            <ChevronRight className="h-4 w-4 transition-transform" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 pt-3 bg-[#faf9f5]/50 border-t border-line/40 grid gap-4">
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Photos</span>
                <button
                  type="button"
                  onClick={() => setPhotos([...photos, { url: "", alt: "" }])}
                  className="text-xs text-accent"
                >
                  + Add photo
                </button>
              </div>
              <ImageUrlHint />
              {photos.map((photo, index) => {
                const checked = classifyMediaUrl(photo.url, mediaHosts);
                return (
                  <div key={index} className="space-y-2 rounded-lg border border-line bg-background p-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        placeholder={IMAGE_URL_EXAMPLE}
                        value={photo.url}
                        onChange={(e) =>
                          setPhotos(
                            photos.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, url: e.target.value } : item,
                            ),
                          )
                        }
                        className={fieldClass}
                      />
                      <input
                        placeholder="Alt text"
                        value={photo.alt}
                        onChange={(e) =>
                          setPhotos(
                            photos.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, alt: e.target.value } : item,
                            ),
                          )
                        }
                        className={fieldClass}
                      />
                    </div>
                    {photo.url && !checked.ok ? <p className="text-xs text-muted">{checked.message}</p> : null}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPhotos(moveItem(photos, index, -1))}
                        disabled={index === 0}
                        className="text-xs text-muted disabled:opacity-30"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotos(moveItem(photos, index, 1))}
                        disabled={index === photos.length - 1}
                        className="text-xs text-muted disabled:opacity-30"
                      >
                        Down
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Links</span>
                <button
                  type="button"
                  onClick={() => setLinks([...links, { label: "", url: "" }])}
                  className="text-xs text-accent"
                >
                  + Add link
                </button>
              </div>
              {links.map((link, index) => (
                <div key={index} className="space-y-2 rounded-lg border border-line bg-background p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <input
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) =>
                        setLinks(
                          links.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, label: e.target.value } : item,
                          ),
                        )
                      }
                      className={fieldClass}
                    />
                    <input
                      placeholder="https://"
                      value={link.url}
                      onChange={(e) =>
                        setLinks(
                          links.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, url: e.target.value } : item,
                          ),
                        )
                      }
                      className={fieldClass}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setLinks(moveItem(links, index, -1))}
                      disabled={index === 0}
                      className="text-xs text-muted disabled:opacity-30"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinks(moveItem(links, index, 1))}
                      disabled={index === links.length - 1}
                      className="text-xs text-muted disabled:opacity-30"
                    >
                      Down
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
            {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
            {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
            <button
              type="submit"
              disabled={pending}
              className="justify-self-start rounded-md bg-navy px-4 py-2 text-sm text-white transition hover:bg-navy/90"
            >
              {pending ? "Saving..." : program ? "Save changes" : "Add program"}
            </button>
          </form>
          {program ? (
            <form action={deleteAction} className="flex flex-wrap items-center gap-3 border-t border-line/60 pt-3">
              <input type="hidden" name="id" value={program.id} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="confirm" value="yes" />
                Confirm delete
              </label>
              <button
                type="submit"
                disabled={deleting}
                className="rounded-md border border-line bg-white px-3 py-1.5 text-sm text-muted hover:text-red-600 transition"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
              {deleteState.error ? <p className="text-sm text-red-600">{deleteState.error}</p> : null}
            </form>
          ) : null}
        </div>
      )}
    </div>
  );
}
