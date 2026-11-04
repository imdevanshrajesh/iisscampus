"use client";

import { useActionState, useState, type Dispatch, type SetStateAction } from "react";
import { ImageUrlHint } from "@/components/manage/image-url-hint";
import { councilMemberSlugs, isCouncilStaffRole } from "@/lib/data/catalog";
import { saveCouncilYear, type ActionState } from "@/lib/manage/actions";
import { IMAGE_URL_EXAMPLE } from "@/lib/media/guide";
import type { CampusRole, CouncilKind, CouncilYear } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

const staffRoleOptions = ["CCA Coordinator", "Teacher in charge", "Teacher"] as const;

const kinds: { value: CouncilKind; label: string }[] = [
  { value: "current", label: "This year" },
  { value: "upcoming", label: "Coming up" },
  { value: "past", label: "Earlier" },
];

type MemberDraft = {
  key: string;
  role: string;
  name: string;
  imageUrl: string;
  imageAlt: string;
  quote: string;
  about: string;
  work: string;
  board: "main" | "junior";
};
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
      quote: member.quote ?? "",
      about: member.about ?? "",
      work: member.work ?? "",
      board: member.board === "junior" ? "junior" : "main",
    })) ?? [],
  );
  const [juniorHeading, setJuniorHeading] = useState(year?.juniorHeading ?? "Junior Student Council");
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
  const memberSlugs = councilMemberSlugs(members);
  const memberPageQuery = year?.publicationStatus === "published" ? "" : "?preview=1";

  const missingRequiredFields: string[] = [];
  if (label.trim().length < 2) missingRequiredFields.push("Year label (at least 2 characters)");
  if (slug.trim().length < 2) missingRequiredFields.push("Address slug (at least 2 characters)");

  members.forEach((m, idx) => {
    const hasContent = m.role.trim() || m.name.trim() || m.imageUrl.trim();
    if (hasContent) {
      if (m.role.trim().length < 2) missingRequiredFields.push(`Member #${idx + 1}: Role / Post`);
      if (m.name.trim().length < 2) missingRequiredFields.push(`Member #${idx + 1}: Name`);
    }
  });

  photos.forEach((p, idx) => {
    if (!p.url.trim()) {
      missingRequiredFields.push(`Photo #${idx + 1}: Image URL`);
    }
  });

  posts.forEach((p, idx) => {
    if (p.title.trim().length < 2) missingRequiredFields.push(`Post #${idx + 1}: Title`);
    if (p.body.trim().length < 10) missingRequiredFields.push(`Post #${idx + 1}: Note / body (at least 10 characters)`);
    if (!p.publishedOn.trim()) missingRequiredFields.push(`Post #${idx + 1}: Date`);
  });

  const isFormValid = missingRequiredFields.length === 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isFormValid) {
      event.preventDefault();
      alert(`Please fill in all required fields:\n• ${missingRequiredFields.join("\n• ")}`);
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="grid max-w-3xl gap-8">
      {year ? <input type="hidden" name="id" value={year.id} /> : null}
      {state.error ? <p className="rounded-md bg-wash px-3 py-2 text-sm">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}

      <fieldset disabled={locked} className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            <span>
              Year label <span className="text-red-500 font-bold">*</span>
            </span>
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
            <span>
              Address <span className="text-red-500 font-bold">*</span>
            </span>
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
        <label className="grid gap-1.5 text-sm">
          Junior section heading
          <input
            name="juniorHeading"
            value={juniorHeading}
            disabled={locked}
            className={fieldClass}
            onChange={(event) => setJuniorHeading(event.target.value)}
          />
        </label>
        <p className="text-sm text-muted">Shown above the junior roster on the public council page. Change it here when the label needs updating.</p>
      </fieldset>

      <MemberBoard
        title="Student Council"
        hint="Role, then name. The photograph is shown large on their page. The message stays on the roster card. About me and what they have done appear only on their own page."
        board="main"
        members={members}
        setMembers={setMembers}
        locked={locked}
        slug={slug}
        memberSlugs={memberSlugs}
        memberPageQuery={memberPageQuery}
        showProfileFields
      />

      <MemberBoard
        title={juniorHeading || "Junior Student Council"}
        hint="Same captain and vice captain pairing. Photograph and message are optional. Junior posts stay on the year page and do not get a profile page."
        board="junior"
        members={members}
        setMembers={setMembers}
        locked={locked}
        slug={slug}
        memberSlugs={memberSlugs}
        memberPageQuery={memberPageQuery}
        showProfileFields={false}
      />

      <section className="grid gap-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">Teacher in charge</h2>
            <p className="mt-1 text-sm text-muted">
              Shown above the student roster. The name opens her own page, with the same photograph, message, about me, and what she has done.
            </p>
          </div>
          <button
            type="button"
            className="text-sm text-accent"
            disabled={locked}
            onClick={() =>
              setMembers((current) => [
                ...current,
                {
                  key: crypto.randomUUID(),
                  role: "CCA Coordinator",
                  name: "",
                  imageUrl: "",
                  imageAlt: "",
                  quote: "",
                  about: "",
                  work: "",
                  board: "main",
                },
              ])
            }
          >
            Add teacher in charge
          </button>
        </div>
        {members.some((member) => isCouncilStaffRole(member.role)) ? null : (
          <p className="text-sm text-muted">No teacher in charge yet.</p>
        )}
        {members.map((member, index) =>
          isCouncilStaffRole(member.role) ? (
            <div key={member.key} className="grid gap-3 rounded-xl border border-line bg-background p-4">
              <input type="hidden" name={`members.${index}.id`} value={member.key} />
              <input type="hidden" name={`members.${index}.board`} value="main" />
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <label className="grid gap-1.5 text-sm">
                <span>
                  Role <span className="text-red-500 font-bold">*</span>
                </span>
                <select
                  name={`members.${index}.role`}
                  value={member.role}
                  disabled={locked}
                  className={fieldClass}
                  onChange={(event) =>
                    setMembers((current) =>
                      current.map((item) => (item.key === member.key ? { ...item, role: event.target.value } : item)),
                    )
                  }
                >
                  {(staffRoleOptions as readonly string[]).includes(member.role)
                    ? null
                    : <option value={member.role}>{member.role}</option>}
                  {staffRoleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm">
                <span>
                  Name <span className="text-red-500 font-bold">*</span>
                </span>
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
              <label className="grid gap-1.5 text-sm">
                Message for students
                <textarea
                  name={`members.${index}.quote`}
                  value={member.quote}
                  disabled={locked}
                  rows={3}
                  maxLength={400}
                  className={fieldClass}
                  placeholder="Shown when someone hovers this card."
                  onChange={(event) =>
                    setMembers((current) =>
                      current.map((item) => (item.key === member.key ? { ...item, quote: event.target.value } : item)),
                    )
                  }
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                About me
                <textarea
                  name={`members.${index}.about`}
                  value={member.about}
                  disabled={locked}
                  rows={5}
                  maxLength={4000}
                  className={fieldClass}
                  placeholder="A short introduction, shown on her own page."
                  onChange={(event) =>
                    setMembers((current) =>
                      current.map((item) => (item.key === member.key ? { ...item, about: event.target.value } : item)),
                    )
                  }
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                What I have done
                <textarea
                  name={`members.${index}.work`}
                  value={member.work}
                  disabled={locked}
                  rows={5}
                  maxLength={4000}
                  className={fieldClass}
                  placeholder="The work of this post."
                  onChange={(event) =>
                    setMembers((current) =>
                      current.map((item) => (item.key === member.key ? { ...item, work: event.target.value } : item)),
                    )
                  }
                />
              </label>
              {slug && member.name.trim() && memberSlugs[index] ? (
                <a
                  href={`/council/${slug}/${memberSlugs[index]}${memberPageQuery}`}
                  className="text-sm text-accent"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open page
                </a>
              ) : null}
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
              <span>
                Image URL <span className="text-red-500 font-bold">*</span>
              </span>
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
              <span className="flex items-center justify-between">
                <span>Alternative text</span>
                <span className="text-[11px] text-muted">Auto-fills</span>
              </span>
              <input
                name={`photos.${index}.alt`}
                value={photo.alt}
                disabled={locked}
                placeholder={label || "Student Council photograph"}
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
              <span>
                Title <span className="text-red-500 font-bold">*</span>
              </span>
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
              <span>
                Note <span className="text-red-500 font-bold">*</span>
              </span>
              <textarea
                name={`posts.${index}.body`}
                value={post.body}
                rows={5}
                disabled={locked}
                className={fieldClass}
                placeholder="At least 10 characters required"
                onChange={(event) =>
                  setPosts((current) =>
                    current.map((item) => (item.key === post.key ? { ...item, body: event.target.value } : item)),
                  )
                }
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span>
                Date <span className="text-red-500 font-bold">*</span>
              </span>
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

      {missingRequiredFields.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-semibold">Cannot submit form. Required fields missing:</p>
          <ul className="mt-1 list-disc pl-5 text-xs space-y-0.5">
            {missingRequiredFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          name="intent"
          value="save"
          disabled={locked || pending || !isFormValid}
          className="rounded-md bg-navy px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {year?.publicationStatus === "published" ? "Save changes" : "Save draft"}
        </button>
        {role === "administrator" && year ? (
          <>
            <button
              type="submit"
              name="intent"
              value="publish"
              disabled={locked || pending || !isFormValid}
              className="rounded-md bg-accent px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Publish
            </button>
            <button
              type="submit"
              name="intent"
              value="unpublish"
              disabled={locked || pending}
              className="rounded-md border border-line bg-background px-4 py-2 text-sm disabled:opacity-50"
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
              disabled={locked || pending}
              className="rounded-md border border-line bg-background px-4 py-2 text-sm disabled:opacity-50"
            >
              Archive
            </button>
          </>
        ) : year ? (
          <button
            type="submit"
            name="intent"
            value="submit"
            disabled={locked || pending || !isFormValid}
            className="rounded-md border border-line bg-background px-4 py-2 text-sm disabled:opacity-50"
          >
            Submit for review
          </button>
        ) : null}
      </div>
    </form>
  );
}

function MemberBoard({
  title,
  hint,
  board,
  members,
  setMembers,
  locked,
  slug,
  memberSlugs,
  memberPageQuery,
  showProfileFields,
}: {
  title: string;
  hint: string;
  board: "main" | "junior";
  members: MemberDraft[];
  setMembers: Dispatch<SetStateAction<MemberDraft[]>>;
  locked: boolean;
  slug: string;
  memberSlugs: string[];
  memberPageQuery: string;
  showProfileFields: boolean;
}) {
  const emptyMember = (): MemberDraft => ({
    key: crypto.randomUUID(),
    role: "",
    name: "",
    imageUrl: "",
    imageAlt: "",
    quote: "",
    about: "",
    work: "",
    board,
  });

  return (
    <section className="grid gap-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">{title}</h2>
          <p className="mt-1 text-sm text-muted">{hint}</p>
        </div>
        <button
          type="button"
          className="text-sm text-accent"
          disabled={locked}
          onClick={() => setMembers((current) => [...current, emptyMember()])}
        >
          Add a post
        </button>
      </div>
      {members.map((member, index) => {
        if (isCouncilStaffRole(member.role)) return null;
        if ((member.board ?? "main") !== board) return null;
        return (
          <div key={member.key} className="grid gap-3 rounded-xl border border-line bg-background p-4">
            <input type="hidden" name={`members.${index}.id`} value={member.key} />
            <input type="hidden" name={`members.${index}.board`} value={board} />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span>
                  Post <span className="text-red-500 font-bold">*</span>
                </span>
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
                <span>
                  Name <span className="text-red-500 font-bold">*</span>
                </span>
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
                <span className="flex items-center justify-between">
                  <span>Photograph description</span>
                  <span className="text-[11px] text-muted">Auto-fills</span>
                </span>
                <input
                  name={`members.${index}.imageAlt`}
                  value={member.imageAlt}
                  disabled={locked}
                  className={fieldClass}
                  placeholder={member.name ? `${member.name} - ${member.role}` : "Auto-filled with name"}
                  onChange={(event) =>
                    setMembers((current) =>
                      current.map((item) => (item.key === member.key ? { ...item, imageAlt: event.target.value } : item)),
                    )
                  }
                />
              </label>
            </div>
            <label className="grid gap-1.5 text-sm">
              Message for students
              <textarea
                name={`members.${index}.quote`}
                value={member.quote}
                disabled={locked}
                rows={3}
                maxLength={400}
                className={fieldClass}
                placeholder={showProfileFields ? "Shown when someone hovers this card." : "Optional message on the roster card."}
                onChange={(event) =>
                  setMembers((current) =>
                    current.map((item) => (item.key === member.key ? { ...item, quote: event.target.value } : item)),
                  )
                }
              />
            </label>
            {showProfileFields ? (
              <>
                <label className="grid gap-1.5 text-sm">
                  About me
                  <textarea
                    name={`members.${index}.about`}
                    value={member.about}
                    disabled={locked}
                    rows={5}
                    maxLength={4000}
                    className={fieldClass}
                    onChange={(event) =>
                      setMembers((current) =>
                        current.map((item) => (item.key === member.key ? { ...item, about: event.target.value } : item)),
                      )
                    }
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  What I have done
                  <textarea
                    name={`members.${index}.work`}
                    value={member.work}
                    disabled={locked}
                    rows={5}
                    maxLength={4000}
                    className={fieldClass}
                    onChange={(event) =>
                      setMembers((current) =>
                        current.map((item) => (item.key === member.key ? { ...item, work: event.target.value } : item)),
                      )
                    }
                  />
                </label>
              </>
            ) : (
              <>
                <input type="hidden" name={`members.${index}.about`} value={member.about} />
                <input type="hidden" name={`members.${index}.work`} value={member.work} />
              </>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-muted">
              {showProfileFields && slug && member.name.trim() && memberSlugs[index] ? (
                <a
                  href={`/council/${slug}/${memberSlugs[index]}${memberPageQuery}`}
                  className="text-accent"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open page
                </a>
              ) : null}
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
        );
      })}
    </section>
  );
}
