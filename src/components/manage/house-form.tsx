"use client";

import { useActionState, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Shield } from "lucide-react";
import { ImageUploader } from "@/components/manage/image-uploader";
import { deleteHouse, saveHouse, type ActionState } from "@/lib/manage/actions";
import type { House, HouseColor } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

const HOUSE_THEMES: Record<
  HouseColor,
  { label: string; bg: string; text: string; badge: string }
> = {
  ruby: {
    label: "Ruby Red",
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-600 text-white",
  },
  sapphire: {
    label: "Sapphire Blue",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-600 text-white",
  },
  topaz: {
    label: "Topaz Yellow",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-500 text-zinc-950 font-semibold",
  },
  emerald: {
    label: "Emerald Green",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-600 text-white",
  },
};

export function HouseForm({
  house,
  isOpen: controlledOpen,
  onToggle,
}: {
  house: House | null;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggle = onToggle ?? (() => setInternalOpen((prev) => !prev));

  const [state, action, pending] = useActionState(saveHouse, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteHouse,
    {} as ActionState
  );

  const [inchargePhotoUrl, setInchargePhotoUrl] = useState<string>(
    house?.inchargePhotoUrl ?? ""
  );
  const [captainPhotoUrl, setCaptainPhotoUrl] = useState<string>(
    house?.captainPhotoUrl ?? ""
  );
  const [viceCaptainPhotoUrl, setViceCaptainPhotoUrl] = useState<string>(
    house?.viceCaptainPhotoUrl ?? ""
  );

  const theme = house ? HOUSE_THEMES[house.color] ?? HOUSE_THEMES.ruby : null;

  return (
    <div className="rounded-2xl border border-line bg-white shadow-[0_1px_0_rgba(20,27,56,0.04)] overflow-hidden transition">
      {/* Header Banner / Toggle */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-white hover:bg-[#fbfaf4] transition cursor-pointer select-none border-b border-transparent data-[open=true]:border-line"
        data-open={isOpen}
      >
        {house === null ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/5 text-navy">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Add New House</h2>
              <p className="text-xs text-muted">Configure a house with incharge, captain, and motto</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <span
              className={`inline-flex items-center justify-center h-8 w-8 rounded-lg ${
                theme ? theme.bg : "bg-navy/5"
              } shrink-0`}
            >
              <Shield className={`h-4 w-4 ${theme ? theme.text : "text-ink"}`} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-semibold text-ink truncate">{house.name}</h2>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${theme?.badge || "bg-muted/20 text-muted"}`}>
                  {house.color.toUpperCase()}
                </span>
                {!house.published && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700">
                    Draft
                  </span>
                )}
              </div>
              <p className="text-xs text-muted truncate mt-0.5">
                Incharge: <strong className="text-ink">{house.inchargeName}</strong> · Captain:{" "}
                <strong className="text-ink">{house.captainName}</strong>
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted hidden sm:inline">
            {isOpen ? "Collapse" : "Edit Details"}
          </span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted" />
          )}
        </div>
      </button>

      {/* Full Edit Form */}
      {isOpen && (
        <div className="p-5 sm:p-6 border-t border-line/60 bg-[#fdfdfc]/50">
          <form action={action} className="grid gap-5">
            {house?.id && <input type="hidden" name="id" value={house.id} />}
            <input type="hidden" name="inchargePhotoUrl" value={inchargePhotoUrl} />
            <input type="hidden" name="captainPhotoUrl" value={captainPhotoUrl} />
            <input type="hidden" name="viceCaptainPhotoUrl" value={viceCaptainPhotoUrl} />

            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-1.5 text-sm font-medium text-ink">
                House Name *
                <input
                  name="name"
                  defaultValue={house?.name ?? ""}
                  required
                  placeholder="e.g. Ruby"
                  className={fieldClass}
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-ink">
                House Slug *
                <input
                  name="slug"
                  defaultValue={house?.slug ?? ""}
                  required
                  placeholder="ruby"
                  className={fieldClass}
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-ink">
                House Color *
                <select
                  name="color"
                  defaultValue={house?.color ?? "ruby"}
                  className={fieldClass}
                >
                  <option value="ruby">Ruby (Red)</option>
                  <option value="sapphire">Sapphire (Blue)</option>
                  <option value="topaz">Topaz (Yellow / Amber)</option>
                  <option value="emerald">Emerald (Green)</option>
                </select>
              </label>
            </div>

            {/* Motto */}
            <label className="grid gap-1.5 text-sm font-medium text-ink">
              House Motto / Rallying Cry
              <input
                name="motto"
                defaultValue={house?.motto ?? ""}
                placeholder="e.g. Courage, Passion & Strength"
                className={fieldClass}
              />
            </label>

            {/* Leadership Section */}
            <div className="p-4 rounded-xl border border-line bg-white/70 space-y-4">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
                House Leadership Roster
              </h3>

              {/* Incharge */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-line/50">
                <label className="grid gap-1.5 text-sm">
                  Faculty Incharge Name *
                  <input
                    name="inchargeName"
                    defaultValue={house?.inchargeName ?? ""}
                    required
                    placeholder="e.g. Mr. Tariq Mansoor"
                    className={fieldClass}
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  Incharge Title / Department
                  <input
                    name="inchargeTitle"
                    defaultValue={house?.inchargeTitle ?? "Faculty Incharge"}
                    placeholder="e.g. Faculty Incharge"
                    className={fieldClass}
                  />
                </label>
              </div>

              <label className="grid gap-1.5 text-sm">
                Incharge Message to Students
                <textarea
                  name="inchargeMessage"
                  defaultValue={house?.inchargeMessage ?? ""}
                  rows={2}
                  placeholder="Incharge words of encouragement to the house..."
                  className={fieldClass}
                />
              </label>

              <div>
                <ImageUploader
                  name="inchargePhoto"
                  value={inchargePhotoUrl}
                  onChange={setInchargePhotoUrl}
                  folder="Incharges"
                  label="Incharge Photograph (Optional)"
                  hint="Upload an official faculty photo (JPG, PNG, or WebP)."
                  aspectRatio="1:1"
                />
              </div>

              {/* Captain & Vice Captain */}
              <div className="grid gap-4 sm:grid-cols-2 pt-3 border-t border-line/50">
                <div className="space-y-3">
                  <label className="grid gap-1.5 text-sm">
                    House Captain Name (Student) *
                    <input
                      name="captainName"
                      defaultValue={house?.captainName ?? ""}
                      required
                      placeholder="e.g. ZAYAN JASSEER"
                      className={fieldClass}
                    />
                  </label>
                  <ImageUploader
                    name="captainPhoto"
                    value={captainPhotoUrl}
                    onChange={setCaptainPhotoUrl}
                    folder="Council"
                    label="Captain Photo (Optional)"
                    hint="Clear portrait photo of the house captain."
                    aspectRatio="1:1"
                  />
                </div>

                <div className="space-y-3">
                  <label className="grid gap-1.5 text-sm">
                    Vice Captain Name (Student) *
                    <input
                      name="viceCaptainName"
                      defaultValue={house?.viceCaptainName ?? ""}
                      required
                      placeholder="e.g. DANIAL POULOSE"
                      className={fieldClass}
                    />
                  </label>
                  <ImageUploader
                    name="viceCaptainPhoto"
                    value={viceCaptainPhotoUrl}
                    onChange={setViceCaptainPhotoUrl}
                    folder="Council"
                    label="Vice Captain Photo (Optional)"
                    hint="Clear portrait photo of the vice captain."
                    aspectRatio="1:1"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <label className="grid gap-1.5 text-sm font-medium text-ink">
              House Summary / Values
              <textarea
                name="description"
                defaultValue={house?.description ?? ""}
                rows={3}
                placeholder="Share about this house's heritage, values, and competitive spirit..."
                className={fieldClass}
              />
            </label>

            {/* Settings */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                Display Sort Order
                <input
                  type="number"
                  name="sortOrder"
                  defaultValue={house?.sortOrder ?? 0}
                  className={fieldClass}
                />
              </label>

              <label className="flex items-center gap-3 text-sm pt-6 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked={house?.published ?? true}
                  className="rounded border-line text-ink h-4 w-4"
                />
                <span>Published on live campus site</span>
              </label>
            </div>

            {/* Status alerts */}
            {state?.ok && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm font-medium border border-emerald-200">
                {state.ok}
              </div>
            )}
            {state?.error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-sm font-medium border border-rose-200">
                {state.error}
              </div>
            )}

            {/* Submit Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-line">
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={pending}
                  className="px-5 py-2.5 bg-ink text-cream hover:bg-navy rounded-lg font-medium text-sm transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {pending ? "Saving..." : house ? "Update House Details" : "Create House"}
                </button>
                <button
                  type="button"
                  onClick={toggle}
                  className="px-4 py-2.5 rounded-lg border border-line text-sm text-ink hover:bg-zinc-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </form>

          {/* Delete Option for Existing Houses */}
          {house && (
            <form action={deleteAction} className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between">
              <input type="hidden" name="id" value={house.id} />
              <label className="flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" name="confirm" value="yes" className="rounded border-line" />
                <span>Confirm delete this house</span>
              </label>
              <button
                type="submit"
                disabled={deleting}
                className="px-3 py-1.5 rounded-md text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete House"}
              </button>
            </form>
          )}

          {deleteState?.error && (
            <p className="mt-2 text-xs text-rose-600 font-medium">{deleteState.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
