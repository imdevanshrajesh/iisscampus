"use client";

import { useActionState, useRef, useState } from "react";
import { ChevronDown, ChevronRight, GraduationCap, Plus, Mail } from "lucide-react";
import { FormAutoSave } from "@/components/manage/form-auto-save";
import { ImageUploader } from "@/components/manage/image-uploader";
import { deleteSchoolIncharge, saveSchoolIncharge, type ActionState } from "@/lib/manage/actions";
import type { SchoolIncharge } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function SchoolInchargeForm({
  incharge,
  isOpen: controlledOpen,
  onToggle,
}: {
  incharge: SchoolIncharge | null;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggle = onToggle ?? (() => setInternalOpen((prev) => !prev));

  const [state, action, pending] = useActionState(saveSchoolIncharge, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteSchoolIncharge, {} as ActionState);
  const [name, setName] = useState(incharge?.name ?? "");
  const [role, setRole] = useState(incharge?.role ?? "");
  const [photoUrl, setPhotoUrl] = useState<string>(incharge?.photoUrl ?? "");
  const [clientError, setClientError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const missingFields: string[] = [];
  if (!name.trim() || name.trim().length < 2) missingFields.push("Full Name (min 2 chars)");
  if (!role.trim() || role.trim().length < 2) missingFields.push("Role / Designation (min 2 chars)");

  const isFormValid = missingFields.length === 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!isFormValid) {
      e.preventDefault();
      setClientError(`Please fill in all required fields marked with * before saving: ${missingFields.join(", ")}`);
      return;
    }
    setClientError(null);
  };

  return (
    <div className="rounded-2xl border border-line bg-white shadow-[0_1px_0_rgba(20,27,56,0.04)] overflow-hidden transition">
      {/* Header */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-white hover:bg-[#fbfaf4] transition cursor-pointer select-none border-b border-transparent data-[open=true]:border-line"
        data-open={isOpen}
      >
        {incharge === null ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/5 text-navy">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Add New Campus Head</h2>
              <p className="text-xs text-muted">Click to add Principal, Section Head, or Department Head</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${
                incharge.published ? "bg-emerald-500" : "bg-muted"
              }`}
            />
            {incharge.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={incharge.photoUrl}
                alt={incharge.name}
                className="h-9 w-9 rounded-full object-cover border border-line shrink-0"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy/5 text-navy font-bold text-xs border border-line shrink-0">
                {incharge.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-ink truncate">{incharge.name}</h3>
                <span className="text-xs text-accent font-medium">{incharge.role}</span>
                {incharge.department ? (
                  <span className="rounded-full bg-navy/5 px-2 py-0.5 text-[10px] font-medium text-navy">
                    {incharge.department}
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    incharge.published ? "bg-emerald-500/10 text-emerald-700" : "bg-muted/15 text-muted"
                  }`}
                >
                  {incharge.published ? "Active" : "Draft"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted truncate max-w-xl">
                {incharge.about || "No biography added."}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-muted shrink-0 pl-3">
          <span className="text-xs font-medium">{isOpen ? "Close" : incharge ? "Edit" : "Open"}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-accent transition-transform" />
          ) : (
            <ChevronRight className="h-4 w-4 transition-transform" />
          )}
        </div>
      </button>

      {/* Expanded Form */}
      {isOpen && (
        <div className="p-4 sm:p-5 pt-3 bg-[#faf9f5]/50 border-t border-line/40 grid gap-5">
          <form ref={formRef} action={action} onSubmit={handleSubmit} noValidate className="grid gap-4">
            {incharge ? <input type="hidden" name="id" value={incharge.id} /> : null}
            <FormAutoSave
              formRef={formRef}
              draftKey={incharge ? `incharge:${incharge.id}` : "incharge:new"}
              serverAction={saveSchoolIncharge}
              recordId={incharge?.id ?? ""}
              canAutoSaveServer={Boolean(incharge?.id && name.trim() && role.trim())}
              externalSuccess={state?.ok}
              externalError={state?.error}
              compact
              watchValue={{ name, role, photoUrl }}
              onRestoreDraft={(fields) => {
                const first = (key: string) => fields[key]?.[0];
                if (first("name") !== undefined) setName(first("name")!);
                if (first("role") !== undefined) setRole(first("role")!);
                if (first("photoUrl") !== undefined) setPhotoUrl(first("photoUrl")!);
              }}
            />
            <input type="hidden" name="photoUrl" value={photoUrl} />

            {clientError ? <p className="rounded-xl border border-red-300 bg-red-50 text-red-900 px-4 py-3 text-sm font-medium">{clientError}</p> : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium text-ink">
                <span>Full Name <span className="text-red-500 font-bold" title="Required">*</span></span>
                <input
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={120}
                  className={fieldClass}
                  placeholder="e.g. Mr. Tariq Mansoor"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-ink">
                <span>Role / Designation <span className="text-red-500 font-bold" title="Required">*</span></span>
                <input
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  maxLength={120}
                  className={fieldClass}
                  placeholder="e.g. Principal & Campus Director"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-ink">
                <span>Hierarchy Tier <span className="text-red-500 font-bold" title="Required">*</span></span>
                <select
                  name="tier"
                  defaultValue={incharge?.tier ?? "section"}
                  className={fieldClass}
                >
                  <option value="executive">Executive Leadership (Principal / VP / Director)</option>
                  <option value="section">Section Heads (Senior / Middle / Secondary)</option>
                  <option value="department">Department Heads (Activities / Discipline / CCA)</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                Department / Directorate
                <input
                  name="department"
                  defaultValue={incharge?.department ?? ""}
                  maxLength={120}
                  className={fieldClass}
                  placeholder="e.g. Campus Directorate or Senior Secondary"
                />
              </label>

              <label className="grid gap-1.5 text-sm">
                Contact Email (Optional)
                <input
                  name="email"
                  type="email"
                  defaultValue={incharge?.email ?? ""}
                  maxLength={160}
                  className={fieldClass}
                  placeholder="e.g. principal@iissboys.com"
                />
              </label>
            </div>

            {/* Photo Upload via RustFS */}
            <div>
              <ImageUploader
                name="photoUploader"
                value={photoUrl}
                onChange={setPhotoUrl}
                folder="Incharges"
                targetName={`incharge-${name.trim() || "faculty"}`}
                label="Head Photograph / Portrait"
                hint="Upload a clear portrait photograph (JPG, PNG, or WebP). Framing tool included."
                aspectRatio="1:1"
              />
            </div>

            <label className="grid gap-1.5 text-sm">
              Personal Message to Students *
              <textarea
                name="message"
                defaultValue={incharge?.message ?? incharge?.about ?? ""}
                required
                rows={3}
                maxLength={4000}
                className={fieldClass}
                placeholder="Their personal message, philosophy, or guidance to campus students (displayed prominently on public page)..."
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2 items-center">
              <label className="grid gap-1.5 text-sm">
                Display Order
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={incharge?.sortOrder ?? 0}
                  className={fieldClass}
                />
              </label>

              <label className="flex items-center gap-2 text-sm pt-4 sm:pt-6">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked={incharge?.published ?? true}
                />
                <span>Show on public Incharges page</span>
              </label>
            </div>

            {state.error ? <p className="text-sm text-red-600 font-medium">{state.error}</p> : null}
            {state.ok ? <p className="text-sm text-accent font-medium">{state.ok}</p> : null}

            {!isFormValid && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200/80 px-3 py-2 text-xs text-amber-900">
                <span className="font-bold shrink-0">Required (*):</span>
                <span>Fill in {missingFields.join(", ")} to save.</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={pending || !isFormValid}
                className="rounded-md bg-navy px-4 py-2 text-sm text-white transition hover:bg-navy/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? "Saving..." : incharge ? "Save Incharge" : "Add Incharge"}
              </button>
            </div>
          </form>

          {/* Delete action */}
          {incharge ? (
            <form action={deleteAction} className="flex flex-wrap items-center gap-3 border-t border-line/60 pt-3">
              <input type="hidden" name="id" value={incharge.id} />
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" name="confirm" value="yes" />
                Confirm delete
              </label>
              <button
                type="submit"
                disabled={deleting}
                className="rounded-md border border-line bg-white px-3 py-1.5 text-sm text-muted hover:text-red-600 transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Incharge"}
              </button>
              {deleteState.error ? <p className="text-sm text-red-600">{deleteState.error}</p> : null}
            </form>
          ) : null}
        </div>
      )}
    </div>
  );
}
