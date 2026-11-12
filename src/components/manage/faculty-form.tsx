"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { ImageUploader } from "@/components/manage/image-uploader";
import { FACULTY_TIER_MAP, FACULTY_TIER_META } from "@/lib/faculty";
import { deleteFacultyMember, saveFacultyMember, type ActionState } from "@/lib/manage/actions";
import type { FacultyMember, FacultyTier } from "@/lib/types";

const fieldClass =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy";

type FacultyFormProps = {
  member: FacultyMember | null;
  defaultTier?: FacultyTier;
  defaultRole?: string;
  variant?: "accordion" | "modal";
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
  onSaved?: () => void;
};

function rolePlaceholderForTier(tier: FacultyTier) {
  switch (tier) {
    case "principal":
      return "e.g. Principal";
    case "vice_principal":
      return "e.g. Vice Principal";
    case "head":
      return "e.g. Headmistress or Headmaster";
    case "supervisor":
      return "e.g. Academic Supervisor";
  }
}

function FacultyFormBody({
  member,
  defaultTier = "supervisor",
  defaultRole,
  variant = "accordion",
  onClose,
  onSaved,
}: {
  member: FacultyMember | null;
  defaultTier?: FacultyTier;
  defaultRole?: string;
  variant?: "accordion" | "modal";
  onClose?: () => void;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const initialTier: FacultyTier = member?.tier ?? defaultTier;
  const initialRole = member?.role ?? defaultRole ?? FACULTY_TIER_MAP[initialTier].defaultRole;

  const [state, action, pending] = useActionState(saveFacultyMember, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteFacultyMember, {} as ActionState);

  const [tier, setTier] = useState<FacultyTier>(initialTier);
  const [name, setName] = useState(member?.name ?? "");
  const [role, setRole] = useState(initialRole);
  const [roleTouched, setRoleTouched] = useState(Boolean(member?.role));
  const [photoUrl, setPhotoUrl] = useState(member?.photoUrl ?? "");
  const [clientError, setClientError] = useState<string | null>(null);

  const handledSaveRef = useRef<ActionState | null>(null);
  const handledDeleteRef = useRef<ActionState | null>(null);

  useEffect(() => {
    if (state.ok && handledSaveRef.current !== state) {
      handledSaveRef.current = state;
      router.refresh();
      onSaved?.();
    }
  }, [state, router, onSaved]);

  useEffect(() => {
    if (deleteState.ok && handledDeleteRef.current !== deleteState) {
      handledDeleteRef.current = deleteState;
      router.refresh();
      onSaved?.();
    }
  }, [deleteState, router, onSaved]);

  const missingFields: string[] = [];
  if (name.trim().length < 2) missingFields.push("Full Name (min 2 chars)");
  if (role.trim().length < 2) missingFields.push("Role / Designation (min 2 chars)");
  const isFormValid = missingFields.length === 0;

  const handleTierChange = (nextTier: FacultyTier) => {
    setTier(nextTier);
    if (!member && !roleTouched) {
      setRole(FACULTY_TIER_MAP[nextTier].defaultRole);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!isFormValid) {
      event.preventDefault();
      setClientError(`Please fill in required fields: ${missingFields.join(", ")}`);
      return;
    }
    setClientError(null);
  };

  return (
    <div className="grid gap-5">
      <form action={action} onSubmit={handleSubmit} noValidate className="grid gap-4">
        {member ? <input type="hidden" name="id" value={member.id} /> : null}
        <input type="hidden" name="photoUrl" value={photoUrl} />

        {clientError ? (
          <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
            {clientError}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-ink">
            <span>
              Full Name <span className="font-bold text-red-500" title="Required">*</span>
            </span>
            <input
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={120}
              className={fieldClass}
              placeholder="e.g. Mrs. ..., Shifana Muiz, Mr. Sunaj Abdul Majeed"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium text-ink">
            <span>
              Hierarchy Tier <span className="font-bold text-red-500" title="Required">*</span>
            </span>
            <select
              name="tier"
              value={tier}
              onChange={(event) => handleTierChange(event.target.value as FacultyTier)}
              className={fieldClass}
            >
              {FACULTY_TIER_META.map((item) => (
                <option key={item.tier} value={item.tier}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-sm font-medium text-ink">
            <span>
              Role / Designation <span className="font-bold text-red-500" title="Required">*</span>
            </span>
            <input
              name="role"
              value={role}
              onChange={(event) => {
                setRoleTouched(true);
                setRole(event.target.value);
              }}
              required
              maxLength={120}
              className={fieldClass}
              placeholder={rolePlaceholderForTier(tier)}
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium text-ink">
            <span>Section / Department (Optional)</span>
            <input
              name="department"
              defaultValue={member?.department ?? ""}
              maxLength={120}
              className={fieldClass}
              placeholder="e.g. Boys Wing, Senior Section"
            />
          </label>
        </div>

        <label className="grid gap-1.5 text-sm font-medium text-ink">
          <span>Contact Email (Optional)</span>
          <input
            name="email"
            type="email"
            defaultValue={member?.email ?? ""}
            maxLength={160}
            className={fieldClass}
            placeholder="e.g. faculty@iissboys.com"
          />
        </label>

        <div>
          <ImageUploader
            name="photoUploader"
            value={photoUrl}
            onChange={setPhotoUrl}
            folder="Faculty"
            targetName={`faculty-${name.trim() || tier}`}
            label="Portrait Photo"
            hint="Upload a portrait photograph (JPG, PNG, or WebP) or paste an approved image link."
            aspectRatio={tier === "principal" ? "4:3" : "1:1"}
          />
        </div>

        <label className="grid gap-1.5 text-sm font-medium text-ink">
          <span>
            {tier === "principal" ? "Principal's Message" : "Message / Note (Optional)"}
          </span>
          <textarea
            name="message"
            defaultValue={member?.message ?? ""}
            rows={tier === "principal" ? 5 : 3}
            maxLength={4000}
            className={fieldClass}
            placeholder={
              tier === "principal"
                ? "Principal's message to students, parents, and the school community..."
                : "Optional message, portfolio focus, or brief introduction..."
            }
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2 items-center">
          <label className="grid gap-1.5 text-sm font-medium text-ink">
            <span>Display Order (smaller first)</span>
            <input
              name="sortOrder"
              type="number"
              defaultValue={member?.sortOrder ?? 0}
              className={fieldClass}
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-ink pt-2 sm:pt-6 cursor-pointer">
            <input
              type="checkbox"
              name="published"
              defaultChecked={member?.published ?? true}
              className="h-4 w-4 rounded border-line"
            />
            <span>Published on public Faculty page</span>
          </label>
        </div>

        {state.error ? <p className="text-sm font-medium text-red-600">{state.error}</p> : null}
        {state.ok ? <p className="text-sm font-medium text-emerald-700">{state.ok}</p> : null}

        {!isFormValid ? (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <span className="shrink-0 font-bold">Required (*):</span>
            <span>Fill in {missingFields.join(", ")} to save.</span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
          {variant === "modal" && onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface cursor-pointer"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            disabled={pending || !isFormValid}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy/90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Saving..." : member ? "Save Changes" : "Add Faculty Member"}
          </button>
        </div>
      </form>

      {member ? (
        <form action={deleteAction} className="flex flex-wrap items-center gap-3 border-t border-line/60 pt-4">
          <input type="hidden" name="id" value={member.id} />
          <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
            <input type="checkbox" name="confirm" value="yes" />
            <span>Confirm delete</span>
          </label>
          <button
            type="submit"
            disabled={deleting}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-muted transition hover:border-red-300 hover:text-red-600 cursor-pointer disabled:opacity-50"
          >
            {deleting ? "Removing..." : "Remove Member"}
          </button>
          {deleteState.error ? <p className="text-sm text-red-600">{deleteState.error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}

export function FacultyForm({
  member,
  defaultTier = "supervisor",
  defaultRole,
  variant = "accordion",
  isOpen: controlledOpen,
  onToggle,
  onClose,
  onSaved,
}: FacultyFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggle = onToggle ?? (() => setInternalOpen((prev) => !prev));

  if (variant === "modal") {
    return (
      <div className="rounded-3xl border border-line bg-white p-5 sm:p-7 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-line/60 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Faculty Directory
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              {member ? `Edit ${member.name}` : "Add Faculty Member"}
            </h2>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-full border border-line p-2 text-muted transition hover:bg-surface hover:text-ink cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <FacultyFormBody
          member={member}
          defaultTier={defaultTier}
          defaultRole={defaultRole}
          variant="modal"
          onClose={onClose}
          onSaved={onSaved}
        />
      </div>
    );
  }

  const tierLabel = member ? FACULTY_TIER_MAP[member.tier].label : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_0_rgba(20,27,56,0.04)] transition">
      <button
        type="button"
        onClick={toggle}
        data-open={isOpen}
        className="flex w-full cursor-pointer select-none items-center justify-between border-b border-transparent bg-white p-4 text-left transition hover:bg-[#fbfaf4] data-[open=true]:border-line sm:p-5"
      >
        {member === null ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy/5 text-navy">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Add New Faculty Member</h2>
              <p className="text-xs text-muted">
                Principal, Vice Principal, Headmistress &amp; Headmaster, or Supervisor
              </p>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-3 pr-2">
            <span
              className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
                member.published ? "bg-emerald-500" : "bg-muted"
              }`}
            />
            {member.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.photoUrl}
                alt={member.name}
                className="h-10 w-10 shrink-0 rounded-full border border-line object-cover object-top"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-navy/5 text-xs font-bold text-navy">
                {member.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-ink">{member.name}</h3>
                <span className="text-xs font-medium text-accent">{member.role}</span>
                {tierLabel ? (
                  <span className="rounded-full bg-navy/5 px-2 py-0.5 text-[10px] font-medium text-navy">
                    {tierLabel}
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    member.published
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-muted/15 text-muted"
                  }`}
                >
                  {member.published ? "Published" : "Hidden"}
                </span>
              </div>
              <p className="mt-0.5 max-w-xl truncate text-xs text-muted">
                {member.message || member.department || "No message added."}
              </p>
            </div>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2 pl-3 text-muted">
          <span className="text-xs font-medium">{isOpen ? "Close" : member ? "Edit" : "Open"}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-accent transition-transform" />
          ) : (
            <ChevronRight className="h-4 w-4 transition-transform" />
          )}
        </div>
      </button>

      {isOpen ? (
        <div className="border-t border-line/40 bg-[#faf9f5]/60 p-4 pt-4 sm:p-5">
          <FacultyFormBody
            member={member}
            defaultTier={defaultTier}
            defaultRole={defaultRole}
            variant="accordion"
            onSaved={onSaved}
          />
        </div>
      ) : null}
    </div>
  );
}
