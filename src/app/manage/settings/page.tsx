import { HostForm, RoleForm } from "@/components/manage/settings-forms";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { requireAdministrator } from "@/lib/manage/access";
import { createStaffClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const access = await requireAdministrator();
  if (!access.ready) return <ManageUnavailable />;

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
        <div className="mt-4">
          <HostForm hosts={access.workspace.mediaHosts} />
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
