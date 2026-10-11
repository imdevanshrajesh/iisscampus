import { HostForm, RoleForm, SocialForm } from "@/components/manage/settings-forms";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { getPublicSocial } from "@/lib/data/queries";
import { requireAdministrator } from "@/lib/manage/access";
import { IMAGE_HOSTS_GUIDE } from "@/lib/media/guide";
import { createStaffClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const access = await requireAdministrator();
  if (!access.ready) return <ManageUnavailable />;
  const social = await getPublicSocial();

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
        <h2 className="text-xl font-medium">Instagram</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          The campus account is the main one. SciXcom is listed beside it.
        </p>
        <div className="mt-4">
          <SocialForm social={social} />
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
