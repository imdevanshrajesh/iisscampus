"use client";

import { useActionState, useState } from "react";
import { saveAchievement, type ActionState } from "@/lib/manage/actions";
import { classifyMediaUrl } from "@/lib/media/url";
import type { Achievement, CampusRole, Category, CampusEvent } from "@/lib/types";

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
  const [imageUrl, setImageUrl] = useState(achievement?.imageUrl ?? "");
  const image = classifyMediaUrl(imageUrl, mediaHosts);
  const locked = role === "editor" && (achievement?.publicationStatus === "published" || achievement?.publicationStatus === "archived");

  return (
    <form action={action} className="grid max-w-2xl gap-4">
      {achievement ? <input type="hidden" name="id" value={achievement.id} /> : null}
      {state.error ? <p className="text-sm">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
      <fieldset disabled={locked} className="grid gap-4">
        <label className="grid gap-1.5 text-sm">Title<input name="title" defaultValue={achievement?.title} required className={fieldClass} /></label>
        <label className="grid gap-1.5 text-sm">Competition<input name="competitionName" defaultValue={achievement?.competitionName} required className={fieldClass} /></label>
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
        <label className="grid gap-1.5 text-sm">
          Image URL
          <input name="imageUrl" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} className={fieldClass} />
        </label>
        {imageUrl && !image.ok ? <p className="text-sm text-muted">{image.message}</p> : null}
        {image.ok ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.url} alt="" className="aspect-[4/3] max-w-xs rounded-xl object-cover" />
        ) : null}
        <label className="grid gap-1.5 text-sm">Alternative text<input name="imageAlt" defaultValue={achievement?.imageAlt ?? ""} className={fieldClass} /></label>
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <button type="submit" name="intent" value="save" disabled={locked || pending} className="rounded-md bg-navy px-4 py-2 text-sm text-white">{achievement?.publicationStatus === "published" ? "Save changes" : "Save draft"}</button>
        {role === "administrator" && achievement ? (
          <>
            <button type="submit" name="intent" value="publish" className="rounded-md bg-accent px-4 py-2 text-sm text-white">Publish</button>
            <button type="submit" name="intent" value="unpublish" className="rounded-md border border-line px-4 py-2 text-sm">Unpublish</button>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirmArchive" value="yes" />Confirm archive</label>
            <button type="submit" name="intent" value="archive" className="rounded-md border border-line px-4 py-2 text-sm">Archive</button>
          </>
        ) : achievement ? (
          <button type="submit" name="intent" value="submit" className="rounded-md border border-line px-4 py-2 text-sm">Submit for review</button>
        ) : null}
      </div>
    </form>
  );
}
