export function ManageUnavailable() {
  return (
    <div className="mx-auto max-w-xl px-5 py-20">
      <h1 className="text-3xl font-medium tracking-tight">Content tools are not connected.</h1>
      <p className="mt-4 text-sm leading-6 text-muted">
        Sign-in stays closed until this site is pointed at the existing Supabase project and the campus tables have been added. Public pages continue to use demonstration records. No password entered here would grant access.
      </p>
    </div>
  );
}
