"use client";

import { useActionState, useRef, useState } from "react";
import { saveAchievement, type ActionState } from "@/lib/manage/actions";
import { FormAutoSave } from "@/components/manage/form-auto-save";
import { ImageUrlHint } from "@/components/manage/image-url-hint";
import { ImageUploader } from "@/components/manage/image-uploader";
import { ResourceRepeater } from "@/components/manage/resource-repeater";
import { IMAGE_URL_EXAMPLE } from "@/lib/media/guide";
import { classifyMediaUrl } from "@/lib/media/url";
import type { Achievement, CampusRole, Category, CampusEvent, ContentResource } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function AchievementForm({
  achievement,
  categories,
  events,
  role,
  mediaHosts,
}: {
  achievement: Achievement | null;
  categories: Category[];
  events: CampusEvent[];
  role: CampusRole;
  mediaHosts: string[];
}) {
  const [state, action, pending] = useActionState(saveAchievement, {} as ActionState);
  const [title, setTitle] = useState(achievement?.title ?? "");
  const [competitionName, setCompetitionName] = useState(achievement?.competitionName ?? "");
  const [imageUrl, setImageUrl] = useState(achievement?.imageUrl ?? "");
  const [resources, setResources] = useState<ContentResource[]>(achievement?.resources ?? []);
  const [clientError, setClientError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [createdId, setCreatedId] = useState<string>("");
  const activeId = achievement?.id ?? createdId;
  const image = classifyMediaUrl(imageUrl, mediaHosts);
  const locked = role === "editor" && (achievement?.publicationStatus === "published" || achievement?.publicationStatus === "archived");

  const missingFields: string[] = [];
  if (!title.trim() || title.trim().length < 2) missingFields.push("Title (min 2 chars)");
  if (!competitionName.trim() || competitionName.trim().length < 2) missingFields.push("Competition (min 2 chars)");

  const isFormValid = missingFields.length === 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!isFormValid) {
      e.preventDefault();
      setClientError(`Please fill in all required fields marked with * before submitting: ${missingFields.join(", ")}`);
      return;
    }
    setClientError(null);
  };

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit} noValidate className="grid max-w-2xl gap-4">
      {activeId ? <input type="hidden" name="id" value={activeId} /> : null}
      <FormAutoSave
        formRef={formRef}
        draftKey={activeId ? `achievement:${activeId}` : "achievement:new"}
        serverAction={saveAchievement}
        recordId={activeId}
        canAutoSaveServer={isFormValid && !locked}
        disabled={locked}
        externalSuccess={state?.ok}
        externalError={state?.error}
        watchValue={{ title, competitionName, imageUrl, resources }}
        onCreatedId={(newId) => {
          setCreatedId(newId);
          if (typeof window !== "undefined" && !achievement?.id) {
            window.history.replaceState(null, "", `/manage/achievements/${newId}/edit`);
          }
        }}
        onRestoreDraft={(fields) => {
          const first = (key: string) => fields[key]?.[0];
          if (first("title") !== undefined) setTitle(first("title")!);
          if (first("competitionName") !== undefined) setCompetitionName(first("competitionName")!);
          if (first("imageUrl") !== undefined) setImageUrl(first("imageUrl")!);
          const rawRes = first("resources");
          if (rawRes) {
            try {
              const parsed = JSON.parse(rawRes);
              if (Array.isArray(parsed)) setResources(parsed as ContentResource[]);
            } catch {
              // ignore invalid draft resources
            }
          }
        }}
      />
      <input type="hidden" name="resources" value={JSON.stringify(resources.filter((item) => item.title.trim()))} />
      {clientError ? <p className="rounded-xl border border-red-300 bg-red-50 text-red-900 px-4 py-3 text-sm font-medium">{clientError}</p> : null}
      {state.error ? <p className="rounded-xl border border-red-300 bg-red-50 text-red-900 px-4 py-3 text-sm font-medium">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent font-medium">{state.ok}</p> : null}
      <fieldset disabled={locked} className="grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          <span>Title <span className="text-red-500 font-bold" title="Required">*</span></span>
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={fieldClass}
            placeholder="e.g. 1st Place at National Debating Championship"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          <span>Competition <span className="text-red-500 font-bold" title="Required">*</span></span>
          <input
            name="competitionName"
            value={competitionName}
            onChange={(e) => setCompetitionName(e.target.value)}
            required
            className={fieldClass}
            placeholder="e.g. UAE National Debate Championship 2026"
          />
        </label>
        <label className="grid gap-1.5 text-sm">Winner or team, if approved<input name="winnerName" defaultValue={achievement?.winnerName ?? ""} className={fieldClass} /></label>
        <label className="grid gap-1.5 text-sm">Award<input name="award" defaultValue={achievement?.award ?? ""} className={fieldClass} /></label>
        <label className="grid gap-1.5 text-sm">Date<input type="date" name="eventDate" defaultValue={achievement?.eventDate ?? ""} className={fieldClass} /></label>
        <label className="grid gap-1.5 text-sm">Academic year<input name="academicYear" defaultValue={achievement?.academicYear ?? ""} className={fieldClass} /></label>
        <label className="grid gap-1.5 text-sm">
          Category
          <select name="categoryId" defaultValue={achievement?.categoryId ?? ""} className={fieldClass}>
            <option value="">None</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm">
          Related event
          <select name="eventId" defaultValue={achievement?.eventId ?? ""} className={fieldClass}>
            <option value="">None</option>
            {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
          </select>
        </label>
        <ImageUploader
          name="imageUrl"
          value={imageUrl}
          onChange={(url) => setImageUrl(url)}
          folder="Achievements"
          targetName={`achievement-${title.trim() || "award"}`}
          label="Achievement Photograph"
          hint="Upload directly to RustFS or frame the image."
          aspectRatio="4:3"
        />
        {imageUrl && !image.ok ? <p className="text-sm text-muted">{image.message}</p> : null}
        <label className="grid gap-1.5 text-sm">Alternative text<input name="imageAlt" defaultValue={achievement?.imageAlt ?? ""} className={fieldClass} /></label>
        <ResourceRepeater resources={resources} onChange={setResources} folder="Achievements" />
      </fieldset>
      <div className="flex flex-col gap-2">
        {!isFormValid && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200/80 px-3 py-2 text-xs text-amber-900">
            <span className="font-bold shrink-0">Required (*):</span>
            <span>Fill in {missingFields.join(", ")} to submit.</span>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            name="intent"
            value="save"
            disabled={locked || pending || !isFormValid}
            className="rounded-md bg-navy px-4 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {pending ? "Saving..." : achievement?.publicationStatus === "published" ? "Save changes" : "Save draft"}
          </button>
          {role === "administrator" && achievement ? (
            <>
              <button
                type="submit"
                name="intent"
                value="publish"
                disabled={locked || pending || !isFormValid}
                className="rounded-md bg-accent px-4 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Publish
              </button>
              <button
                type="submit"
                name="intent"
                value="unpublish"
                disabled={locked || pending}
                className="rounded-md border border-line px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Unpublish
              </button>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirmArchive" value="yes" />Confirm archive</label>
              <button
                type="submit"
                name="intent"
                value="archive"
                disabled={locked || pending}
                className="rounded-md border border-line px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Archive
              </button>
            </>
          ) : achievement ? (
            <button
              type="submit"
              name="intent"
              value="submit"
              disabled={locked || pending || !isFormValid}
              className="rounded-md border border-line px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Submit for review
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
