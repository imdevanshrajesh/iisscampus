"use client";

import { useActionState, useState } from "react";
import {
  grantRole,
  saveContactEmail,
  saveCouncilLogo,
  saveNavBrand,
  saveSettings,
  saveSocial,
  type ActionState,
} from "@/lib/manage/actions";
import type { ExtraSiteLink, SocialLinks } from "@/lib/types";
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
        Used on the council page, the intro, the admin bar, and the site icon. Leave blank to use the logo saved in the project. The host must be listed under image hosts.
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
  return (
    <form action={action} className="grid max-w-xl gap-3">
      <label className="grid gap-1.5 text-sm">
        Name
        <input name="navLabel" defaultValue={label} maxLength={40} className={fieldClass} />
      </label>
      <label className="grid gap-1.5 text-sm">
        Navbar logo URL
        <input name="navLogoUrl" defaultValue={logoUrl ?? ""} className={fieldClass} placeholder={IMAGE_URL_EXAMPLE} />
      </label>
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
  return (
    <form action={action} className="grid max-w-xl gap-3">
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

export function GrokAiSettingsForm({
  initialApiKey,
  initialModel,
}: {
  initialApiKey: string | null;
  initialModel: string;
}) {
  const [apiKey, setApiKey] = useState(initialApiKey || "");
  const [model, setModel] = useState(initialModel || "grok-2-latest");
  const [status, setStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const testKey = async () => {
    if (!apiKey.trim()) {
      setStatus("Please enter an API key.");
      return;
    }
    setTesting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/manage-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test-key", key: apiKey, model }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("Connected! API key is valid.");
        if (typeof window !== "undefined") {
          localStorage.setItem("iiss_grok_api_key", apiKey.trim());
        }
      } else {
        setStatus(`Error: ${data.message || data.error || "Failed"}`);
      }
    } catch {
      setStatus("Network error validating key.");
    } finally {
      setTesting(false);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    if (typeof window !== "undefined" && apiKey) {
      localStorage.setItem("iiss_grok_api_key", apiKey.trim());
    }
    try {
      const res = await fetch("/api/manage-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save-key", key: apiKey, model }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("Grok API settings saved successfully.");
      } else {
        setStatus(`Error: ${data.error || "Could not save settings."}`);
      }
    } catch {
      setStatus("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={saveSettings} className="grid max-w-xl gap-3">
      <label className="grid gap-1.5 text-sm">
        xAI Grok API Key
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="xai-..."
          className={fieldClass}
          autoComplete="off"
        />
      </label>
      <p className="text-xs leading-5 text-muted">
        Powers the AI Content Operations Agent in the desk and the Public Campus AI Assistant.
        Get an API key at{" "}
        <a
          href="https://console.x.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline"
        >
          console.x.ai
        </a>
        .
      </p>

      <label className="grid gap-1.5 text-sm">
        Default Model
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className={fieldClass}
        >
          <option value="grok-2-latest">grok-2-latest (Recommended)</option>
          <option value="grok-beta">grok-beta</option>
          <option value="grok-2-vision-1212">grok-2-vision-1212</option>
        </select>
      </label>

      {status ? (
        <p
          className={`text-sm ${
            status.includes("Connected") || status.includes("saved")
              ? "text-accent"
              : "text-red-600"
          }`}
        >
          {status}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={testKey}
          disabled={testing || !apiKey.trim()}
          className="rounded-md border border-line bg-white px-3.5 py-2 text-sm text-ink hover:bg-black/5 disabled:opacity-50"
        >
          {testing ? "Testing..." : "Test connection"}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-ink px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Grok settings"}
        </button>
      </div>
    </form>
  );
}
