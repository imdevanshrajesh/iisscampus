"use client";

import { useActionState, useState, useRef } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  MapPin,
  Paperclip,
  Plus,
  Sparkles,
  HeartHandshake,
  UploadCloud,
  RefreshCw,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Quote,
  Minus,
  Eye,
  PenLine,
  CornerDownLeft,
} from "lucide-react";
import { ResourceRepeater } from "@/components/manage/resource-repeater";
import { ImageUploader } from "@/components/manage/image-uploader";
import { deleteAnnouncement, saveAnnouncement, type ActionState } from "@/lib/manage/actions";
import { renderAnnouncementMessage, stripMarkdown } from "@/lib/announcements";
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
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [body, setBody] = useState(announcement?.body ?? "");
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [resources, setResources] = useState<ContentResource[]>(announcement?.resources ?? []);
  const [coverImageUrl, setCoverImageUrl] = useState<string>(announcement?.coverImageUrl ?? "");
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const isFormValid = title.trim().length >= 2;

  const insertFormatting = (actionType: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = body;
    const selected = text.slice(start, end);

    let replacement = "";
    let nextStart = start;
    let nextEnd = end;

    switch (actionType) {
      case "bold": {
        const val = selected || "bold text";
        replacement = `**${val}**`;
        nextStart = selected ? start : start + 2;
        nextEnd = selected ? start + replacement.length : nextStart + val.length;
        break;
      }
      case "italic": {
        const val = selected || "italic text";
        replacement = `*${val}*`;
        nextStart = selected ? start : start + 1;
        nextEnd = selected ? start + replacement.length : nextStart + val.length;
        break;
      }
      case "underline": {
        const val = selected || "underlined text";
        replacement = `<u>${val}</u>`;
        nextStart = selected ? start : start + 3;
        nextEnd = selected ? start + replacement.length : nextStart + val.length;
        break;
      }
      case "h2": {
        const val = selected || "Section Heading";
        const prefix = start === 0 || text[start - 1] === "\n" ? "" : "\n\n";
        replacement = `${prefix}## ${val}\n`;
        nextStart = start + prefix.length + 3;
        nextEnd = nextStart + val.length;
        break;
      }
      case "h3": {
        const val = selected || "Subheading";
        const prefix = start === 0 || text[start - 1] === "\n" ? "" : "\n\n";
        replacement = `${prefix}### ${val}\n`;
        nextStart = start + prefix.length + 4;
        nextEnd = nextStart + val.length;
        break;
      }
      case "bullet": {
        const content = selected || "Bullet point";
        const lines = content.split("\n");
        replacement = lines.map((l) => (l.trim().startsWith("- ") ? l : `- ${l}`)).join("\n");
        nextStart = start;
        nextEnd = start + replacement.length;
        break;
      }
      case "number": {
        const content = selected || "Numbered step";
        const lines = content.split("\n");
        replacement = lines.map((l, i) => `${i + 1}. ${l.replace(/^\d+[.)]\s*/, "")}`).join("\n");
        nextStart = start;
        nextEnd = start + replacement.length;
        break;
      }
      case "link": {
        const label = selected || "Link description";
        replacement = `[${label}](https://example.com)`;
        nextStart = start + label.length + 3;
        nextEnd = nextStart + 19;
        break;
      }
      case "quote": {
        const val = selected || "Important quote or memo";
        const prefix = start === 0 || text[start - 1] === "\n" ? "" : "\n\n";
        replacement = `${prefix}> ${val}\n`;
        nextStart = start + prefix.length + 2;
        nextEnd = nextStart + val.length;
        break;
      }
      case "divider": {
        const prefix = start === 0 || text[start - 1] === "\n" ? "" : "\n\n";
        replacement = `${prefix}---\n\n`;
        nextStart = start + replacement.length;
        nextEnd = nextStart;
        break;
      }
      case "newline": {
        replacement = "\n";
        nextStart = start + 1;
        nextEnd = nextStart;
        break;
      }
    }

    const nextBody = text.slice(0, start) + replacement + text.slice(end);
    setBody(nextBody);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextStart, nextEnd);
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!isFormValid) {
      e.preventDefault();
      setClientError("Please enter a notice title (at least 2 characters) before posting.");
      return;
    }
    setClientError(null);
  };

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
                {stripMarkdown(announcement.body) || "No additional text."}
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
          <form action={action} onSubmit={handleSubmit} noValidate className="grid gap-3">
            {announcement ? <input type="hidden" name="id" value={announcement.id} /> : null}
            <input
              type="hidden"
              name="resources"
              value={JSON.stringify(resources.filter((item) => item.title.trim()))}
            />
            <input type="hidden" name="coverImageUrl" value={coverImageUrl} />

            {clientError ? <p className="rounded-xl border border-red-300 bg-red-50 text-red-900 px-4 py-3 text-sm font-medium">{clientError}</p> : null}
            {state.error ? <p className="rounded-xl border border-red-300 bg-red-50 text-red-900 px-4 py-3 text-sm font-medium">{state.error}</p> : null}
            {state.ok ? <p className="text-sm text-accent font-medium">{state.ok}</p> : null}

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

              <label className="grid gap-1.5 text-sm font-medium text-ink">
                <span>Title <span className="text-red-500 font-bold" title="Required">*</span></span>
                <input
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={200}
                  className={fieldClass}
                  placeholder="e.g. Child Protection Policy & Student Safety Guidelines"
                />
              </label>
            </div>

            {/* Rich Markdown & Blog Content Editor */}
            <div className="grid gap-2 text-sm pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-ink flex items-center gap-1.5">
                  <PenLine size={15} className="text-accent" />
                  <span>Article Content / Blog &amp; Directive Body</span>
                </span>

                {/* Write vs Preview Tabs */}
                <div className="flex items-center rounded-lg border border-line bg-wash/60 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setEditorTab("write")}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
                      editorTab === "write"
                        ? "bg-white text-ink shadow-2xs font-semibold"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    <PenLine size={13} />
                    <span>Write</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab("preview")}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
                      editorTab === "preview"
                        ? "bg-white text-ink shadow-2xs font-semibold"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    <Eye size={13} />
                    <span>Live Preview</span>
                  </button>
                </div>
              </div>

              {editorTab === "write" ? (
                <div className="space-y-2">
                  {/* Formatting Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-line bg-wash/50 p-1.5 text-xs text-ink/80">
                    <button
                      type="button"
                      title="Bold (**text**)"
                      onClick={() => insertFormatting("bold")}
                      className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-white hover:text-ink hover:shadow-2xs transition"
                    >
                      <Bold size={14} />
                    </button>
                    <button
                      type="button"
                      title="Italic (*text*)"
                      onClick={() => insertFormatting("italic")}
                      className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-white hover:text-ink hover:shadow-2xs transition"
                    >
                      <Italic size={14} />
                    </button>
                    <button
                      type="button"
                      title="Underline (<u>text</u>)"
                      onClick={() => insertFormatting("underline")}
                      className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-white hover:text-ink hover:shadow-2xs transition"
                    >
                      <UnderlineIcon size={14} />
                    </button>

                    <span className="h-4 w-px bg-line/80 mx-1" />

                    <button
                      type="button"
                      title="Heading 2 (## Section)"
                      onClick={() => insertFormatting("h2")}
                      className="inline-flex h-7 px-2 items-center justify-center rounded hover:bg-white hover:text-ink hover:shadow-2xs transition font-semibold text-[11px]"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      title="Heading 3 (### Subsection)"
                      onClick={() => insertFormatting("h3")}
                      className="inline-flex h-7 px-2 items-center justify-center rounded hover:bg-white hover:text-ink hover:shadow-2xs transition font-semibold text-[11px]"
                    >
                      H3
                    </button>

                    <span className="h-4 w-px bg-line/80 mx-1" />

                    <button
                      type="button"
                      title="Bullet List (- item)"
                      onClick={() => insertFormatting("bullet")}
                      className="inline-flex h-7 items-center gap-1 px-2 rounded hover:bg-white hover:text-ink hover:shadow-2xs transition text-[11px]"
                    >
                      <List size={14} />
                      <span className="hidden sm:inline">Bullets</span>
                    </button>
                    <button
                      type="button"
                      title="Numbered List (1. item)"
                      onClick={() => insertFormatting("number")}
                      className="inline-flex h-7 items-center gap-1 px-2 rounded hover:bg-white hover:text-ink hover:shadow-2xs transition text-[11px]"
                    >
                      <ListOrdered size={14} />
                      <span className="hidden sm:inline">Numbers</span>
                    </button>

                    <span className="h-4 w-px bg-line/80 mx-1" />

                    <button
                      type="button"
                      title="Underlined Link ([Text](https://...))"
                      onClick={() => insertFormatting("link")}
                      className="inline-flex h-7 items-center gap-1 px-2 rounded hover:bg-white hover:text-accent hover:shadow-2xs transition text-[11px] font-medium"
                    >
                      <Link2 size={14} />
                      <span>Link</span>
                    </button>
                    <button
                      type="button"
                      title="Blockquote (> quote)"
                      onClick={() => insertFormatting("quote")}
                      className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-white hover:text-ink hover:shadow-2xs transition"
                    >
                      <Quote size={13} />
                    </button>
                    <button
                      type="button"
                      title="Divider line (---)"
                      onClick={() => insertFormatting("divider")}
                      className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-white hover:text-ink hover:shadow-2xs transition"
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      type="button"
                      title="New Line Break"
                      onClick={() => insertFormatting("newline")}
                      className="inline-flex h-7 items-center gap-1 px-2 rounded hover:bg-white hover:text-ink hover:shadow-2xs transition text-[11px]"
                    >
                      <CornerDownLeft size={13} />
                      <span className="hidden sm:inline">Enter</span>
                    </button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    name="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={10}
                    maxLength={30000}
                    className="w-full -mt-2 rounded-b-md border border-t-0 border-line bg-background p-3 text-sm leading-relaxed outline-none focus:border-navy transition font-mono"
                    placeholder="Write your article or directive text here...&#10;&#10;Press Enter to make new lines, or double Enter for new paragraphs.&#10;Add bullet points:&#10;- First bullet point&#10;- Second bullet point&#10;&#10;Add links:&#10;[Read full guide](https://iissboys.com) or bare links https://example.com (will be underlined)."
                  />

                  {/* Helper Cheat Sheet */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-muted">
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-ink">↵ Enter:</span> line break (2× for new paragraph)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-ink">• Bullets:</span> start with <code className="bg-wash px-1 rounded">- </code> or <code className="bg-wash px-1 rounded">* </code>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-ink">1. Numbers:</span> start with <code className="bg-wash px-1 rounded">1. </code>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-ink">🔗 Links:</span> <code className="bg-wash px-1 rounded">[Title](https://...)</code> (auto-underlined)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-ink"><u>U</u> Underline:</span> <code className="bg-wash px-1 rounded">&lt;u&gt;text&lt;/u&gt;</code>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Keep hidden textarea so form submit always contains body */}
                  <textarea
                    name="body"
                    value={body}
                    readOnly
                    tabIndex={-1}
                    className="hidden"
                  />
                  <div className="rounded-xl border border-line/80 bg-white p-5 min-h-[220px] shadow-2xs">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-line/60 text-xs text-muted">
                      <span className="font-semibold text-ink uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Eye size={13} className="text-accent" /> Live Blog Preview
                      </span>
                      <span>Rendered exactly as visitors see it</span>
                    </div>

                    {body.trim() ? (
                      <div className="space-y-4 text-base leading-relaxed text-ink/90">
                        {renderAnnouncementMessage(body)}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-xs italic text-muted">
                        No text entered yet. Switch back to the <strong className="font-semibold text-ink">Write</strong> tab to draft your circular or blog post.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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

            {!isFormValid && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200/80 px-3 py-2 text-xs text-amber-900">
                <span className="font-bold shrink-0">Required (*):</span>
                <span>Enter a notice title (min 2 characters) to post.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={pending || !isFormValid}
              className="justify-self-start rounded-md bg-navy px-4 py-2 text-sm text-white transition hover:bg-navy/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
