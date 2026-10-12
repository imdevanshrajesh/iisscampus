"use client";

import { useActionState } from "react";
import {
  grantRole,
  saveContactEmail,
  saveCouncilLogo,
  saveSettings,
  saveSocial,
  type ActionState,
} from "@/lib/manage/actions";
import type { SocialLinks } from "@/lib/types";
import { IMAGE_URL_EXAMPLE, RECOMMENDED_IMAGE_HOST } from "@/lib/media/guide";

const fieldClass = "w-full rounded-md border border-line bg-white px-3 py-2 text-sm";

export function HostForm({ hosts }: { hosts: string[] }) {
  const [state, action, pending] = useActionState(saveSettings, {} as ActionState);
  return (
    <form action={action} className="grid max-w-xl gap-3">
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
  return (
    <form action={action} className="grid max-w-xl gap-3">
      <label className="grid gap-1.5 text-sm">
        Council logo URL
        <input
          name="councilLogoUrl"
          defaultValue={logoUrl ?? ""}
          className={fieldClass}
          placeholder={IMAGE_URL_EXAMPLE}
        />
      </label>
      <p className="text-xs leading-5 text-muted">
        Used in the navigation, admin bar, intro, council page, and site icon. Leave blank to use the logo saved in the project. The host must be listed under image hosts.
      </p>
      {state.error ? <p className="text-sm">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
      <button type="submit" disabled={pending} className="justify-self-start rounded-md bg-ink px-4 py-2 text-sm text-white">
        Save logo
      </button>
    </form>
  );
}

export function ContactEmailForm({ contactEmail }: { contactEmail: string | null }) {
  const [state, action, pending] = useActionState(saveContactEmail, {} as ActionState);
  return (
    <form action={action} className="grid max-w-xl gap-3">
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

export function SocialForm({ social }: { social: SocialLinks }) {
  const [state, action, pending] = useActionState(saveSocial, {} as ActionState);
  return (
    <form action={action} className="grid max-w-xl gap-3">
      <label className="grid gap-1.5 text-sm">
        Campus Instagram
        <input name="instagramUrl" defaultValue={social.instagramUrl} className={fieldClass} placeholder="https://" />
      </label>
      <label className="grid gap-1.5 text-sm">
        SciXcom Instagram
        <input
          name="scixcomInstagramUrl"
          defaultValue={social.scixcomInstagramUrl}
          className={fieldClass}
          placeholder="https://"
        />
      </label>
      <p className="text-xs leading-5 text-muted">
        These links appear in the footer and on the about page. Leave a field blank to restore its usual address.
      </p>
      {state.error ? <p className="text-sm">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
      <button type="submit" disabled={pending} className="justify-self-start rounded-md bg-ink px-4 py-2 text-sm text-white">
        Save Instagram links
      </button>
    </form>
  );
}

export function RoleForm() {
  const [state, action, pending] = useActionState(grantRole, {} as ActionState);
  return (
    <form action={action} className="grid max-w-xl gap-3">
      <label className="grid gap-1.5 text-sm">
        Account id
        <input name="userId" required className={fieldClass} autoComplete="off" />
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
      {state.error ? <p className="text-sm">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
      <button type="submit" disabled={pending} className="justify-self-start rounded-md bg-ink px-4 py-2 text-sm text-white">Update role</button>
    </form>
  );
}
