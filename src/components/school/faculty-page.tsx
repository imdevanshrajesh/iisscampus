"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Eye,
  GraduationCap,
  Mail,
  Pencil,
  Plus,
  Quote,
  Settings2,
} from "lucide-react";
import { FacultyForm } from "@/components/manage/faculty-form";
import { FACULTY_TIER_META, groupFacultyByTier } from "@/lib/faculty";
import { classifyMediaUrl } from "@/lib/media/url";
import type { FacultyMember, FacultyTier } from "@/lib/types";

type ModalState = {
  member: FacultyMember | null;
  defaultTier: FacultyTier;
  defaultRole?: string;
} | null;

function safePhotoSrc(rawUrl: string | null, hosts: readonly string[]): string | null {
  if (!rawUrl) return null;
  const check = classifyMediaUrl(rawUrl, hosts);
  return check.ok ? check.url : null;
}

function initialsFor(name: string): string {
  const parts = name
    .replace(/\b(Mr\.?|Mrs\.?|Ms\.?|Dr\.?)\b/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return name.slice(0, 2).toUpperCase() || "FC";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function PrincipalHeroCard({
  member,
  hosts,
  canEdit,
  onEdit,
}: {
  member: FacultyMember;
  hosts: readonly string[];
  canEdit: boolean;
  onEdit: () => void;
}) {
  const photoSrc = safePhotoSrc(member.photoUrl, hosts);

  return (
    <article className="relative overflow-hidden rounded-3xl border border-gold/45 bg-white shadow-[0_14px_44px_rgba(28,36,56,0.07)]">
      {canEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-line bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-navy shadow-sm backdrop-blur-sm transition hover:border-navy hover:bg-navy hover:text-white cursor-pointer"
        >
          <Pencil className="h-3.5 w-3.5" />
          <span>Edit</span>
        </button>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Big Principal Portrait */}
        <div className="relative lg:col-span-5 min-h-[340px] sm:min-h-[420px] lg:min-h-[480px] bg-gradient-to-br from-navy/[0.06] via-background to-gold/20">
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoSrc}
              alt={member.name}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full min-h-[340px] sm:min-h-[420px] lg:min-h-[480px] w-full flex-col items-center justify-center p-8 text-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-gold/40 bg-white/80 font-display text-4xl font-semibold text-navy shadow-sm">
                {initialsFor(member.name)}
              </div>
              <p className="mt-3 text-xs font-medium uppercase tracking-widest text-muted">
                Principal Portrait
              </p>
            </div>
          )}
        </div>

        {/* Name & Message */}
        <div className="lg:col-span-7 flex flex-col justify-center p-7 sm:p-10 lg:p-14">
          <div className="flex flex-wrap items-center gap-2 pr-16">
            <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
              {member.role || "Principal"}
            </span>
            {member.department ? (
              <span className="rounded-full bg-navy/5 px-3 py-1 text-xs font-medium text-navy">
                {member.department}
              </span>
            ) : null}
            {!member.published ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
                Hidden Draft
              </span>
            ) : null}
          </div>

          <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold leading-tight tracking-tight text-ink">
            {member.name}
          </h2>

          {member.message ? (
            <div className="mt-6 border-t border-line/70 pt-6">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                <Quote className="h-4 w-4 text-accent/70" />
                <span>Principal&apos;s Message</span>
              </div>
              <blockquote className="whitespace-pre-line font-serif text-base sm:text-lg leading-relaxed text-ink/85">
                {member.message}
              </blockquote>
            </div>
          ) : canEdit ? (
            <p className="mt-5 text-sm italic text-muted">
              No message added yet. Click Edit to add the Principal&apos;s message.
            </p>
          ) : null}

          {member.email ? (
            <div className="mt-6 pt-4 border-t border-line/50">
              <a
                href={`mailto:${member.email}`}
                className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-ink"
              >
                <Mail className="h-4 w-4 text-accent" />
                <span>{member.email}</span>
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function FacultyMemberCard({
  member,
  hosts,
  canEdit,
  prominent = false,
  onEdit,
}: {
  member: FacultyMember;
  hosts: readonly string[];
  canEdit: boolean;
  prominent?: boolean;
  onEdit: () => void;
}) {
  const photoSrc = safePhotoSrc(member.photoUrl, hosts);

  return (
    <article
      className={`relative flex flex-col justify-between rounded-3xl border border-line bg-white text-center shadow-[0_2px_14px_rgba(28,36,56,0.04)] transition hover:shadow-[0_8px_28px_rgba(28,36,56,0.07)] ${
        prominent ? "p-7 sm:p-9" : "p-6 sm:p-7"
      }`}
    >
      {canEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-navy shadow-2xs transition hover:border-navy hover:bg-navy hover:text-white cursor-pointer"
        >
          <Pencil className="h-3 w-3" />
          <span>Edit</span>
        </button>
      ) : null}

      <div className="flex flex-col items-center">
        <div
          className={`relative overflow-hidden rounded-full border-2 border-gold/35 bg-gradient-to-br from-navy/[0.06] to-gold/15 shadow-sm ${
            prominent ? "h-32 w-32 sm:h-36 sm:w-36" : "h-24 w-24 sm:h-28 sm:w-28"
          }`}
        >
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoSrc}
              alt={member.name}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-2xl font-semibold text-navy">
              {initialsFor(member.name)}
            </div>
          )}
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="rounded-full bg-navy/5 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
              {member.role}
            </span>
            {!member.published ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                Hidden
              </span>
            ) : null}
          </div>

          <h3
            className={`font-display font-semibold tracking-tight text-ink ${
              prominent ? "text-2xl sm:text-[1.7rem]" : "text-xl sm:text-2xl"
            }`}
          >
            {member.name}
          </h3>

          {member.department ? (
            <p className="text-xs font-medium text-muted">{member.department}</p>
          ) : null}
        </div>

        {member.message ? (
          <p className="mt-4 w-full border-t border-line/60 pt-4 whitespace-pre-line font-serif text-sm leading-relaxed text-ink/80">
            {member.message}
          </p>
        ) : null}
      </div>

      {member.email ? (
        <div className="mt-5 border-t border-line/50 pt-3.5">
          <a
            href={`mailto:${member.email}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-ink"
          >
            <Mail className="h-3.5 w-3.5 text-accent" />
            <span>{member.email}</span>
          </a>
        </div>
      ) : null}
    </article>
  );
}

function gridClassForCount(count: number, maxTwoColumns = false) {
  if (count <= 1) return "grid grid-cols-1 max-w-md mx-auto gap-6";
  if (count === 2 || maxTwoColumns) return "grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-6";
  return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto gap-6";
}

export function FacultyPage({
  items,
  hosts,
  canEdit,
  tableMissing = false,
  queryError,
}: {
  items: FacultyMember[];
  hosts: readonly string[];
  canEdit: boolean;
  tableMissing?: boolean;
  queryError?: string;
}) {
  const [editMode, setEditMode] = useState(canEdit);
  const [modal, setModal] = useState<ModalState>(null);

  const grouped = useMemo(() => groupFacultyByTier(items), [items]);
  const showEditControls = canEdit && editMode;

  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal]);

  const lowerTiers = FACULTY_TIER_META.filter((meta) => meta.tier !== "principal");

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-20">
      {/* Header */}
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          School Leadership &amp; Administration
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-ink">
          Campus <span className="italic">Faculty</span>
        </h1>
        <p className="mt-4 text-base md:text-lg leading-relaxed text-ink/75">
          Meet our Principal, Vice Principals, Headmistress &amp; Headmaster, and Supervisors guiding academic life across campus.
        </p>
      </header>

      {/* Staff Inline Control Bar (only when signed in with edit access) */}
      {canEdit ? (
        <div className="mx-auto mt-8 max-w-5xl rounded-2xl border border-line bg-white/90 px-4 py-3 shadow-xs backdrop-blur-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="font-semibold text-ink">
                On-Page Editing {editMode ? "Active" : "Paused"}
              </span>
              <span className="hidden sm:inline text-muted">
                · Changes save directly to the database
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setEditMode((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-surface cursor-pointer"
              >
                {editMode ? (
                  <>
                    <Eye className="h-3.5 w-3.5 text-muted" />
                    <span>Preview Visitor View</span>
                  </>
                ) : (
                  <>
                    <Pencil className="h-3.5 w-3.5 text-accent" />
                    <span>Edit on Page</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setModal({ member: null, defaultTier: "supervisor", defaultRole: "Supervisor" })
                }
                className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-navy/90 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Faculty Member</span>
              </button>

              <Link
                href="/manage/faculty"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-navy transition hover:border-navy/30"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>Manage Console</span>
              </Link>
            </div>
          </div>

          {tableMissing ? (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-950">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <p>
                Database table <code className="font-mono font-semibold">public.campus_faculty</code>{" "}
                has not been created in Supabase yet. Run{" "}
                <code className="font-mono font-semibold">
                  supabase/migrations/20261112120000_campus_faculty.sql
                </code>{" "}
                in the Supabase SQL Editor, then refresh this page.
              </p>
            </div>
          ) : queryError ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-900">
              Could not load faculty from database: {queryError}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Faculty Hierarchy Sections */}
      <div className="mt-12 space-y-16">
        {/* 1. Principal — Big Featured Section */}
        {grouped.principal.length > 0 || showEditControls ? (
          <section className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="mx-auto text-center sm:mx-0 sm:text-left">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                  Principal
                </p>
              </div>
              {showEditControls ? (
                <button
                  type="button"
                  onClick={() =>
                    setModal({ member: null, defaultTier: "principal", defaultRole: "Principal" })
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-navy transition hover:border-navy/40 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Principal</span>
                </button>
              ) : null}
            </div>

            {grouped.principal.length > 0 ? (
              <div className="space-y-8">
                {grouped.principal.map((member) => (
                  <PrincipalHeroCard
                    key={member.id}
                    member={member}
                    hosts={hosts}
                    canEdit={showEditControls}
                    onEdit={() => setModal({ member, defaultTier: member.tier })}
                  />
                ))}
              </div>
            ) : showEditControls ? (
              <div className="rounded-3xl border border-dashed border-line bg-white/70 p-10 text-center">
                <GraduationCap className="mx-auto h-9 w-9 text-muted" />
                <p className="mt-3 font-display text-xl font-medium text-ink">
                  No Principal record in the database yet
                </p>
                <p className="mt-1 text-xs text-muted">
                  Add the Principal&apos;s portrait photo, name, and message here.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setModal({ member: null, defaultTier: "principal", defaultRole: "Principal" })
                  }
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white transition hover:bg-navy/90 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Principal</span>
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* 2. Vice Principals, 3. Headmistress & Headmaster, 4. Supervisors */}
        {lowerTiers.map((meta) => {
          const members = grouped[meta.tier];
          if (members.length === 0 && !showEditControls) return null;

          return (
            <section key={meta.tier} className="space-y-6">
              <div className="mx-auto max-w-5xl">
                <div className="flex flex-col items-center gap-3 text-center">
                  <span className="rounded-full border border-navy/15 bg-navy/5 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-navy">
                    {meta.sectionTitle}
                  </span>
                  <p className="text-sm text-muted">{meta.sectionSubtitle}</p>
                  {showEditControls ? (
                    <button
                      type="button"
                      onClick={() =>
                        setModal({
                          member: null,
                          defaultTier: meta.tier,
                          defaultRole: meta.defaultRole,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-navy transition hover:border-navy/40 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add {meta.singularLabel}</span>
                    </button>
                  ) : null}
                </div>
              </div>

              {members.length > 0 ? (
                <div className={gridClassForCount(members.length, meta.tier === "vice_principal")}>
                  {members.map((member) => (
                    <FacultyMemberCard
                      key={member.id}
                      member={member}
                      hosts={hosts}
                      canEdit={showEditControls}
                      prominent={meta.tier === "vice_principal"}
                      onEdit={() => setModal({ member, defaultTier: member.tier })}
                    />
                  ))}
                </div>
              ) : showEditControls ? (
                <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-line bg-white/60 p-6 text-center text-xs text-muted">
                  No {meta.label.toLowerCase()} in the database yet. Use &ldquo;Add{" "}
                  {meta.singularLabel}&rdquo; above to add one.
                </div>
              ) : null}
            </section>
          );
        })}

        {/* Clean Empty State for Public Visitors */}
        {items.length === 0 && !showEditControls ? (
          <div className="mx-auto max-w-md rounded-3xl border border-dashed border-line bg-white/70 px-6 py-14 text-center">
            <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted" />
            <h2 className="font-display text-xl font-medium text-ink">
              Faculty Directory Coming Soon
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              Faculty profiles and leadership messages will appear here once published from the database.
            </p>
          </div>
        ) : null}
      </div>

      {/* Inline Edit / Create Modal */}
      {modal ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-ink/50 p-4 backdrop-blur-xs sm:p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) setModal(null);
          }}
        >
          <div className="mx-auto my-6 max-w-2xl">
            <FacultyForm
              key={modal.member?.id ?? `new-${modal.defaultTier}`}
              member={modal.member}
              defaultTier={modal.defaultTier}
              defaultRole={modal.defaultRole}
              variant="modal"
              onClose={() => setModal(null)}
              onSaved={() => setModal(null)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
