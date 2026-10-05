"use client";

import { useActionState, useState } from "react";
import { ImageUrlHint } from "@/components/manage/image-url-hint";
import { saveCouncilYear, type ActionState } from "@/lib/manage/actions";
import { IMAGE_URL_EXAMPLE } from "@/lib/media/guide";
import type { CampusRole, CouncilKind, CouncilYear } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

function isTeacher(role: string) {
  return /^teacher\b/i.test(role.trim());
}

const kinds: { value: CouncilKind; label: string }[] = [
  { value: "current", label: "This year" },
  { value: "upcoming", label: "Coming up" },
  { value: "past", label: "Earlier" },
];

type MemberDraft = { key: string; role: string; name: string; imageUrl: string; imageAlt: string };
type PhotoDraft = { key: string; url: string; alt: string; caption: string };
type PostDraft = {
  key: string;
  title: string;
  body: string;
  publishedOn: string;
  imageUrl: string;
  imageAlt: string;
};

function slugFromLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function CouncilForm({
  year,
  role,
}: {
  year: CouncilYear | null;
  role: CampusRole;
}) {
  const [state, action, pending] = useActionState(saveCouncilYear, {} as ActionState);
  const [label, setLabel] = useState(year?.label ?? "");
  const [slug, setSlug] = useState(year?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(year));
  const [members, setMembers] = useState<MemberDraft[]>(
    year?.members.map((member) => ({
      key: member.id,
      role: member.role,
      name: member.name,
      imageUrl: member.imageUrl ?? "",
      imageAlt: member.imageAlt ?? "",
    })) ?? [],
  );
  const [photos, setPhotos] = useState<PhotoDraft[]>(
    year?.photos.map((photo) => ({
      key: photo.id,
      url: photo.url,
      alt: photo.alt,
      caption: photo.caption ?? "",
    })) ?? [],
  );
  const [posts, setPosts] = useState<PostDraft[]>(
    year?.posts.map((post) => ({
      key: post.id,
      title: post.title,
      body: post.body,
      publishedOn: post.publishedOn ?? "",
      imageUrl: post.imageUrl ?? "",
      imageAlt: post.imageAlt ?? "",
    })) ?? [],
  );
  const locked =
    role === "editor" && (year?.publicationStatus === "published" || year?.publicationStatus === "archived");

  return (
    <form action={action} className="grid max-w-3xl gap-8">
      {year ? <input type="hidden" name="id" value={year.id} /> : null}
      {state.error ? <p className="rounded-md bg-wash px-3 py-2 text-sm">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}

      <fieldset disabled={locked} className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            Year label
            <input
              name="label"
              value={label}
              required
              placeholder="2025–26"
              className={fieldClass}
              onChange={(event) => {
                const next = event.target.value;
                setLabel(next);
                if (!slugTouched) setSlug(slugFromLabel(next));
              }}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            Address
            <input
              name="slug"
              value={slug}
              required
              className={fieldClass}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
            />
          </label>
        </div>
        <label className="grid gap-1.5 text-sm">
          When
          <select name="kind" defaultValue={year?.kind ?? "current"} className={fieldClass}>
            {kinds.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-muted">
          Mark the sitting council as this year. Use coming up for the next council, and earlier for years that have finished.
        </p>
        <label className="grid gap-1.5 text-sm">
          Short note
          <textarea name="summary" defaultValue={year?.summary ?? ""} rows={3} className={fieldClass} />
        </label>
        <label className="grid max-w-32 gap-1.5 text-sm">
          Order
          <input name="sortOrder" type="number" min={0} max={999} defaultValue={year?.sortOrder ?? 0} className={fieldClass} />
        </label>
      </fieldset>

      <section className="grid gap-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">Council posts</h2>
            <p className="mt-1 text-sm text-muted">Role, then name. A photograph is optional and can be added later.</p>
          </div>
          <button
            type="button"
            className="text-sm text-accent"
            disabled={locked}
            onClick={() =>
              setMembers((current) => [...current, { key: crypto.randomUUID(), role: "", name: "", imageUrl: "", imageAlt: "" }])
            }
          >
            Add a post
          </button>
        </div>
        {members.map((member, index) =>
          isTeacher(member.role) ? null : (
          <div key={member.key} className="grid gap-3 rounded-xl border border-line bg-background p-4">
            <input type="hidden" name={`members.${index}.id`} value={member.key} />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                Post
                <input
                  name={`members.${index}.role`}
                  value={member.role}
                  disabled={locked}
                  className={fieldClass}
                  onChange={(event) =>
                    setMembers((current) =>
                      current.map((item) => (item.key === member.key ? { ...item, role: event.target.value } : item)),
                    )
                  }
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                Name
                <input
                  name={`members.${index}.name`}
                  value={member.name}
                  disabled={locked}
                  className={fieldClass}
                  onChange={(event) =>
                    setMembers((current) =>
                      current.map((item) => (item.key === member.key ? { ...item, name: event.target.value } : item)),
                    )
                  }
                />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                Photograph URL
                <input
                  name={`members.${index}.imageUrl`}
                  value={member.imageUrl}
                  disabled={locked}
                  className={fieldClass}
                  placeholder={IMAGE_URL_EXAMPLE}
                  onChange={(event) =>
                    setMembers((current) =>
                      current.map((item) => (item.key === member.key ? { ...item, imageUrl: event.target.value } : item)),
                    )
                  }
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                Photograph description
                <input
                  name={`members.${index}.imageAlt`}
                  value={member.imageAlt}
                  disabled={locked}
                  className={fieldClass}
                  onChange={(event) =>
                    setMembers((current) =>
                      current.map((item) => (item.key === member.key ? { ...item, imageAlt: event.target.value } : item)),
                    )
                  }
                />
              </label>
            </div>
            <div className="flex gap-4 text-sm text-muted">
              <button
                type="button"
                disabled={locked || index === 0}
                onClick={() =>
                  setMembers((current) => {
                    const next = [...current];
                    const [item] = next.splice(index, 1);
                    next.splice(index - 1, 0, item);
                    return next;
                  })
                }
              >
                Move up
              </button>
              <button
                type="button"
                disabled={locked || index === members.length - 1}
                onClick={() =>
                  setMembers((current) => {
                    const next = [...current];
                    const [item] = next.splice(index, 1);
                    next.splice(index + 1, 0, item);
                    return next;
                  })
                }
              >
                Move down
              </button>
              <button
                type="button"
                disabled={locked}
                onClick={() => setMembers((current) => current.filter((item) => item.key !== member.key))}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-3">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-medium">Teachers</h2>
          <button
            type="button"
            className="text-sm text-accent"
            disabled={locked}
            onClick={() =>
              setMembers((current) => [
                ...current,
                { key: crypto.randomUUID(), role: "Teacher", name: "", imageUrl: "", imageAlt: "" },
              ])
            }
          >
            Add a teacher
          </button>
        </div>
        {members.some((member) => isTeacher(member.role)) ? null : (
          <p className="text-sm text-muted">No teachers yet.</p>
        )}
        {members.map((member, index) =>
          isTeacher(member.role) ? (
            <div key={member.key} className="grid gap-3 rounded-xl border border-line bg-background p-4 md:grid-cols-[1fr_auto]">
              <input type="hidden" name={`members.${index}.id`} value={member.key} />
              <input type="hidden" name={`members.${index}.role`} value="Teacher" />
              <input type="hidden" name={`members.${index}.imageUrl`} value="" />
              <input type="hidden" name={`members.${index}.imageAlt`} value="" />
              <label className="grid gap-1.5 text-sm">
                Name
                <input
                  name={`members.${index}.name`}
                  value={member.name}
                  disabled={locked}
                  className={fieldClass}
                  onChange={(event) =>
                    setMembers((current) =>
                      current.map((item) => (item.key === member.key ? { ...item, name: event.target.value } : item)),
                    )
                  }
                />
              </label>
              <button
                type="button"
                className="self-end text-sm text-muted"
                disabled={locked}
                onClick={() => setMembers((current) => current.filter((item) => item.key !== member.key))}
              >
                Remove
              </button>
            </div>
          ) : null,
        )}
      </section>

      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-medium">Photographs</h2>
          <button
            type="button"
            className="text-sm text-accent"
            disabled={locked}
            onClick={() =>
              setPhotos((current) => [...current, { key: crypto.randomUUID(), url: "", alt: "", caption: "" }])
            }
          >
            Add a photograph
          </button>
        </div>
        {photos.length === 0 ? <p className="text-sm text-muted">No photographs yet.</p> : null}
        <ImageUrlHint />
        {photos.map((photo, index) => (
          <div key={photo.key} className="grid gap-3 rounded-xl border border-line bg-background p-4">
            <label className="grid gap-1.5 text-sm">
              Image URL
              <input
                name={`photos.${index}.url`}
                value={photo.url}
                disabled={locked}
                className={fieldClass}
                placeholder={IMAGE_URL_EXAMPLE}
                onChange={(event) =>
                  setPhotos((current) =>
                    current.map((item) => (item.key === photo.key ? { ...item, url: event.target.value } : item)),
                  )
                }
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Alternative text
              <input
                name={`photos.${index}.alt`}
                value={photo.alt}
                disabled={locked}
                className={fieldClass}
                onChange={(event) =>
                  setPhotos((current) =>
                    current.map((item) => (item.key === photo.key ? { ...item, alt: event.target.value } : item)),
                  )
                }
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Caption
              <input
                name={`photos.${index}.caption`}
                value={photo.caption}
                disabled={locked}
                className={fieldClass}
                onChange={(event) =>
                  setPhotos((current) =>
                    current.map((item) => (item.key === photo.key ? { ...item, caption: event.target.value } : item)),
                  )
                }
              />
            </label>
            <button
              type="button"
              className="justify-self-start text-sm text-muted"
              disabled={locked}
              onClick={() => setPhotos((current) => current.filter((item) => item.key !== photo.key))}
            >
              Remove photograph
            </button>
          </div>
        ))}
      </section>

      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-medium">Posts</h2>
          <button
            type="button"
            className="text-sm text-accent"
            disabled={locked}
            onClick={() =>
              setPosts((current) => [
                ...current,
                { key: crypto.randomUUID(), title: "", body: "", publishedOn: "", imageUrl: "", imageAlt: "" },
              ])
            }
          >
            Add a post
          </button>
        </div>
        {posts.length === 0 ? <p className="text-sm text-muted">No posts yet.</p> : null}
        {posts.map((post, index) => (
          <div key={post.key} className="grid gap-3 rounded-xl border border-line bg-background p-4">
            <label className="grid gap-1.5 text-sm">
              Title
              <input
                name={`posts.${index}.title`}
                value={post.title}
                disabled={locked}
                className={fieldClass}
                onChange={(event) =>
                  setPosts((current) =>
                    current.map((item) => (item.key === post.key ? { ...item, title: event.target.value } : item)),
                  )
                }
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Note
              <textarea
                name={`posts.${index}.body`}
                value={post.body}
                rows={5}
                disabled={locked}
                className={fieldClass}
                onChange={(event) =>
                  setPosts((current) =>
                    current.map((item) => (item.key === post.key ? { ...item, body: event.target.value } : item)),
                  )
                }
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Date
              <input
                type="date"
                name={`posts.${index}.publishedOn`}
                value={post.publishedOn}
                disabled={locked}
                className={fieldClass}
                onChange={(event) =>
                  setPosts((current) =>
                    current.map((item) => (item.key === post.key ? { ...item, publishedOn: event.target.value } : item)),
                  )
                }
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Photograph URL
              <input
                name={`posts.${index}.imageUrl`}
                value={post.imageUrl}
                disabled={locked}
                className={fieldClass}
                placeholder={IMAGE_URL_EXAMPLE}
                onChange={(event) =>
                  setPosts((current) =>
                    current.map((item) => (item.key === post.key ? { ...item, imageUrl: event.target.value } : item)),
                  )
                }
              />
            </label>
            <ImageUrlHint />
            <label className="grid gap-1.5 text-sm">
              Photograph description
              <input
                name={`posts.${index}.imageAlt`}
                value={post.imageAlt}
                disabled={locked}
                className={fieldClass}
                onChange={(event) =>
                  setPosts((current) =>
                    current.map((item) => (item.key === post.key ? { ...item, imageAlt: event.target.value } : item)),
                  )
                }
              />
            </label>
            <button
              type="button"
              className="justify-self-start text-sm text-muted"
              disabled={locked}
              onClick={() => setPosts((current) => current.filter((item) => item.key !== post.key))}
            >
              Remove post
            </button>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          name="intent"
          value="save"
          disabled={locked || pending}
          className="rounded-md bg-navy px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {year?.publicationStatus === "published" ? "Save changes" : "Save draft"}
        </button>
        {role === "administrator" && year ? (
          <>
            <button type="submit" name="intent" value="publish" className="rounded-md bg-accent px-4 py-2 text-sm text-white">
              Publish
            </button>
            <button type="submit" name="intent" value="unpublish" className="rounded-md border border-line bg-background px-4 py-2 text-sm">
              Unpublish
            </button>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="confirmArchive" value="yes" />
              Confirm archive
            </label>
            <button type="submit" name="intent" value="archive" className="rounded-md border border-line bg-background px-4 py-2 text-sm">
              Archive
            </button>
          </>
        ) : year ? (
          <button type="submit" name="intent" value="submit" className="rounded-md border border-line bg-background px-4 py-2 text-sm">
            Submit for review
          </button>
        ) : null}
      </div>
    </form>
  );
}
