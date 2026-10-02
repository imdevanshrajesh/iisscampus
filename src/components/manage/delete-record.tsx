export function DeleteRecord({
  action,
  id,
  label,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label: string;
}) {
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" name="confirm" value="yes" required />
        Confirm delete
      </label>
      <button type="submit" className="rounded-md border border-line px-3 py-2 text-sm text-ink">
        {label}
      </button>
    </form>
  );
}
