import {
  ContactEmailForm,
  CouncilLogoForm,
  HostForm,
  NavBrandForm,
  RoleForm,
  SocialForm,
} from "@/components/manage/settings-forms";
import { AiSettingsManager } from "@/components/manage/ai-settings-manager";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { getPublicSocial, getSiteBrand } from "@/lib/data/queries";
import { readAiConfig } from "@/lib/data/file-content";
import { requireAdministrator } from "@/lib/manage/access";
import { IMAGE_HOSTS_GUIDE } from "@/lib/media/guide";
import { createStaffClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const access = await requireAdministrator();
  if (!access.ready) return <ManageUnavailable />;
  const [social, brand] = await Promise.all([getPublicSocial(), getSiteBrand()]);
  const aiConfig = readAiConfig();

  const supabase = await createStaffClient();
  const audit = supabase
    ? await supabase
        .from("campus_audit_log")
        .select("id, action, entity_type, created_at")
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [], error: null };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <h1 className="text-3xl font-medium tracking-tight">Settings</h1>
      <section className="mt-8">
        <h2 className="text-xl font-medium">Image hosts</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          The site stores image addresses, not files. Visitors&apos; browsers load each photograph from the HTTPS URL you
          paste in a form. Until a hostname is listed here, URLs on that host cannot be saved.
        </p>
        <ol className="mt-4 max-w-xl list-decimal space-y-2 pl-5 text-sm leading-6 text-muted">
          {IMAGE_HOSTS_GUIDE.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
          Recommended host:{" "}
          <a
            href="https://cloudinary.com"
            className="text-accent underline-offset-2 hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            Cloudinary
          </a>{" "}
          (free Media Library). Keep assets public so the preview and public pages can load them.
        </p>
        <div className="mt-4">
          <HostForm hosts={access.workspace.mediaHosts} />
        </div>
      </section>
      <section className="mt-12">
        <h2 className="text-xl font-medium">Council logo</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          Paste an HTTPS image address when the logo changes. It updates everywhere the council mark is shown.
        </p>
        <div className="mt-4">
          <CouncilLogoForm logoUrl={brand.councilLogoUrl} />
        </div>
      </section>
      <section className="mt-12">
        <h2 className="text-xl font-medium">Navbar</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          The mark on the right of the top bar. Paste an HTTPS image address, the name beside it, and where a click should go.
        </p>
        <div className="mt-4">
          <NavBrandForm logoUrl={brand.navLogoUrl} href={brand.navLogoHref} label={brand.navLabel} />
        </div>
      </section>
      <section className="mt-12">
        <h2 className="text-xl font-medium">Contact email</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          The address students and parents use for feedback. It opens as an email link on About and in the footer.
        </p>
        <div className="mt-4">
          <ContactEmailForm contactEmail={brand.contactEmail} />
        </div>
      </section>
      <section className="mt-12">
        <h2 className="text-xl font-medium">Links</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          Change the name and address for the school website, Instagram, and the council account. Add any other links
          the footer and about page should list.
        </p>
        <div className="mt-4">
          <SocialForm social={social} />
        </div>
      </section>
      <section className="mt-12" id="ai">
        <h2 className="text-xl font-medium">AI Intelligence & Providers</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          Configure the AI provider (xAI Grok, OpenAI, OpenRouter, Google Gemini, or custom endpoint), fetch live models dynamically, and save settings to the database.
        </p>
        <div className="mt-4">
          <AiSettingsManager
            initialProvider={aiConfig.provider}
            initialApiKey={aiConfig.apiKey ?? ""}
            initialModel={aiConfig.model}
            initialBaseUrl={aiConfig.baseUrl ?? ""}
          />
        </div>
      </section>
      <section className="mt-12">
        <h2 className="text-xl font-medium">Roles</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          Enter the existing account id. This does not create a user, and it does not change Arigo administrator access.
        </p>
        <div className="mt-4">
          <RoleForm />
        </div>
      </section>
      <section className="mt-12">
        <h2 className="text-xl font-medium">Recent changes</h2>
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
          {(audit.data ?? []).map((row) => (
            <li key={row.id} className="px-4 py-3 text-sm">
              {row.action} · {row.entity_type}
              <span className="mt-1 block text-xs text-muted">{new Date(row.created_at).toLocaleString("en-GB")}</span>
            </li>
          ))}
          {!audit.data?.length ? <li className="px-4 py-6 text-sm text-muted">No audit records yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
