import { GraduationCap, Mail, Quote } from "lucide-react";
import { FACULTY_TIER_META, groupFacultyByTier } from "@/lib/faculty";
import { classifyMediaUrl } from "@/lib/media/url";
import type { FacultyMember } from "@/lib/types";

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
}: {
  member: FacultyMember;
  hosts: readonly string[];
}) {
  const photoSrc = safePhotoSrc(member.photoUrl, hosts);

  return (
    <article className="overflow-hidden rounded-3xl border border-gold/45 bg-white shadow-[0_14px_44px_rgba(28,36,56,0.07)]">
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
                Principal
              </p>
            </div>
          )}
        </div>

        {/* Name & Message */}
        <div className="lg:col-span-7 flex flex-col justify-center p-7 sm:p-10 lg:p-14">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
              {member.role || "Principal"}
            </span>
            {member.department ? (
              <span className="rounded-full bg-navy/5 px-3 py-1 text-xs font-medium text-navy">
                {member.department}
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
          ) : null}

          {member.email ? (
            <div className="mt-6 border-t border-line/50 pt-4">
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
  prominent = false,
}: {
  member: FacultyMember;
  hosts: readonly string[];
  prominent?: boolean;
}) {
  const photoSrc = safePhotoSrc(member.photoUrl, hosts);

  return (
    <article
      className={`flex flex-col justify-between rounded-3xl border border-line bg-white text-center shadow-[0_2px_14px_rgba(28,36,56,0.04)] transition hover:shadow-[0_8px_28px_rgba(28,36,56,0.07)] ${
        prominent ? "p-7 sm:p-9" : "p-6 sm:p-7"
      }`}
    >
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
          <span className="inline-block rounded-full bg-navy/5 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
            {member.role}
          </span>

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
}: {
  items: FacultyMember[];
  hosts: readonly string[];
}) {
  const grouped = groupFacultyByTier(items);
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

      {/* Faculty Hierarchy Sections */}
      <div className="mt-12 space-y-16">
        {/* 1. Principal — Big Featured Section */}
        {grouped.principal.length > 0 ? (
          <section className="mx-auto max-w-5xl space-y-6">
            <div className="text-center sm:text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                Principal
              </p>
            </div>
            <div className="space-y-8">
              {grouped.principal.map((member) => (
                <PrincipalHeroCard key={member.id} member={member} hosts={hosts} />
              ))}
            </div>
          </section>
        ) : null}

        {/* 2. Vice Principals, 3. Headmistress & Headmaster, 4. Supervisors */}
        {lowerTiers.map((meta) => {
          const members = grouped[meta.tier];
          if (members.length === 0) return null;

          return (
            <section key={meta.tier} className="space-y-6">
              <div className="mx-auto max-w-5xl text-center">
                <span className="inline-block rounded-full border border-navy/15 bg-navy/5 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-navy">
                  {meta.sectionTitle}
                </span>
                <p className="mt-2.5 text-sm text-muted">{meta.sectionSubtitle}</p>
              </div>

              <div className={gridClassForCount(members.length, meta.tier === "vice_principal")}>
                {members.map((member) => (
                  <FacultyMemberCard
                    key={member.id}
                    member={member}
                    hosts={hosts}
                    prominent={meta.tier === "vice_principal"}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* Clean Empty State */}
        {items.length === 0 ? (
          <div className="mx-auto max-w-md rounded-3xl border border-dashed border-line bg-white/70 px-6 py-14 text-center">
            <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted" />
            <h2 className="font-display text-xl font-medium text-ink">
              Faculty Directory Coming Soon
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              Faculty profiles and leadership messages will appear here once published by the school administration.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
