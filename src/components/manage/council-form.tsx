"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  AlertCircle,
  Check,
  Cloud,
  CloudOff,
  Loader2,
  RotateCcw,
  Save,
} from "lucide-react";
import { ImageUrlHint } from "@/components/manage/image-url-hint";
import { ImageUploader } from "@/components/manage/image-uploader";
import { MassImageUploader } from "@/components/manage/mass-image-uploader";
import { councilMemberSlugs, isCouncilStaffRole } from "@/lib/data/catalog";
import {
  deleteCouncilMemberAction,
  deleteCouncilPhotoAction,
  deleteCouncilPostAction,
  reorderCouncilItemsAction,
  saveCouncilMemberAction,
  saveCouncilPhotoAction,
  saveCouncilPostAction,
  saveCouncilYear,
  saveCouncilYearMetaAction,
  type ActionState,
} from "@/lib/manage/actions";
import type { CampusRole, CouncilKind, CouncilYear, PublicationStatus } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

const staffRoleOptions = ["CCA Coordinator", "Teacher in charge", "Teacher"] as const;

const kinds: { value: CouncilKind; label: string }[] = [
  { value: "current", label: "This year" },
  { value: "upcoming", label: "Coming up" },
  { value: "past", label: "Earlier" },
];

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type YearMetaDraft = {
  label: string;
  slug: string;
  kind: CouncilKind;
  summary: string;
  sortOrder: number;
  juniorHeading: string;
};

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

type ItemSyncStatus = {
  state: "saved" | "unsaved" | "saving" | "incomplete" | "error";
  message?: string;
  savedAt?: string;
};

type StoredDraftPayload = {
  version: 1;
  updatedAt: string;
  meta: YearMetaDraft;
  slugTouched: boolean;
  members: MemberDraft[];
  photos: PhotoDraft[];
  posts: PostDraft[];
};

function slugFromLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function formatClock(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function draftStorageKey(id: string | null | undefined) {
  return `iiss-council-draft:${id || "new"}`;
}

function serializeMeta(meta: YearMetaDraft) {
  return JSON.stringify({
    label: meta.label.trim(),
    slug: meta.slug.trim(),
    kind: meta.kind,
    summary: meta.summary.trim(),
    sortOrder: Number.isFinite(meta.sortOrder) ? meta.sortOrder : 0,
    juniorHeading: meta.juniorHeading.trim() || "Junior Student Council",
  });
}

function serializeMember(m: MemberDraft) {
  return JSON.stringify({
    role: m.role.trim(),
    name: m.name.trim(),
    imageUrl: m.imageUrl.trim(),
    imageAlt: m.imageAlt.trim(),
    quote: m.quote.trim(),
    about: m.about.trim(),
    work: m.work.trim(),
    board: m.board,
  });
}

function serializePhoto(p: PhotoDraft) {
  return JSON.stringify({
    url: p.url.trim(),
    alt: p.alt.trim(),
    caption: p.caption.trim(),
  });
}

function serializePost(p: PostDraft) {
  return JSON.stringify({
    title: p.title.trim(),
    body: p.body.trim(),
    publishedOn: p.publishedOn.trim(),
    imageUrl: p.imageUrl.trim(),
    imageAlt: p.imageAlt.trim(),
  });
}

function validateMeta(meta: YearMetaDraft): string | null {
  if (meta.label.trim().length < 2) return "Year label must be at least 2 characters.";
  if (meta.slug.trim().length < 2) return "Address slug must be at least 2 characters.";
  if (!SLUG_REGEX.test(meta.slug.trim())) {
    return "Address slug must use lowercase letters, numbers, and hyphens.";
  }
  return null;
}

function isMemberEmpty(m: MemberDraft) {
  return (
    !m.role.trim() &&
    !m.name.trim() &&
    !m.imageUrl.trim() &&
    !m.quote.trim() &&
    !m.about.trim() &&
    !m.work.trim()
  );
}

function validateMember(m: MemberDraft): string | null {
  if (m.role.trim().length < 2) return "Post / Role must be at least 2 characters.";
  if (m.name.trim().length < 2) return "Name must be at least 2 characters.";
  return null;
}

function isPhotoEmpty(p: PhotoDraft) {
  return !p.url.trim() && !p.alt.trim() && !p.caption.trim();
}

function validatePhoto(p: PhotoDraft): string | null {
  if (!p.url.trim()) return "Upload or enter an image URL first.";
  return null;
}

function isPostEmpty(p: PostDraft) {
  return !p.title.trim() && !p.body.trim() && !p.imageUrl.trim();
}

function validatePost(p: PostDraft): string | null {
  if (p.title.trim().length < 2) return "Post title must be at least 2 characters.";
  if (p.body.trim().length < 10) return "Note must be at least 10 characters.";
  if (p.publishedOn.trim() && !DATE_REGEX.test(p.publishedOn.trim())) {
    return "Date must use YYYY-MM-DD format.";
  }
  return null;
}

function initialMetaFromYear(year: CouncilYear | null): YearMetaDraft {
  return {
    label: year?.label ?? "",
    slug: year?.slug ?? "",
    kind: year?.kind ?? "current",
    summary: year?.summary ?? "",
    sortOrder: year?.sortOrder ?? 0,
    juniorHeading: year?.juniorHeading ?? "Junior Student Council",
  };
}

function initialMembersFromYear(year: CouncilYear | null): MemberDraft[] {
  return (
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
    })) ?? []
  );
}

function initialPhotosFromYear(year: CouncilYear | null): PhotoDraft[] {
  return (
    year?.photos.map((photo) => ({
      key: photo.id,
      url: photo.url,
      alt: photo.alt,
      caption: photo.caption ?? "",
    })) ?? []
  );
}

function initialPostsFromYear(year: CouncilYear | null): PostDraft[] {
  return (
    year?.posts.map((post) => ({
      key: post.id,
      title: post.title,
      body: post.body,
      publishedOn: post.publishedOn ?? "",
      imageUrl: post.imageUrl ?? "",
      imageAlt: post.imageAlt ?? "",
    })) ?? []
  );
}

type ServerBaseline = {
  meta: string | null;
  members: Record<string, string>;
  photos: Record<string, string>;
  posts: Record<string, string>;
  knownMembers: Record<string, true>;
  knownPhotos: Record<string, true>;
  knownPosts: Record<string, true>;
  memberOrder: string[];
  photoOrder: string[];
  postOrder: string[];
};

function buildInitialBaseline(year: CouncilYear | null): ServerBaseline {
  if (!year) {
    return {
      meta: null,
      members: {},
      photos: {},
      posts: {},
      knownMembers: {},
      knownPhotos: {},
      knownPosts: {},
      memberOrder: [],
      photoOrder: [],
      postOrder: [],
    };
  }
  const members = initialMembersFromYear(year);
  const photos = initialPhotosFromYear(year);
  const posts = initialPostsFromYear(year);
  return {
    meta: serializeMeta(initialMetaFromYear(year)),
    members: Object.fromEntries(members.map((m) => [m.key, serializeMember(m)])),
    photos: Object.fromEntries(photos.map((p) => [p.key, serializePhoto(p)])),
    posts: Object.fromEntries(posts.map((p) => [p.key, serializePost(p)])),
    knownMembers: Object.fromEntries(members.map((m) => [m.key, true as const])),
    knownPhotos: Object.fromEntries(photos.map((p) => [p.key, true as const])),
    knownPosts: Object.fromEntries(posts.map((p) => [p.key, true as const])),
    memberOrder: members.map((m) => m.key),
    photoOrder: photos.map((p) => p.key),
    postOrder: posts.map((p) => p.key),
  };
}

function deriveItemStatuses<T extends { key: string }>(
  items: T[],
  prefix: "member" | "photo" | "post",
  validateFn: (item: T) => string | null,
  isEmptyFn: (item: T) => boolean,
  serializeFn: (item: T) => string,
  savedSnapshots: Record<string, string>,
  knownIds: Record<string, true>,
  savingKeys: Record<string, true>,
  savedAtByKey: Record<string, string>,
  errorByKey: Record<string, { snapshot: string; message: string }>,
): Record<string, ItemSyncStatus> {
  const result: Record<string, ItemSyncStatus> = {};
  for (const item of items) {
    const opKey = `${prefix}:${item.key}`;
    if (savingKeys[opKey]) {
      result[item.key] = { state: "saving" };
      continue;
    }
    const snap = serializeFn(item);
    const recordedError = errorByKey[opKey];
    if (recordedError && recordedError.snapshot === snap) {
      result[item.key] = { state: "error", message: recordedError.message };
      continue;
    }
    const err = validateFn(item);
    if (err) {
      result[item.key] = { state: "incomplete", message: isEmptyFn(item) ? undefined : err };
      continue;
    }
    if (savedSnapshots[item.key] !== snap || !knownIds[item.key]) {
      result[item.key] = { state: "unsaved" };
      continue;
    }
    result[item.key] = { state: "saved", savedAt: savedAtByKey[opKey] };
  }
  return result;
}

function StatusPill({ status }: { status?: ItemSyncStatus }) {
  if (!status || status.state === "saved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
        <Check size={11} />
        {status?.savedAt ? `Saved ${status.savedAt}` : "Saved"}
      </span>
    );
  }
  if (status.state === "saving") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-navy/10 px-2.5 py-0.5 text-[11px] font-medium text-navy">
        <Loader2 size={11} className="animate-spin" />
        Saving...
      </span>
    );
  }
  if (status.state === "error") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-medium text-red-700">
        <AlertCircle size={11} />
        Not saved
      </span>
    );
  }
  if (status.state === "incomplete") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-medium text-amber-800">
        Draft (incomplete)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-medium text-amber-800">
      Unsaved
    </span>
  );
}

export function CouncilForm({
  year,
  role,
}: {
  year: CouncilYear | null;
  role: CampusRole;
}) {
  const [yearId, setYearId] = useState(year?.id ?? "");
  const [publicationStatus, setPublicationStatus] = useState<PublicationStatus>(
    year?.publicationStatus ?? "draft",
  );

  const [meta, setMeta] = useState<YearMetaDraft>(() => initialMetaFromYear(year));
  const [slugTouched, setSlugTouched] = useState(Boolean(year));
  const [members, setMembers] = useState<MemberDraft[]>(() => initialMembersFromYear(year));
  const [photos, setPhotos] = useState<PhotoDraft[]>(() => initialPhotosFromYear(year));
  const [posts, setPosts] = useState<PostDraft[]>(() => initialPostsFromYear(year));

  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(year ? "from server" : null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [restoredDraftAt, setRestoredDraftAt] = useState<string | null>(null);

  const [serverBaseline, setServerBaseline] = useState<ServerBaseline>(() =>
    buildInitialBaseline(year),
  );
  const [savingKeys, setSavingKeys] = useState<Record<string, true>>({});
  const [savedAtByKey, setSavedAtByKey] = useState<Record<string, string>>({});
  const [errorByKey, setErrorByKey] = useState<Record<string, { snapshot: string; message: string }>>({});

  const locked =
    role === "editor" && (publicationStatus === "published" || publicationStatus === "archived");

  // Mutable ref mirrors for sequential async tasks & event listeners (never read during render)
  const serverBaselineRef = useRef<ServerBaseline>(buildInitialBaseline(year));
  const latestRef = useRef({
    yearId,
    meta,
    slugTouched,
    members,
    photos,
    posts,
    autoSaveEnabled,
    locked,
  });

  useEffect(() => {
    latestRef.current = {
      yearId,
      meta,
      slugTouched,
      members,
      photos,
      posts,
      autoSaveEnabled,
      locked,
    };
  });

  const setItemSaving = useCallback((opKey: string, saving: boolean) => {
    setSavingKeys((prev) => {
      if (saving) return { ...prev, [opKey]: true };
      const { [opKey]: _removed, ...rest } = prev;
      void _removed;
      return rest;
    });
  }, []);

  const markItemSaved = useCallback((opKey: string, clock: string) => {
    setSavedAtByKey((prev) => ({ ...prev, [opKey]: clock }));
    setErrorByKey((prev) => {
      if (!(opKey in prev)) return prev;
      const { [opKey]: _removed, ...rest } = prev;
      void _removed;
      return rest;
    });
  }, []);

  const markItemError = useCallback((opKey: string, snapshot: string, message: string) => {
    setErrorByKey((prev) => ({ ...prev, [opKey]: { snapshot, message } }));
  }, []);

  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);

  const enqueueTask = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const run = saveQueueRef.current.then(task, task);
    saveQueueRef.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }, []);

  const hasUnsavedServerDiff = useCallback(() => {
    const cur = latestRef.current;
    const base = serverBaselineRef.current;
    if (serializeMeta(cur.meta) !== base.meta) return true;
    for (const m of cur.members) {
      if (isMemberEmpty(m) && !base.knownMembers[m.key]) continue;
      if (base.members[m.key] !== serializeMember(m)) return true;
    }
    for (const p of cur.photos) {
      if (isPhotoEmpty(p) && !base.knownPhotos[p.key]) continue;
      if (base.photos[p.key] !== serializePhoto(p)) return true;
    }
    for (const p of cur.posts) {
      if (isPostEmpty(p) && !base.knownPosts[p.key]) continue;
      if (base.posts[p.key] !== serializePost(p)) return true;
    }
    return false;
  }, []);

  const writeLocalDraftNow = useCallback(() => {
    if (typeof window === "undefined") return;
    const cur = latestRef.current;
    const key = draftStorageKey(cur.yearId || year?.id);
    try {
      if (!hasUnsavedServerDiff()) {
        window.localStorage.removeItem(key);
        return;
      }
      const payload: StoredDraftPayload = {
        version: 1,
        updatedAt: new Date().toISOString(),
        meta: cur.meta,
        slugTouched: cur.slugTouched,
        members: cur.members,
        photos: cur.photos,
        posts: cur.posts,
      };
      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // Ignore storage quota / privacy mode issues
    }
  }, [hasUnsavedServerDiff, year?.id]);

  const wrappedSaveAction = useCallback(
    async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
      const res = await saveCouncilYear(prevState, formData);
      if (res.ok) {
        const cur = latestRef.current;
        const nextBase: ServerBaseline = {
          meta: serializeMeta(cur.meta),
          members: Object.fromEntries(cur.members.map((m) => [m.key, serializeMember(m)])),
          photos: Object.fromEntries(cur.photos.map((p) => [p.key, serializePhoto(p)])),
          posts: Object.fromEntries(cur.posts.map((p) => [p.key, serializePost(p)])),
          knownMembers: Object.fromEntries(cur.members.map((m) => [m.key, true as const])),
          knownPhotos: Object.fromEntries(cur.photos.map((p) => [p.key, true as const])),
          knownPosts: Object.fromEntries(cur.posts.map((p) => [p.key, true as const])),
          memberOrder: cur.members.map((m) => m.key),
          photoOrder: cur.photos.map((p) => p.key),
          postOrder: cur.posts.map((p) => p.key),
        };
        serverBaselineRef.current = nextBase;
        setServerBaseline(nextBase);
        setErrorByKey({});
        setLastSavedAt(formatClock());
        setSyncError(null);
        setRestoredDraftAt(null);
        if (typeof window !== "undefined") {
          try {
            window.localStorage.removeItem(draftStorageKey(cur.yearId || year?.id));
          } catch {
            // ignore
          }
        }
      }
      return res;
    },
    [year?.id],
  );

  const [state, action, pending] = useActionState(wrappedSaveAction, {} as ActionState);

  // Restore unsaved local draft after mount if any exists
  useEffect(() => {
    hydratedRef.current = true;
    if (typeof window === "undefined" || locked) return;
    const key = draftStorageKey(year?.id);
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<StoredDraftPayload>;
        if (parsed?.version !== 1 || !parsed.meta) return;

        const baseMeta = serializeMeta(initialMetaFromYear(year));
        const sameMeta = serializeMeta(parsed.meta) === baseMeta;
        const sameMembers =
          JSON.stringify(parsed.members ?? []) === JSON.stringify(initialMembersFromYear(year));
        const samePhotos =
          JSON.stringify(parsed.photos ?? []) === JSON.stringify(initialPhotosFromYear(year));
        const samePosts =
          JSON.stringify(parsed.posts ?? []) === JSON.stringify(initialPostsFromYear(year));

        if (sameMeta && sameMembers && samePhotos && samePosts) {
          window.localStorage.removeItem(key);
          return;
        }

        setMeta(parsed.meta);
        if (typeof parsed.slugTouched === "boolean") setSlugTouched(parsed.slugTouched);
        if (Array.isArray(parsed.members)) setMembers(parsed.members);
        if (Array.isArray(parsed.photos)) setPhotos(parsed.photos);
        if (Array.isArray(parsed.posts)) setPosts(parsed.posts);
        setRestoredDraftAt(parsed.updatedAt ? new Date(parsed.updatedAt).toLocaleString() : "earlier");
      } catch {
        // Ignore corrupted draft
      }
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist local draft after edits
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (localSaveTimerRef.current) clearTimeout(localSaveTimerRef.current);
    localSaveTimerRef.current = setTimeout(() => {
      writeLocalDraftNow();
    }, 200);
    return () => {
      if (localSaveTimerRef.current) clearTimeout(localSaveTimerRef.current);
    };
  }, [meta, members, photos, posts, writeLocalDraftNow]);

  // Derived statuses during render (no effect cascades)
  const metaStatus: ItemSyncStatus = useMemo(() => {
    if (savingKeys.meta) return { state: "saving" };
    const snap = serializeMeta(meta);
    const err = validateMeta(meta);
    const recordedError = errorByKey.meta;
    if (recordedError && recordedError.snapshot === snap) {
      return { state: "error", message: recordedError.message };
    }
    if (err) return { state: "incomplete", message: err };
    if (serverBaseline.meta !== snap) return { state: "unsaved" };
    return { state: "saved", savedAt: savedAtByKey.meta };
  }, [errorByKey.meta, meta, savedAtByKey.meta, savingKeys.meta, serverBaseline.meta]);

  const memberStatuses = useMemo(
    () =>
      deriveItemStatuses(
        members,
        "member",
        validateMember,
        isMemberEmpty,
        serializeMember,
        serverBaseline.members,
        serverBaseline.knownMembers,
        savingKeys,
        savedAtByKey,
        errorByKey,
      ),
    [errorByKey, members, savedAtByKey, savingKeys, serverBaseline.knownMembers, serverBaseline.members],
  );

  const photoStatuses = useMemo(
    () =>
      deriveItemStatuses(
        photos,
        "photo",
        validatePhoto,
        isPhotoEmpty,
        serializePhoto,
        serverBaseline.photos,
        serverBaseline.knownPhotos,
        savingKeys,
        savedAtByKey,
        errorByKey,
      ),
    [errorByKey, photos, savedAtByKey, savingKeys, serverBaseline.knownPhotos, serverBaseline.photos],
  );

  const postStatuses = useMemo(
    () =>
      deriveItemStatuses(
        posts,
        "post",
        validatePost,
        isPostEmpty,
        serializePost,
        serverBaseline.posts,
        serverBaseline.knownPosts,
        savingKeys,
        savedAtByKey,
        errorByKey,
      ),
    [errorByKey, posts, savedAtByKey, savingKeys, serverBaseline.knownPosts, serverBaseline.posts],
  );

  // Warn before accidentally closing/reloading if there are pending server edits or saving in progress
  useEffect(() => {
    const handlePageHide = () => {
      writeLocalDraftNow();
    };
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      writeLocalDraftNow();
      if (isSyncing || hasUnsavedServerDiff()) {
        event.preventDefault();
      }
    };
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedServerDiff, isSyncing, writeLocalDraftNow]);

  // Ensure year exists on server and save metadata if changed
  const ensureYearSavedLocked = useCallback(async (): Promise<{ ok: true; id: string } | { error: string }> => {
    const cur = latestRef.current;
    const metaSerialized = serializeMeta(cur.meta);
    const metaErr = validateMeta(cur.meta);
    if (metaErr) {
      markItemError("meta", metaSerialized, metaErr);
      return { error: metaErr };
    }

    if (cur.yearId && serverBaselineRef.current.meta === metaSerialized) {
      return { ok: true, id: cur.yearId };
    }

    setItemSaving("meta", true);
    const res = await saveCouncilYearMetaAction({
      id: cur.yearId || undefined,
      label: cur.meta.label.trim(),
      slug: cur.meta.slug.trim(),
      kind: cur.meta.kind,
      summary: cur.meta.summary.trim(),
      juniorHeading: cur.meta.juniorHeading.trim() || "Junior Student Council",
      sortOrder: Number.isFinite(cur.meta.sortOrder) ? cur.meta.sortOrder : 0,
    });
    setItemSaving("meta", false);

    if ("error" in res) {
      markItemError("meta", metaSerialized, res.error);
      return { error: res.error };
    }

    const clock = formatClock();
    const prevYearId = latestRef.current.yearId;
    const nextBaseline: ServerBaseline = {
      ...serverBaselineRef.current,
      meta: metaSerialized,
    };
    serverBaselineRef.current = nextBaseline;
    setServerBaseline(nextBaseline);
    markItemSaved("meta", clock);
    setPublicationStatus(res.status);
    setLastSavedAt(clock);

    if (!prevYearId && res.id) {
      setYearId(res.id);
      latestRef.current.yearId = res.id;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(draftStorageKey(undefined));
        } catch {
          // ignore
        }
        window.history.replaceState(null, "", `/manage/council/${res.id}/edit`);
      }
    }

    return { ok: true, id: res.id };
  }, [markItemError, markItemSaved, setItemSaving]);

  const persistSingleMemberLocked = useCallback(
    async (memberKey: string): Promise<boolean> => {
      const cur = latestRef.current;
      const index = cur.members.findIndex((m) => m.key === memberKey);
      if (index === -1) return true;
      const member = cur.members[index];
      const opKey = `member:${memberKey}`;
      const snapshot = serializeMember(member);
      const err = validateMember(member);
      if (err) {
        markItemError(opKey, snapshot, err);
        return false;
      }

      const yearResult = await ensureYearSavedLocked();
      if ("error" in yearResult) {
        markItemError(opKey, snapshot, yearResult.error);
        return false;
      }

      setItemSaving(opKey, true);
      const res = await saveCouncilMemberAction({
        yearId: yearResult.id,
        member: {
          id: member.key,
          role: member.role,
          name: member.name,
          imageUrl: member.imageUrl,
          imageAlt: member.imageAlt,
          quote: member.quote,
          about: member.about,
          work: member.work,
          board: member.board,
        },
        sortOrder: index,
      });
      setItemSaving(opKey, false);

      if ("error" in res) {
        markItemError(opKey, snapshot, res.error);
        setSyncError(res.error);
        return false;
      }

      const clock = formatClock();
      const base = serverBaselineRef.current;
      const nextBaseline: ServerBaseline = {
        ...base,
        members: { ...base.members, [res.id]: snapshot },
        knownMembers: { ...base.knownMembers, [res.id]: true },
      };
      serverBaselineRef.current = nextBaseline;
      setServerBaseline(nextBaseline);
      markItemSaved(`member:${res.id}`, clock);
      setLastSavedAt(clock);
      setSyncError(null);
      return true;
    },
    [ensureYearSavedLocked, markItemError, markItemSaved, setItemSaving],
  );

  const persistSinglePhotoLocked = useCallback(
    async (photoKey: string): Promise<boolean> => {
      const cur = latestRef.current;
      const index = cur.photos.findIndex((p) => p.key === photoKey);
      if (index === -1) return true;
      const photo = cur.photos[index];
      const opKey = `photo:${photoKey}`;
      const snapshot = serializePhoto(photo);
      const err = validatePhoto(photo);
      if (err) {
        markItemError(opKey, snapshot, err);
        return false;
      }

      const yearResult = await ensureYearSavedLocked();
      if ("error" in yearResult) {
        markItemError(opKey, snapshot, yearResult.error);
        return false;
      }

      setItemSaving(opKey, true);
      const res = await saveCouncilPhotoAction({
        yearId: yearResult.id,
        photo: {
          id: photo.key,
          url: photo.url,
          alt: photo.alt,
          caption: photo.caption,
        },
        sortOrder: index,
        yearLabel: cur.meta.label,
      });
      setItemSaving(opKey, false);

      if ("error" in res) {
        markItemError(opKey, snapshot, res.error);
        setSyncError(res.error);
        return false;
      }

      const clock = formatClock();
      const base = serverBaselineRef.current;
      const nextBaseline: ServerBaseline = {
        ...base,
        photos: { ...base.photos, [res.id]: snapshot },
        knownPhotos: { ...base.knownPhotos, [res.id]: true },
      };
      serverBaselineRef.current = nextBaseline;
      setServerBaseline(nextBaseline);
      markItemSaved(`photo:${res.id}`, clock);
      setLastSavedAt(clock);
      setSyncError(null);
      return true;
    },
    [ensureYearSavedLocked, markItemError, markItemSaved, setItemSaving],
  );

  const persistSinglePostLocked = useCallback(
    async (postKey: string): Promise<boolean> => {
      const cur = latestRef.current;
      const index = cur.posts.findIndex((p) => p.key === postKey);
      if (index === -1) return true;
      const post = cur.posts[index];
      const opKey = `post:${postKey}`;
      const snapshot = serializePost(post);
      const err = validatePost(post);
      if (err) {
        markItemError(opKey, snapshot, err);
        return false;
      }

      const yearResult = await ensureYearSavedLocked();
      if ("error" in yearResult) {
        markItemError(opKey, snapshot, yearResult.error);
        return false;
      }

      setItemSaving(opKey, true);
      const res = await saveCouncilPostAction({
        yearId: yearResult.id,
        post: {
          id: post.key,
          title: post.title,
          body: post.body,
          publishedOn: post.publishedOn,
          imageUrl: post.imageUrl,
          imageAlt: post.imageAlt,
        },
        sortOrder: index,
      });
      setItemSaving(opKey, false);

      if ("error" in res) {
        markItemError(opKey, snapshot, res.error);
        setSyncError(res.error);
        return false;
      }

      const clock = formatClock();
      const base = serverBaselineRef.current;
      const nextBaseline: ServerBaseline = {
        ...base,
        posts: { ...base.posts, [res.id]: snapshot },
        knownPosts: { ...base.knownPosts, [res.id]: true },
      };
      serverBaselineRef.current = nextBaseline;
      setServerBaseline(nextBaseline);
      markItemSaved(`post:${res.id}`, clock);
      setLastSavedAt(clock);
      setSyncError(null);
      return true;
    },
    [ensureYearSavedLocked, markItemError, markItemSaved, setItemSaving],
  );

  const syncAllDirty = useCallback(async () => {
    return enqueueTask(async () => {
      const cur = latestRef.current;
      if (cur.locked) return;

      const metaErr = validateMeta(cur.meta);
      if (metaErr) {
        return;
      }

      setIsSyncing(true);
      try {
        const yearRes = await ensureYearSavedLocked();
        if ("error" in yearRes) {
          setSyncError(yearRes.error);
          return;
        }
        const activeYearId = yearRes.id;

        const base = serverBaselineRef.current;
        const fresh = latestRef.current;

        for (const m of fresh.members) {
          if (validateMember(m) !== null) continue;
          const snap = serializeMember(m);
          if (base.members[m.key] !== snap || !base.knownMembers[m.key]) {
            await persistSingleMemberLocked(m.key);
          }
        }

        for (const p of fresh.photos) {
          if (validatePhoto(p) !== null) continue;
          const snap = serializePhoto(p);
          if (base.photos[p.key] !== snap || !base.knownPhotos[p.key]) {
            await persistSinglePhotoLocked(p.key);
          }
        }

        for (const p of fresh.posts) {
          if (validatePost(p) !== null) continue;
          const snap = serializePost(p);
          if (base.posts[p.key] !== snap || !base.knownPosts[p.key]) {
            await persistSinglePostLocked(p.key);
          }
        }

        // Sync order if saved items moved
        const latestBase = serverBaselineRef.current;
        const latestAfter = latestRef.current;
        const savedMemberOrder = latestAfter.members
          .filter((m) => Boolean(latestBase.knownMembers[m.key]))
          .map((m) => m.key);
        const savedPhotoOrder = latestAfter.photos
          .filter((p) => Boolean(latestBase.knownPhotos[p.key]))
          .map((p) => p.key);
        const savedPostOrder = latestAfter.posts
          .filter((p) => Boolean(latestBase.knownPosts[p.key]))
          .map((p) => p.key);

        const memberOrderChanged =
          savedMemberOrder.length > 0 &&
          JSON.stringify(savedMemberOrder) !== JSON.stringify(latestBase.memberOrder);
        const photoOrderChanged =
          savedPhotoOrder.length > 0 &&
          JSON.stringify(savedPhotoOrder) !== JSON.stringify(latestBase.photoOrder);
        const postOrderChanged =
          savedPostOrder.length > 0 &&
          JSON.stringify(savedPostOrder) !== JSON.stringify(latestBase.postOrder);

        if (memberOrderChanged || photoOrderChanged || postOrderChanged) {
          const orderRes = await reorderCouncilItemsAction({
            yearId: activeYearId,
            memberIds: memberOrderChanged ? savedMemberOrder : undefined,
            photoIds: photoOrderChanged ? savedPhotoOrder : undefined,
            postIds: postOrderChanged ? savedPostOrder : undefined,
          });
          if ("ok" in orderRes) {
            const nextBase: ServerBaseline = {
              ...serverBaselineRef.current,
              ...(memberOrderChanged ? { memberOrder: savedMemberOrder } : {}),
              ...(photoOrderChanged ? { photoOrder: savedPhotoOrder } : {}),
              ...(postOrderChanged ? { postOrder: savedPostOrder } : {}),
            };
            serverBaselineRef.current = nextBase;
            setServerBaseline(nextBase);
            setLastSavedAt(formatClock());
          }
        }
      } finally {
        setIsSyncing(false);
        writeLocalDraftNow();
      }
    });
  }, [
    enqueueTask,
    ensureYearSavedLocked,
    persistSingleMemberLocked,
    persistSinglePhotoLocked,
    persistSinglePostLocked,
    writeLocalDraftNow,
  ]);

  const scheduleAutoSave = useCallback(
    (delayMs = 1300) => {
      if (!latestRef.current.autoSaveEnabled || latestRef.current.locked) return;
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        void syncAllDirty();
      }, delayMs);
    },
    [syncAllDirty],
  );

  // Trigger auto-save when edits occur
  useEffect(() => {
    if (!hydratedRef.current || !autoSaveEnabled || locked) return;
    if (hasUnsavedServerDiff()) {
      scheduleAutoSave(1300);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [meta, members, photos, posts, autoSaveEnabled, locked, hasUnsavedServerDiff, scheduleAutoSave]);

  // Manual save handlers for individual cards
  const handleSaveMeta = () => {
    if (locked) return;
    void enqueueTask(async () => {
      setIsSyncing(true);
      try {
        const res = await ensureYearSavedLocked();
        if ("error" in res) setSyncError(res.error);
        else setSyncError(null);
      } finally {
        setIsSyncing(false);
        writeLocalDraftNow();
      }
    });
  };

  const handleSaveMember = (memberKey: string) => {
    if (locked) return;
    void enqueueTask(async () => {
      setIsSyncing(true);
      try {
        await persistSingleMemberLocked(memberKey);
      } finally {
        setIsSyncing(false);
        writeLocalDraftNow();
      }
    });
  };

  const handleSavePhoto = (photoKey: string) => {
    if (locked) return;
    void enqueueTask(async () => {
      setIsSyncing(true);
      try {
        await persistSinglePhotoLocked(photoKey);
      } finally {
        setIsSyncing(false);
        writeLocalDraftNow();
      }
    });
  };

  const handleSavePost = (postKey: string) => {
    if (locked) return;
    void enqueueTask(async () => {
      setIsSyncing(true);
      try {
        await persistSinglePostLocked(postKey);
      } finally {
        setIsSyncing(false);
        writeLocalDraftNow();
      }
    });
  };

  const handleRemoveMember = (memberKey: string) => {
    setMembers((current) => current.filter((item) => item.key !== memberKey));
    if (yearId && serverBaselineRef.current.knownMembers[memberKey]) {
      void enqueueTask(async () => {
        setIsSyncing(true);
        try {
          const res = await deleteCouncilMemberAction({ yearId, memberId: memberKey });
          if ("ok" in res) {
            const base = serverBaselineRef.current;
            const { [memberKey]: _rmSnap, ...restMembers } = base.members;
            const { [memberKey]: _rmKnown, ...restKnown } = base.knownMembers;
            void _rmSnap;
            void _rmKnown;
            const nextBase: ServerBaseline = {
              ...base,
              members: restMembers,
              knownMembers: restKnown,
            };
            serverBaselineRef.current = nextBase;
            setServerBaseline(nextBase);
            setLastSavedAt(formatClock());
          } else {
            setSyncError(res.error);
          }
        } finally {
          setIsSyncing(false);
          writeLocalDraftNow();
        }
      });
    }
  };

  const handleRemovePhoto = (photoKey: string) => {
    setPhotos((current) => current.filter((item) => item.key !== photoKey));
    if (yearId && serverBaselineRef.current.knownPhotos[photoKey]) {
      void enqueueTask(async () => {
        setIsSyncing(true);
        try {
          const res = await deleteCouncilPhotoAction({ yearId, photoId: photoKey });
          if ("ok" in res) {
            const base = serverBaselineRef.current;
            const { [photoKey]: _rmSnap, ...restPhotos } = base.photos;
            const { [photoKey]: _rmKnown, ...restKnown } = base.knownPhotos;
            void _rmSnap;
            void _rmKnown;
            const nextBase: ServerBaseline = {
              ...base,
              photos: restPhotos,
              knownPhotos: restKnown,
            };
            serverBaselineRef.current = nextBase;
            setServerBaseline(nextBase);
            setLastSavedAt(formatClock());
          } else {
            setSyncError(res.error);
          }
        } finally {
          setIsSyncing(false);
          writeLocalDraftNow();
        }
      });
    }
  };

  const handleRemovePost = (postKey: string) => {
    setPosts((current) => current.filter((item) => item.key !== postKey));
    if (yearId && serverBaselineRef.current.knownPosts[postKey]) {
      void enqueueTask(async () => {
        setIsSyncing(true);
        try {
          const res = await deleteCouncilPostAction({ yearId, postId: postKey });
          if ("ok" in res) {
            const base = serverBaselineRef.current;
            const { [postKey]: _rmSnap, ...restPosts } = base.posts;
            const { [postKey]: _rmKnown, ...restKnown } = base.knownPosts;
            void _rmSnap;
            void _rmKnown;
            const nextBase: ServerBaseline = {
              ...base,
              posts: restPosts,
              knownPosts: restKnown,
            };
            serverBaselineRef.current = nextBase;
            setServerBaseline(nextBase);
            setLastSavedAt(formatClock());
          } else {
            setSyncError(res.error);
          }
        } finally {
          setIsSyncing(false);
          writeLocalDraftNow();
        }
      });
    }
  };

  const handleDiscardRestoredDraft = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(draftStorageKey(year?.id));
      } catch {
        // ignore
      }
    }
    setMeta(initialMetaFromYear(year));
    setSlugTouched(Boolean(year));
    setMembers(initialMembersFromYear(year));
    setPhotos(initialPhotosFromYear(year));
    setPosts(initialPostsFromYear(year));
    setErrorByKey({});
    setRestoredDraftAt(null);
    setSyncError(null);
  };

  const memberSlugs = useMemo(() => councilMemberSlugs(members), [members]);
  const memberPageQuery = publicationStatus === "published" ? "" : "?preview=1";

  const missingRequiredFields: string[] = [];
  if (meta.label.trim().length < 2) missingRequiredFields.push("Year label (at least 2 characters)");
  if (meta.slug.trim().length < 2 || !SLUG_REGEX.test(meta.slug.trim())) {
    missingRequiredFields.push("Address slug (at least 2 lowercase letters/numbers/hyphens)");
  }

  members.forEach((m, idx) => {
    if (!isMemberEmpty(m)) {
      if (m.role.trim().length < 2) missingRequiredFields.push(`Council Post #${idx + 1}: Post / Role`);
      if (m.name.trim().length < 2) missingRequiredFields.push(`Council Post #${idx + 1}: Name`);
    }
  });

  photos.forEach((p, idx) => {
    if (!isPhotoEmpty(p) && !p.url.trim()) {
      missingRequiredFields.push(`Photo #${idx + 1}: Image URL`);
    }
  });

  posts.forEach((p, idx) => {
    if (!isPostEmpty(p)) {
      if (p.title.trim().length < 2) missingRequiredFields.push(`Post #${idx + 1}: Title`);
      if (p.body.trim().length < 10) missingRequiredFields.push(`Post #${idx + 1}: Note (at least 10 characters)`);
      if (p.publishedOn.trim() && !DATE_REGEX.test(p.publishedOn.trim())) {
        missingRequiredFields.push(`Post #${idx + 1}: Valid YYYY-MM-DD Date`);
      }
    }
  });

  const isFormValid = missingRequiredFields.length === 0;
  const incompleteCount =
    members.filter((m) => !isMemberEmpty(m) && validateMember(m) !== null).length +
    photos.filter((p) => !isPhotoEmpty(p) && validatePhoto(p) !== null).length +
    posts.filter((p) => !isPostEmpty(p) && validatePost(p) !== null).length;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isFormValid) {
      event.preventDefault();
      setSyncError(`Please complete required fields before submitting: ${missingRequiredFields.join("; ")}`);
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="grid max-w-3xl gap-8">
      {yearId ? <input type="hidden" name="id" value={yearId} /> : null}

      {/* Sticky Auto-Save & Sync Toolbar */}
      <div className="sticky top-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface/95 px-4 py-3 shadow-xs backdrop-blur">
        <div className="flex items-center gap-2.5 text-xs">
          {isSyncing ? (
            <>
              <Loader2 size={14} className="animate-spin text-navy" />
              <span className="font-medium text-navy">Auto-saving changes to server...</span>
            </>
          ) : syncError ? (
            <>
              <AlertCircle size={14} className="shrink-0 text-red-600" />
              <span className="font-medium text-red-700">{syncError}</span>
            </>
          ) : incompleteCount > 0 ? (
            <>
              <Cloud size={14} className="text-amber-600" />
              <span className="text-amber-800">
                Saved locally &bull; {incompleteCount} card{incompleteCount === 1 ? "" : "s"} need required fields before syncing
              </span>
            </>
          ) : !autoSaveEnabled ? (
            <>
              <CloudOff size={14} className="text-muted" />
              <span className="text-muted">Auto-save paused &bull; Saved locally in browser</span>
            </>
          ) : (
            <>
              <Check size={14} className="text-emerald-600" />
              <span className="font-medium text-ink">
                {lastSavedAt ? `All changes auto-saved (${lastSavedAt})` : "Auto-save ready"}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={locked}
            onClick={() => setAutoSaveEnabled((v) => !v)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              autoSaveEnabled
                ? "border-emerald-200 bg-emerald-500/10 text-emerald-700"
                : "border-line bg-background text-muted"
            }`}
          >
            Auto-save: {autoSaveEnabled ? "On" : "Off"}
          </button>
          <button
            type="button"
            disabled={locked || isSyncing}
            onClick={() => void syncAllDirty()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-95 disabled:opacity-50"
          >
            <Save size={12} />
            Save all now
          </button>
        </div>
      </div>

      {/* Restored Local Draft Banner */}
      {restoredDraftAt ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <p>
            <strong>Recovered unsaved edits</strong> from {restoredDraftAt}. Your uploaded photos and text were kept safe across reload.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void syncAllDirty().then(() => setRestoredDraftAt(null))}
              className="rounded-lg bg-navy px-2.5 py-1 font-medium text-white"
            >
              Sync to server
            </button>
            <button
              type="button"
              onClick={handleDiscardRestoredDraft}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1 font-medium text-amber-900"
            >
              <RotateCcw size={11} />
              Discard draft
            </button>
          </div>
        </div>
      ) : null}

      {state.error ? <p className="rounded-md bg-wash px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      {state.ok ? <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">{state.ok}</p> : null}

      {/* Year Details Section */}
      <fieldset disabled={locked} className="grid gap-4 rounded-xl border border-line bg-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium">Year details</h2>
            <StatusPill status={metaStatus} />
          </div>
          <button
            type="button"
            disabled={locked || metaStatus.state === "saving"}
            onClick={handleSaveMeta}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-wash transition disabled:opacity-50"
          >
            <Save size={12} />
            Save details
          </button>
        </div>
        {metaStatus.state === "error" && metaStatus.message ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{metaStatus.message}</p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            <span>
              Year label <span className="text-red-500 font-bold">*</span>
            </span>
            <input
              name="label"
              value={meta.label}
              required
              placeholder="2025–26"
              className={fieldClass}
              onChange={(event) => {
                const next = event.target.value;
                setMeta((prev) => ({
                  ...prev,
                  label: next,
                  slug: !slugTouched ? slugFromLabel(next) : prev.slug,
                }));
              }}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span>
              Address <span className="text-red-500 font-bold">*</span>
            </span>
            <input
              name="slug"
              value={meta.slug}
              required
              className={fieldClass}
              onChange={(event) => {
                setSlugTouched(true);
                setMeta((prev) => ({ ...prev, slug: event.target.value }));
              }}
            />
          </label>
        </div>
        <label className="grid gap-1.5 text-sm">
          When
          <select
            name="kind"
            value={meta.kind}
            onChange={(event) => setMeta((prev) => ({ ...prev, kind: event.target.value as CouncilKind }))}
            className={fieldClass}
          >
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
          <textarea
            name="summary"
            value={meta.summary}
            rows={3}
            onChange={(event) => setMeta((prev) => ({ ...prev, summary: event.target.value }))}
            className={fieldClass}
          />
        </label>
        <label className="grid max-w-32 gap-1.5 text-sm">
          Order
          <input
            name="sortOrder"
            type="number"
            min={0}
            max={999}
            value={meta.sortOrder}
            onChange={(event) =>
              setMeta((prev) => ({ ...prev, sortOrder: Number(event.target.value || 0) }))
            }
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          Junior section heading
          <input
            name="juniorHeading"
            value={meta.juniorHeading}
            disabled={locked}
            className={fieldClass}
            onChange={(event) => setMeta((prev) => ({ ...prev, juniorHeading: event.target.value }))}
          />
        </label>
        <p className="text-sm text-muted">
          Shown above the junior roster on the public council page. Change it here when the label needs updating.
        </p>
      </fieldset>

      <MemberBoard
        title="Student Council"
        hint="Role, then name. Each post can be saved individually or auto-saved as you work."
        board="main"
        members={members}
        setMembers={setMembers}
        memberStatuses={memberStatuses}
        onSaveMember={handleSaveMember}
        onRemoveMember={handleRemoveMember}
        onImageUploaded={() => scheduleAutoSave(250)}
        locked={locked}
        slug={meta.slug}
        memberSlugs={memberSlugs}
        memberPageQuery={memberPageQuery}
        showProfileFields
      />

      <MemberBoard
        title={meta.juniorHeading || "Junior Student Council"}
        hint="Same captain and vice captain pairing. Photograph and message are optional. Junior posts stay on the year page and do not get a profile page."
        board="junior"
        members={members}
        setMembers={setMembers}
        memberStatuses={memberStatuses}
        onSaveMember={handleSaveMember}
        onRemoveMember={handleRemoveMember}
        onImageUploaded={() => scheduleAutoSave(250)}
        locked={locked}
        slug={meta.slug}
        memberSlugs={memberSlugs}
        memberPageQuery={memberPageQuery}
        showProfileFields={false}
      />

      {/* Teacher in charge */}
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
            <TeacherCard
              key={member.key}
              member={member}
              index={index}
              status={memberStatuses[member.key]}
              locked={locked}
              slug={meta.slug}
              memberSlug={memberSlugs[index]}
              memberPageQuery={memberPageQuery}
              setMembers={setMembers}
              onSave={() => handleSaveMember(member.key)}
              onRemove={() => handleRemoveMember(member.key)}
              onImageUploaded={() => scheduleAutoSave(250)}
            />
          ) : null,
        )}
      </section>

      {/* Photographs */}
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
        {!locked ? (
          <MassImageUploader
            folder="Council"
            title="Mass Upload Council Photographs"
            subtitle="Drop multiple council or event photographs at once — each file uploads in parallel and auto-saves."
            onImageUploaded={({ url, alt }) => {
              setPhotos((current) => [...current, { key: crypto.randomUUID(), url, alt, caption: "" }]);
            }}
            onBatchSettled={({ succeeded }) => {
              if (succeeded > 0) scheduleAutoSave(250);
            }}
          />
        ) : null}
        {photos.length === 0 ? <p className="text-sm text-muted">No photographs yet.</p> : null}
        <ImageUrlHint />
        {photos.map((photo, index) => (
          <PhotoCard
            key={photo.key}
            photo={photo}
            index={index}
            yearLabel={meta.label}
            yearSlug={meta.slug}
            status={photoStatuses[photo.key]}
            locked={locked}
            setPhotos={setPhotos}
            onSave={() => handleSavePhoto(photo.key)}
            onRemove={() => handleRemovePhoto(photo.key)}
            onImageUploaded={() => scheduleAutoSave(250)}
          />
        ))}
      </section>

      {/* Council Updates / Posts */}
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
                {
                  key: crypto.randomUUID(),
                  title: "",
                  body: "",
                  publishedOn: new Date().toISOString().slice(0, 10),
                  imageUrl: "",
                  imageAlt: "",
                },
              ])
            }
          >
            Add a post
          </button>
        </div>
        {posts.length === 0 ? <p className="text-sm text-muted">No posts yet.</p> : null}
        {posts.map((post, index) => (
          <PostCard
            key={post.key}
            post={post}
            index={index}
            status={postStatuses[post.key]}
            locked={locked}
            setPosts={setPosts}
            onSave={() => handleSavePost(post.key)}
            onRemove={() => handleRemovePost(post.key)}
            onImageUploaded={() => scheduleAutoSave(250)}
          />
        ))}
      </section>

      {missingRequiredFields.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-semibold">Some items need required fields before full submit / publish:</p>
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
          {publicationStatus === "published" ? "Save all changes" : "Save full draft"}
        </button>
        {role === "administrator" && yearId ? (
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
        ) : yearId ? (
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

function ConfirmRemoveButton({
  disabled,
  needsConfirm,
  label = "Remove",
  onConfirm,
}: {
  disabled: boolean;
  needsConfirm: boolean;
  label?: string;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setConfirming(false);
            onConfirm();
          }}
          className="text-xs font-semibold text-red-600 hover:underline"
        >
          Confirm remove
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs text-muted hover:text-ink"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (needsConfirm) setConfirming(true);
        else onConfirm();
      }}
      className="text-sm text-muted hover:text-red-600 transition"
    >
      {label}
    </button>
  );
}

function MemberBoard({
  title,
  hint,
  board,
  members,
  setMembers,
  memberStatuses,
  onSaveMember,
  onRemoveMember,
  onImageUploaded,
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
  memberStatuses: Record<string, ItemSyncStatus>;
  onSaveMember: (memberKey: string) => void;
  onRemoveMember: (memberKey: string) => void;
  onImageUploaded: () => void;
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

  // Track visible indices within this board so Move up/down swaps within the same board
  const boardMemberIndices = members
    .map((m, idx) => ({ m, idx }))
    .filter(({ m }) => !isCouncilStaffRole(m.role) && (m.board ?? "main") === board)
    .map(({ idx }) => idx);

  const swapMemberPositions = (fromIndex: number, toIndex: number) => {
    setMembers((current) => {
      const next = [...current];
      const temp = next[fromIndex];
      next[fromIndex] = next[toIndex];
      next[toIndex] = temp;
      return next;
    });
  };

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
      {boardMemberIndices.length === 0 ? (
        <p className="text-sm text-muted">No posts in this section yet.</p>
      ) : null}
      {boardMemberIndices.map((index, boardPosition) => {
        const member = members[index];
        const status = memberStatuses[member.key];
        const canMoveUp = boardPosition > 0;
        const canMoveDown = boardPosition < boardMemberIndices.length - 1;
        const portraitFallback =
          board === "junior" ? "Junior Member portrait" : "Council Member portrait";

        return (
          <div key={member.key} className="grid gap-3 rounded-xl border border-line bg-background p-4">
            <input type="hidden" name={`members.${index}.id`} value={member.key} />
            <input type="hidden" name={`members.${index}.board`} value={board} />

            {/* Card Header with Status + Per-Post Save */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Post #{boardPosition + 1}
                </span>
                {member.role.trim() || member.name.trim() ? (
                  <span className="truncate text-sm font-medium text-ink">
                    {[member.role.trim(), member.name.trim()].filter(Boolean).join(" — ")}
                  </span>
                ) : null}
                <StatusPill status={status} />
              </div>
              <button
                type="button"
                disabled={locked || status?.state === "saving"}
                onClick={() => onSaveMember(member.key)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white shadow-2xs transition hover:opacity-95 disabled:opacity-50"
              >
                <Save size={12} />
                {status?.state === "saving" ? "Saving..." : "Save post"}
              </button>
            </div>

            {status?.state === "error" && status.message ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertCircle size={14} className="shrink-0" />
                <span>{status.message}</span>
              </div>
            ) : status?.state === "incomplete" && status.message ? (
              <p className="text-xs text-amber-700">{status.message}</p>
            ) : null}

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
            <div className="grid gap-3">
              <ImageUploader
                name={`members.${index}.imageUrl`}
                value={member.imageUrl}
                disabled={locked}
                onChange={(url) => {
                  setMembers((current) =>
                    current.map((item) =>
                      item.key === member.key
                        ? {
                            ...item,
                            imageUrl: url,
                            imageAlt: item.imageAlt || `${item.name.trim() || portraitFallback}`,
                          }
                        : item,
                    ),
                  );
                  onImageUploaded();
                }}
                folder="Council"
                targetName={`member-${member.name.trim() || member.role.trim() || `${board}-${boardPosition + 1}`}`}
                label={board === "junior" ? "Junior Member Photograph" : "Member Photograph"}
                hint="Upload portrait to Council folder via RustFS or enter URL."
                aspectRatio="1:1"
              />
              <label className="grid gap-1.5 text-sm">
                <span className="flex items-center justify-between">
                  <span>Photograph description (Alt text)</span>
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
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-2.5">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
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
                  disabled={locked || !canMoveUp}
                  onClick={() => swapMemberPositions(index, boardMemberIndices[boardPosition - 1])}
                  className="disabled:opacity-40"
                >
                  Move up
                </button>
                <button
                  type="button"
                  disabled={locked || !canMoveDown}
                  onClick={() => swapMemberPositions(index, boardMemberIndices[boardPosition + 1])}
                  className="disabled:opacity-40"
                >
                  Move down
                </button>
                <ConfirmRemoveButton
                  disabled={locked}
                  needsConfirm={!isMemberEmpty(member)}
                  onConfirm={() => onRemoveMember(member.key)}
                />
              </div>
              <button
                type="button"
                disabled={locked || status?.state === "saving"}
                onClick={() => onSaveMember(member.key)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-wash transition disabled:opacity-50"
              >
                <Save size={12} />
                {status?.state === "saving" ? "Saving..." : "Save post"}
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function TeacherCard({
  member,
  index,
  status,
  locked,
  slug,
  memberSlug,
  memberPageQuery,
  setMembers,
  onSave,
  onRemove,
  onImageUploaded,
}: {
  member: MemberDraft;
  index: number;
  status?: ItemSyncStatus;
  locked: boolean;
  slug: string;
  memberSlug?: string;
  memberPageQuery: string;
  setMembers: Dispatch<SetStateAction<MemberDraft[]>>;
  onSave: () => void;
  onRemove: () => void;
  onImageUploaded: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-line bg-background p-4">
      <input type="hidden" name={`members.${index}.id`} value={member.key} />
      <input type="hidden" name={`members.${index}.board`} value="main" />

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            {member.role || "Teacher in charge"}
          </span>
          {member.name.trim() ? <span className="text-sm font-medium text-ink">— {member.name.trim()}</span> : null}
          <StatusPill status={status} />
        </div>
        <button
          type="button"
          disabled={locked || status?.state === "saving"}
          onClick={onSave}
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white shadow-2xs transition hover:opacity-95 disabled:opacity-50"
        >
          <Save size={12} />
          {status?.state === "saving" ? "Saving..." : "Save post"}
        </button>
      </div>

      {status?.state === "error" && status.message ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle size={14} className="shrink-0" />
          <span>{status.message}</span>
        </div>
      ) : status?.state === "incomplete" && status.message ? (
        <p className="text-xs text-amber-700">{status.message}</p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
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
            {(staffRoleOptions as readonly string[]).includes(member.role) ? null : (
              <option value={member.role}>{member.role}</option>
            )}
            {staffRoleOptions.map((roleOption) => (
              <option key={roleOption} value={roleOption}>
                {roleOption}
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
      </div>
      <div className="grid gap-3">
        <ImageUploader
          name={`members.${index}.imageUrl`}
          value={member.imageUrl}
          disabled={locked}
          onChange={(url) => {
            setMembers((current) =>
              current.map((item) =>
                item.key === member.key
                  ? {
                      ...item,
                      imageUrl: url,
                      imageAlt: item.imageAlt || `${item.name.trim() || "Council Member"} portrait`,
                    }
                  : item,
              ),
            );
            onImageUploaded();
          }}
          folder="Council"
          targetName={`member-${member.name.trim() || member.role.trim() || `senior-${index + 1}`}`}
          label="Member Photograph"
          hint="Upload portrait to Council folder via RustFS or enter direct URL."
          aspectRatio="1:1"
        />
        <label className="grid gap-1.5 text-sm">
          <span>Photograph description (Alt text)</span>
          <input
            name={`members.${index}.imageAlt`}
            value={member.imageAlt}
            disabled={locked}
            placeholder={`${member.name.trim() || "Council Member"} portrait`}
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-2.5">
        <div className="flex items-center gap-4 text-sm">
          {slug && member.name.trim() && memberSlug ? (
            <a
              href={`/council/${slug}/${memberSlug}${memberPageQuery}`}
              className="text-accent"
              target="_blank"
              rel="noreferrer"
            >
              Open page
            </a>
          ) : null}
          <ConfirmRemoveButton
            disabled={locked}
            needsConfirm={Boolean(member.name.trim() || member.imageUrl.trim() || member.about.trim())}
            onConfirm={onRemove}
          />
        </div>
        <button
          type="button"
          disabled={locked || status?.state === "saving"}
          onClick={onSave}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-wash transition disabled:opacity-50"
        >
          <Save size={12} />
          {status?.state === "saving" ? "Saving..." : "Save post"}
        </button>
      </div>
    </div>
  );
}

function PhotoCard({
  photo,
  index,
  yearLabel,
  yearSlug,
  status,
  locked,
  setPhotos,
  onSave,
  onRemove,
  onImageUploaded,
}: {
  photo: PhotoDraft;
  index: number;
  yearLabel: string;
  yearSlug: string;
  status?: ItemSyncStatus;
  locked: boolean;
  setPhotos: Dispatch<SetStateAction<PhotoDraft[]>>;
  onSave: () => void;
  onRemove: () => void;
  onImageUploaded: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-line bg-background p-4">
      <input type="hidden" name={`photos.${index}.id`} value={photo.key} />

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Photograph #{index + 1}
          </span>
          <StatusPill status={status} />
        </div>
        <button
          type="button"
          disabled={locked || status?.state === "saving"}
          onClick={onSave}
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white shadow-2xs transition hover:opacity-95 disabled:opacity-50"
        >
          <Save size={12} />
          {status?.state === "saving" ? "Saving..." : "Save photo"}
        </button>
      </div>

      {status?.state === "error" && status.message ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle size={14} className="shrink-0" />
          <span>{status.message}</span>
        </div>
      ) : status?.state === "incomplete" && status.message ? (
        <p className="text-xs text-amber-700">{status.message}</p>
      ) : null}

      <ImageUploader
        name={`photos.${index}.url`}
        value={photo.url}
        disabled={locked}
        onChange={(url) => {
          setPhotos((current) =>
            current.map((item) =>
              item.key === photo.key
                ? {
                    ...item,
                    url,
                    alt: item.alt || yearLabel || `Council photograph #${index + 1}`,
                  }
                : item,
            ),
          );
          onImageUploaded();
        }}
        folder="Council"
        targetName={`council-${yearSlug || slugFromLabel(yearLabel) || "year"}-photo-${index + 1}`}
        label={`Council Gallery Photograph #${index + 1}`}
        hint="Upload directly to Council folder via RustFS or enter direct URL."
        aspectRatio="16:10"
      />
      <label className="grid gap-1.5 text-sm">
        <span className="flex items-center justify-between">
          <span>Alternative text</span>
          <span className="text-[11px] text-muted">Auto-fills</span>
        </span>
        <input
          name={`photos.${index}.alt`}
          value={photo.alt}
          disabled={locked}
          placeholder={yearLabel || "Student Council photograph"}
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
      <div className="flex items-center justify-between gap-3 border-t border-line/60 pt-2.5">
        <ConfirmRemoveButton
          disabled={locked}
          needsConfirm={!isPhotoEmpty(photo)}
          label="Remove photograph"
          onConfirm={onRemove}
        />
        <button
          type="button"
          disabled={locked || status?.state === "saving"}
          onClick={onSave}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-wash transition disabled:opacity-50"
        >
          <Save size={12} />
          {status?.state === "saving" ? "Saving..." : "Save photo"}
        </button>
      </div>
    </div>
  );
}

function PostCard({
  post,
  index,
  status,
  locked,
  setPosts,
  onSave,
  onRemove,
  onImageUploaded,
}: {
  post: PostDraft;
  index: number;
  status?: ItemSyncStatus;
  locked: boolean;
  setPosts: Dispatch<SetStateAction<PostDraft[]>>;
  onSave: () => void;
  onRemove: () => void;
  onImageUploaded: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-line bg-background p-4">
      <input type="hidden" name={`posts.${index}.id`} value={post.key} />

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Post #{index + 1}
          </span>
          {post.title.trim() ? (
            <span className="truncate text-sm font-medium text-ink">— {post.title.trim()}</span>
          ) : null}
          <StatusPill status={status} />
        </div>
        <button
          type="button"
          disabled={locked || status?.state === "saving"}
          onClick={onSave}
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white shadow-2xs transition hover:opacity-95 disabled:opacity-50"
        >
          <Save size={12} />
          {status?.state === "saving" ? "Saving..." : "Save post"}
        </button>
      </div>

      {status?.state === "error" && status.message ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle size={14} className="shrink-0" />
          <span>{status.message}</span>
        </div>
      ) : status?.state === "incomplete" && status.message ? (
        <p className="text-xs text-amber-700">{status.message}</p>
      ) : null}

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
        <span>Date</span>
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
      <ImageUploader
        name={`posts.${index}.imageUrl`}
        value={post.imageUrl}
        disabled={locked}
        onChange={(url) => {
          setPosts((current) =>
            current.map((item) => (item.key === post.key ? { ...item, imageUrl: url } : item)),
          );
          onImageUploaded();
        }}
        folder="Council"
        targetName={`council-post-${index + 1}`}
        label="Post Photograph (Optional)"
        hint="Upload update photograph to Council folder via RustFS or enter URL."
        aspectRatio="16:10"
      />
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
      <div className="flex items-center justify-between gap-3 border-t border-line/60 pt-2.5">
        <ConfirmRemoveButton
          disabled={locked}
          needsConfirm={!isPostEmpty(post)}
          label="Remove post"
          onConfirm={onRemove}
        />
        <button
          type="button"
          disabled={locked || status?.state === "saving"}
          onClick={onSave}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-wash transition disabled:opacity-50"
        >
          <Save size={12} />
          {status?.state === "saving" ? "Saving..." : "Save post"}
        </button>
      </div>
    </div>
  );
}
