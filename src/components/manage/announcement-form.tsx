"use client";

import { useActionState, useState, useRef } from "react";
import { Bell, ChevronDown, ChevronRight, MapPin, Paperclip, Plus, Sparkles, HeartHandshake, UploadCloud, RefreshCw } from "lucide-react";
import { ResourceRepeater } from "@/components/manage/resource-repeater";
import { ImageUploader } from "@/components/manage/image-uploader";
import { deleteAnnouncement, saveAnnouncement, type ActionState } from "@/lib/manage/actions";
import type { Announcement, CampusEvent, ContentResource, CustomProgram, WellnessItem } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

const NOTICE_CATEGORIES = [
  "General",
  "Wellness",
  "Awareness Programs",
  "Child Protection & Safety",
  "Academic & Examinations",
  "Student Council Leadership",
  "Athletics & Sports",
  "Campus Code & Protocols",
] as const;

export function AnnouncementForm({
  announcement,
  events = [],
  programs = [],
  wellnessItems = [],
  defaultEventId,
  isOpen: controlledOpen,
  onToggle,
}: {
  announcement: Announcement | null;
  events: CampusEvent[];
  programs?: CustomProgram[];
  wellnessItems?: WellnessItem[];
  defaultEventId?: string | null;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggle = onToggle ?? (() => setInternalOpen((prev) => !prev));

  const [state, action, pending] = useActionState(saveAnnouncement, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteAnnouncement, {} as ActionState);
  const [resources, setResources] = useState<ContentResource[]>(announcement?.resources ?? []);
  const [coverImageUrl, setCoverImageUrl] = useState<string>(announcement?.coverImageUrl ?? "");
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const linkedEvent = events.find((ev) => ev.id === announcement?.eventId);
  const linkedProgram = programs.find((p) => p.id === announcement?.programId);
  const linkedWellness = wellnessItems.find((w) => w.id === announcement?.wellnessId);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      formData.append("folder", "Notices");

      const res = await fetch("/api/manage/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data?.url) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        setResources((prev) => [
          ...prev,
          {
            title: cleanName || "Official Document (PDF)",
            detail: "Official notice document attachment",
            href: data.url,
            kind: "pdf",
          },
        ]);
      } else {
        alert(data?.error || "Could not upload PDF document.");
      }
    } catch {
      alert("Error uploading PDF document. Please check network connection.");
    } finally {
      setUploadingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-white shadow-[0_1px_0_rgba(20,27,56,0.04)] overflow-hidden transition">
      {/* Collapsible Accordion Header */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-white hover:bg-[#fbfaf4] transition cursor-pointer select-none border-b border-transparent data-[open=true]:border-line"
        data-open={isOpen}
      >
        {announcement === null ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/5 text-navy">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">New Council Notice / Blog Post</h2>
              <p className="text-xs text-muted">Draft and publish a circular, blog post, or wellness announcement</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${
                announcement.enabled ? "bg-emerald-500" : "bg-muted"
              }`}
            />
            {announcement.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={announcement.coverImageUrl}
                alt=""
                className="h-9 w-9 rounded-lg object-cover border border-line shrink-0"
              />
            ) : null}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-ink truncate">{announcement.title}</h3>
                {announcement.category ? (
                  <span className="rounded-full bg-navy/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
                    {announcement.category}
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    announcement.enabled ? "bg-emerald-500/10 text-emerald-700" : "bg-muted/15 text-muted"
                  }`}
                >
                  {announcement.enabled ? "Active" : "Hidden"}
                </span>
                {linkedEvent ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent truncate max-w-[180px]">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{linkedEvent.title}</span>
                  </span>
                ) : null}
                {linkedProgram ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 truncate max-w-[180px] border border-emerald-200">
                    <Sparkles className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{linkedProgram.title}</span>
                  </span>
                ) : null}
                {resources.length > 0 ? (
                  <span className="flex items-center gap-1 text-[11px] text-muted">
                    <Paperclip className="h-3 w-3" />
                    {resources.length}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-muted truncate max-w-xl">
                {announcement.body || "No additional text."}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-muted shrink-0 pl-3">
          <span className="text-xs font-medium">{isOpen ? "Close" : announcement ? "Edit" : "Open"}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-accent transition-transform" />
          ) : (
            <ChevronRight className="h-4 w-4 transition-transform" />
          )}
        </div>
      </button>

      {/* Expanded Form Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 pt-3 bg-[#faf9f5]/50 border-t border-line/40 grid gap-4">
          <form action={action} className="grid gap-3">
            {announcement ? <input type="hidden" name="id" value={announcement.id} /> : null}
            <input
              type="hidden"
              name="resources"
              value={JSON.stringify(resources.filter((item) => item.title.trim()))}
            />
            <input type="hidden" name="coverImageUrl" value={coverImageUrl} />

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                Topic / Category
                <select
                  name="category"
                  defaultValue={announcement?.category ?? "General"}
                  className={fieldClass}
                >
                  {NOTICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm">
                Title
                <input
                  name="title"
                  defaultValue={announcement?.title ?? ""}
                  required
                  maxLength={200}
                  className={fieldClass}
                  placeholder="e.g. Child Protection Policy & Student Safety Guidelines"
                />
              </label>
            </div>

            <p className="text-xs text-muted">Formatting: **bold**, *italic*, and [label](https://link).</p>
            <label className="grid gap-1.5 text-sm">
              Article Content / Directive Details
              <textarea
                name="body"
                defaultValue={announcement?.body ?? ""}
                rows={7}
                maxLength={8000}
                className={fieldClass}
                placeholder="Full article text shown on the blog post and when visitors expand the notice card..."
              />
            </label>

            {/* Optional Cover Banner */}
            <div className="pt-1">
              <ImageUploader
                name="noticeCover"
                value={coverImageUrl}
                onChange={setCoverImageUrl}
                folder="Notices"
                label="Cover Photograph / Article Banner (Optional)"
                hint="Visual header banner for the notice / blog post. RustFS supported."
                aspectRatio="16:10"
              />
            </div>

            {/* Direct PDF upload button via RustFS */}
            <div className="rounded-xl border border-line bg-white p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink flex items-center gap-1.5">
                    <Paperclip size={13} className="text-accent" /> Attached Documents &amp; PDFs
                  </h4>
                  <p className="text-[11px] text-muted">
                    Attach circular PDFs, official guidelines, or permission slips using RustFS.
                  </p>
                </div>
                <div>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    disabled={uploadingPdf}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-navy/20 bg-navy/5 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/10 transition cursor-pointer disabled:opacity-50"
                  >
                    {uploadingPdf ? (
                      <RefreshCw size={12} className="animate-spin text-navy" />
                    ) : (
                      <UploadCloud size={12} className="text-navy" />
                    )}
                    <span>{uploadingPdf ? "Uploading PDF..." : "+ Upload PDF via RustFS"}</span>
                  </button>
                </div>
              </div>

              <ResourceRepeater resources={resources} onChange={setResources} />
            </div>

            {/* Linking section */}
            <div className="grid gap-3 sm:grid-cols-3 pt-1">
              <label className="grid gap-1.5 text-sm">
                Linked Activity (Event)
                <select
                  name="eventId"
                  defaultValue={announcement?.eventId ?? defaultEventId ?? ""}
                  className={fieldClass}
                >
                  <option value="">None</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm">
                Linked Program (Awareness / Fun)
                <select
                  name="programId"
                  defaultValue={announcement?.programId ?? ""}
                  className={fieldClass}
                >
                  <option value="">None</option>
                  {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm">
                Linked Wellness Resource
                <select
                  name="wellnessId"
                  defaultValue={announcement?.wellnessId ?? ""}
                  className={fieldClass}
                >
                  <option value="">None</option>
                  {wellnessItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm pt-2">
              <input type="checkbox" name="enabled" defaultChecked={announcement?.enabled ?? true} />
              <span>Show on public notices &amp; blog (Active)</span>
            </label>

            {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
            {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}

            <button
              type="submit"
              disabled={pending}
              className="justify-self-start rounded-md bg-navy px-4 py-2 text-sm text-white transition hover:bg-navy/90 cursor-pointer disabled:opacity-50"
            >
              {pending ? "Saving..." : announcement ? "Save Notice Changes" : "Post Council Notice"}
            </button>
          </form>

          {announcement ? (
            <form action={deleteAction} className="flex flex-wrap items-center gap-3 border-t border-line/60 pt-3">
              <input type="hidden" name="id" value={announcement.id} />
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" name="confirm" value="yes" />
                Confirm delete
              </label>
              <button
                type="submit"
                disabled={deleting}
                className="rounded-md border border-line bg-white px-3 py-1.5 text-sm text-muted hover:text-red-600 transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Notice"}
              </button>
              {deleteState.error ? <p className="text-sm text-red-600">{deleteState.error}</p> : null}
            </form>
          ) : null}
        </div>
      )}
    </div>
  );
}
