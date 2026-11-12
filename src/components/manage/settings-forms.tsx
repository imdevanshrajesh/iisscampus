"use client";

import { useActionState, useRef, useState } from "react";
import { FormAutoSave } from "@/components/manage/form-auto-save";
import { ImageUploader } from "@/components/manage/image-uploader";
import {
  grantRole,
  saveAcademicTerm,
  saveContactEmail,
  saveCouncilLogo,
  saveNavBrand,
  saveSettings,
  saveSocial,
  type ActionState,
} from "@/lib/manage/actions";
import {
  hasActiveTerm,
  matchesAcademicTerm,
  suggestNextTermLabel,
  type TermMatchRecord,
} from "@/lib/terms";
import type { AcademicTermConfig, CouncilYear, ExtraSiteLink, SocialLinks } from "@/lib/types";
import { IMAGE_URL_EXAMPLE, RECOMMENDED_IMAGE_HOST } from "@/lib/media/guide";

const fieldClass = "w-full rounded-md border border-line bg-white px-3 py-2 text-sm";

export function AcademicTermForm({
  activeTerm,
  eventRecords = [],
  achievementRecords = [],
  announcementRecords = [],
  currentCouncilLabels = [],
}: {
  activeTerm: AcademicTermConfig;
  eventRecords?: TermMatchRecord[];
  achievementRecords?: TermMatchRecord[];
  announcementRecords?: TermMatchRecord[];
  currentCouncilLabels?: { id: string; label: string; kind: CouncilYear["kind"] }[];
}) {
  const [state, action, pending] = useActionState(saveAcademicTerm, {} as ActionState);
  const [label, setLabel] = useState(activeTerm.label ?? "");
  const [startDate, setStartDate] = useState(activeTerm.startDate ?? "");
  const [demoteOldCouncil, setDemoteOldCouncil] = useState(false);

  const draftTerm: AcademicTermConfig = {
    label: label.trim() || null,
    startDate: startDate.trim() || null,
  };
  const filteringActive = hasActiveTerm(draftTerm);
  const suggestedNext = suggestNextTermLabel(label || activeTerm.label);
  const currentCouncils = currentCouncilLabels.filter((y) => y.kind === "current");

  const visibleEvents = filteringActive
    ? eventRecords.filter((r) => matchesAcademicTerm(r, draftTerm)).length
    : eventRecords.length;
  const visibleAchievements = filteringActive
    ? achievementRecords.filter((r) => matchesAcademicTerm(r, draftTerm)).length
    : achievementRecords.length;
  const visibleAnnouncements = filteringActive
    ? announcementRecords.filter((r) => matchesAcademicTerm(r, draftTerm)).length
    : announcementRecords.length;

  return (
    <form action={action} className="grid max-w-2xl gap-4 rounded-xl border border-line bg-white p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span>Active term / academic year</span>
          <input
            name="activeTermLabel"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={32}
            placeholder="e.g. 2026-2027"
            className={fieldClass}
          />
          <span className="text-xs text-muted">
            New events, achievements, notices, and Instagram highlights auto-tag with this label when saved.
          </span>
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>Term start date (optional cutoff)</span>
          <input
            type="date"
            name="activeTermStart"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={fieldClass}
          />
          <span className="text-xs text-muted">
            Older items dated before this cutoff (without matching the label) stay preserved in archives and off main pages.
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setLabel(suggestedNext)}
          className="rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink hover:border-ink/40"
        >
          Fill next term ({suggestedNext})
        </button>
        {(label || startDate) && (
          <button
            type="button"
            onClick={() => {
              setLabel("");
              setStartDate("");
              setDemoteOldCouncil(false);
            }}
            className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:text-ink"
          >
            Clear filter inputs
          </button>
        )}
      </div>

      <div className="rounded-lg border border-line/80 bg-paper px-3.5 py-3 text-xs leading-5 text-muted">
        {filteringActive ? (
          <>
            <p className="font-semibold text-ink">
              Public visibility preview ({draftTerm.label || `From ${draftTerm.startDate}`}):
            </p>
            <p className="mt-1">
              Events &amp; competitions: <strong className="text-ink">{visibleEvents}</strong> of{" "}
              {eventRecords.length} on main pages ({Math.max(0, eventRecords.length - visibleEvents)} archived)
              {" · "}
              Achievements: <strong className="text-ink">{visibleAchievements}</strong> of{" "}
              {achievementRecords.length} ({Math.max(0, achievementRecords.length - visibleAchievements)} archived)
              {" · "}
              Notices: <strong className="text-ink">{visibleAnnouncements}</strong> of{" "}
              {announcementRecords.length} ({Math.max(0, announcementRecords.length - visibleAnnouncements)} archived)
            </p>
          </>
        ) : (
          <p>
            No active term filter set — all {eventRecords.length} events, {achievementRecords.length} achievements, and{" "}
            {announcementRecords.length} notices remain in main feeds until a term is set for rollover.
          </p>
        )}
      </div>

      {currentCouncils.length > 0 && (
        <label className="flex items-start gap-2.5 rounded-lg border border-line bg-paper/60 px-3.5 py-2.5 text-xs leading-5 text-ink">
          <input
            type="checkbox"
            name="demoteOldCouncil"
            checked={demoteOldCouncil}
            onChange={(e) => setDemoteOldCouncil(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <strong>Roll over Student Council:</strong> move currently sitting{" "}
            {currentCouncils.map((c) => c.label).join(", ")} to <em>Earlier</em> (collapsed archive at the bottom of
            /council) when saving this term.
          </span>
        </label>
      )}

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-ink px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save active term"}
        </button>
        <span className="text-xs text-muted">
          Nothing is ever deleted on rollover — historical terms stay browsable in year archives and collapsed accordions.
        </span>
      </div>
    </form>
  );
}

export function HostForm({ hosts }: { hosts: string[] }) {
  const [state, action, pending] = useActionState(saveSettings, {} as ActionState);
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={action} className="grid max-w-xl gap-3">
      <FormAutoSave
        formRef={formRef}
        draftKey="settings:hosts"
        serverAction={saveSettings}
        externalSuccess={state.ok}
        externalError={state.error}
        compact
      />
      <label className="grid gap-1.5 text-sm">
        Approved image hosts
        <textarea
          name="mediaHosts"
          defaultValue={hosts.join("\n")}
          rows={6}
          className={fieldClass}
          placeholder={RECOMMENDED_IMAGE_HOST}
        />
      </label>
      <p className="text-xs leading-5 text-muted">
        One hostname per line, without <span className="font-mono">https://</span> or paths. For Cloudinary, use{" "}
        <span className="font-mono">{RECOMMENDED_IMAGE_HOST}</span>. Google Drive sharing links stay blocked even if
        added here.
      </p>
      {state.error ? <p className="text-sm">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
      <button type="submit" disabled={pending} className="justify-self-start rounded-md bg-ink px-4 py-2 text-sm text-white">Save hosts</button>
    </form>
  );
}

export function CouncilLogoForm({ logoUrl }: { logoUrl: string | null }) {
  const [state, action, pending] = useActionState(saveCouncilLogo, {} as ActionState);
  const [currentLogoUrl, setCurrentLogoUrl] = useState(logoUrl ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={action} className="grid max-w-xl gap-3">
      <FormAutoSave
        formRef={formRef}
        draftKey="settings:council-logo"
        serverAction={saveCouncilLogo}
        externalSuccess={state.ok}
        externalError={state.error}
        compact
        watchValue={currentLogoUrl}
        onRestoreDraft={(fields) => {
          if (fields.councilLogoUrl?.[0] !== undefined) setCurrentLogoUrl(fields.councilLogoUrl[0]);
        }}
      />
      <ImageUploader
        name="councilLogoUrl"
        value={currentLogoUrl}
        onChange={setCurrentLogoUrl}
        folder="Council"
        targetName="council-logo"
        label="Council Logo Photograph / Crest"
        hint="Used on the council page, the intro, the admin bar, and the site icon. RustFS upload supported."
        aspectRatio="1:1"
      />
      <p className="text-xs leading-5 text-muted">
        Leave blank to use the logo saved in the project. The host must be listed under image hosts.
      </p>
      {state.error ? <p className="text-sm">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
      <button type="submit" disabled={pending} className="justify-self-start rounded-md bg-ink px-4 py-2 text-sm text-white">
        Save logo
      </button>
    </form>
  );
}

export function NavBrandForm({
  logoUrl,
  href,
  label,
}: {
  logoUrl: string | null;
  href: string | null;
  label: string;
}) {
  const [state, action, pending] = useActionState(saveNavBrand, {} as ActionState);
  const [currentNavLogo, setCurrentNavLogo] = useState(logoUrl ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={action} className="grid max-w-xl gap-3">
      <FormAutoSave
        formRef={formRef}
        draftKey="settings:nav-brand"
        serverAction={saveNavBrand}
        externalSuccess={state.ok}
        externalError={state.error}
        compact
        watchValue={currentNavLogo}
        onRestoreDraft={(fields) => {
          if (fields.navLogoUrl?.[0] !== undefined) setCurrentNavLogo(fields.navLogoUrl[0]);
        }}
      />
      <label className="grid gap-1.5 text-sm">
        Name
        <input name="navLabel" defaultValue={label} maxLength={40} className={fieldClass} />
      </label>
      <ImageUploader
        name="navLogoUrl"
        value={currentNavLogo}
        onChange={setCurrentNavLogo}
        folder="General"
        targetName="navbar-logo"
        label="Navbar Logo Photograph / Crest"
        hint="This logo is shown in the top bar. RustFS upload supported."
        aspectRatio="1:1"
      />
      <label className="grid gap-1.5 text-sm">
        Link
        <input name="navLogoHref" defaultValue={href ?? ""} className={fieldClass} placeholder="/ or https://" />
      </label>
      <p className="text-xs leading-5 text-muted">
        This logo and name are only in the top bar. Leave the logo blank to keep using the council logo there. Leave the link blank to open the home page.
      </p>
      {state.error ? <p className="text-sm">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
      <button type="submit" disabled={pending} className="justify-self-start rounded-md bg-ink px-4 py-2 text-sm text-white">
        Save navbar
      </button>
    </form>
  );
}

export function ContactEmailForm({ contactEmail }: { contactEmail: string | null }) {
  const [state, action, pending] = useActionState(saveContactEmail, {} as ActionState);
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={action} className="grid max-w-xl gap-3">
      <FormAutoSave
        formRef={formRef}
        draftKey="settings:contact-email"
        serverAction={saveContactEmail}
        externalSuccess={state.ok}
        externalError={state.error}
        compact
      />
      <label className="grid gap-1.5 text-sm">
        Contact email
        <input
          name="contactEmail"
          type="email"
          defaultValue={contactEmail ?? ""}
          className={fieldClass}
          placeholder="council@example.com"
          autoComplete="email"
        />
      </label>
      <p className="text-xs leading-5 text-muted">
        Shown on the About page and in the footer as Send feedback. Visitors open their mail app to write to this address. Leave blank to hide the link.
      </p>
      {state.error ? <p className="text-sm">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
      <button type="submit" disabled={pending} className="justify-self-start rounded-md bg-ink px-4 py-2 text-sm text-white">
        Save contact email
      </button>
    </form>
  );
}

function LinkFields({
  title,
  hint,
  labelName,
  urlName,
  label,
  url,
}: {
  title: string;
  hint: string;
  labelName: string;
  urlName: string;
  label: string;
  url: string;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-line p-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted">{hint}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          Label
          <input name={labelName} defaultValue={label} className={fieldClass} maxLength={60} />
        </label>
        <label className="grid gap-1.5 text-sm">
          Link
          <input name={urlName} defaultValue={url} className={fieldClass} placeholder="https://" />
        </label>
      </div>
    </div>
  );
}

function ExtraLinksEditor({
  links,
  onChange,
}: {
  links: ExtraSiteLink[];
  onChange: (links: ExtraSiteLink[]) => void;
}) {
  function update(index: number, patch: Partial<ExtraSiteLink>) {
    onChange(links.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Other links</p>
        <button
          type="button"
          className="text-sm text-accent"
          onClick={() => onChange([...links, { id: crypto.randomUUID(), label: "", url: "" }])}
        >
          Add link
        </button>
      </div>
      <p className="text-xs leading-5 text-muted">
        Shown in the footer and on the about page, after the accounts above.
      </p>
      {links.map((item, index) => (
        <div key={item.id} className="grid gap-3 rounded-xl border border-line p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              Label
              <input
                value={item.label}
                onChange={(event) => update(index, { label: event.target.value })}
                className={fieldClass}
                maxLength={60}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              Link
              <input
                value={item.url}
                onChange={(event) => update(index, { url: event.target.value })}
                className={fieldClass}
                placeholder="https://"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => onChange(links.filter((_, itemIndex) => itemIndex !== index))}
            className="justify-self-start text-xs text-muted"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

export function SocialForm({ social }: { social: SocialLinks }) {
  const [state, action, pending] = useActionState(saveSocial, {} as ActionState);
  const [extraLinks, setExtraLinks] = useState(social.extraLinks);
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={action} className="grid max-w-xl gap-3">
      <FormAutoSave
        formRef={formRef}
        draftKey="settings:socials"
        serverAction={saveSocial}
        externalSuccess={state.ok}
        externalError={state.error}
        compact
        watchValue={extraLinks}
        onRestoreDraft={(fields) => {
          const raw = fields.extraLinks?.[0];
          if (!raw) return;
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setExtraLinks(parsed as ExtraSiteLink[]);
          } catch {
            // ignore malformed draft
          }
        }}
      />
      <LinkFields
        title="School website"
        hint="Shown with the school mark in the footer and on the about page."
        labelName="schoolLabel"
        urlName="schoolUrl"
        label={social.schoolLabel}
        url={social.schoolUrl}
      />
      <LinkFields
        title="Instagram"
        hint="The main campus account."
        labelName="instagramLabel"
        urlName="instagramUrl"
        label={social.instagramLabel}
        url={social.instagramUrl}
      />
      <LinkFields
        title="Council account"
        hint="Shown beside the current council year. Change the name and link when that account changes — SciXcom this year, a new name next year."
        labelName="scixcomLabel"
        urlName="scixcomInstagramUrl"
        label={social.scixcomLabel}
        url={social.scixcomInstagramUrl}
      />
      <ExtraLinksEditor links={extraLinks} onChange={setExtraLinks} />
      <input type="hidden" name="extraLinks" value={JSON.stringify(extraLinks)} />
      <p className="text-xs leading-5 text-muted">
        Leave a label or link blank on the three accounts above to restore its usual text and address.
      </p>
      {state.error ? <p className="text-sm">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
      <button type="submit" disabled={pending} className="justify-self-start rounded-md bg-ink px-4 py-2 text-sm text-white">
        Save links
      </button>
    </form>
  );
}

export function RoleForm() {
  const [state, action, pending] = useActionState(grantRole, {} as ActionState);
  const [userId, setUserId] = useState("");

  const isFormValid = userId.trim().length > 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isFormValid) {
      event.preventDefault();
      alert("Please enter the user's account ID.");
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="grid max-w-xl gap-3">
      <label className="grid gap-1.5 text-sm">
        <span>
          Account id <span className="text-red-500 font-bold">*</span>
        </span>
        <input
          name="userId"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
          className={fieldClass}
          autoComplete="off"
          placeholder="UUID format: e.g. 12345678-1234-1234-1234-123456789abc"
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        Role
        <select name="role" className={fieldClass} defaultValue="editor">
          <option value="editor">Editor</option>
          <option value="administrator">Administrator</option>
        </select>
      </label>
      <label className="grid gap-1.5 text-sm">
        Note
        <input name="note" className={fieldClass} />
      </label>
      {!isFormValid && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
          <span className="font-semibold">Required:</span> Enter an account ID to grant a role.
        </div>
      )}
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
      <button
        type="submit"
        disabled={pending || !isFormValid}
        className="justify-self-start rounded-md bg-ink px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        Update role
      </button>
    </form>
  );
}
