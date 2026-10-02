"use client";

import { useActionState } from "react";
import { grantRole, saveCategory, saveSettings, type ActionState } from "@/lib/manage/actions";

const fieldClass = "w-full rounded-md border border-line bg-white px-3 py-2 text-sm";

export function HostForm({ hosts }: { hosts: string[] }) {
  const [state, action, pending] = useActionState(saveSettings, {} as ActionState);
  return (
    <form action={action} className="grid max-w-xl gap-3">
      <label className="grid gap-1.5 text-sm">
        Approved image hosts
        <textarea name="mediaHosts" defaultValue={hosts.join("\n")} rows={6} className={fieldClass} placeholder="images.example.com" />
      </label>
      <p className="text-xs leading-5 text-muted">One hostname per line. Google Drive sharing links stay blocked.</p>
      {state.error ? <p className="text-sm">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
      <button type="submit" disabled={pending} className="justify-self-start rounded-md bg-ink px-4 py-2 text-sm text-white">Save hosts</button>
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

export function CategoryForm() {
  const [state, action, pending] = useActionState(saveCategory, {} as ActionState);
  return (
    <form action={action} className="mt-10 grid max-w-xl gap-3 border-t border-line pt-8">
      <h2 className="text-lg font-medium">Add a category</h2>
      <label className="grid gap-1.5 text-sm">Name<input name="name" required className={fieldClass} /></label>
      <label className="grid gap-1.5 text-sm">Slug<input name="slug" required className={fieldClass} /></label>
      <label className="grid gap-1.5 text-sm">Description<input name="description" className={fieldClass} /></label>
      {state.error ? <p className="text-sm">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-accent">{state.ok}</p> : null}
      <button type="submit" disabled={pending} className="justify-self-start rounded-md border border-line bg-white px-4 py-2 text-sm">Add category</button>
    </form>
  );
}
