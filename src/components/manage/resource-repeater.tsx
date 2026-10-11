"use client";

import type { ContentResource, ResourceKind } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function ResourceRepeater({
  resources,
  onChange,
}: {
  resources: ContentResource[];
  onChange: (resources: ContentResource[]) => void;
}) {
  function update(index: number, patch: Partial<ContentResource>) {
    onChange(resources.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="grid gap-3 border-t border-line pt-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Cards and downloads</h2>
        <button
          type="button"
          className="text-sm text-accent"
          onClick={() => onChange([...resources, { title: "", detail: null, href: null, kind: "card" }])}
        >
          Add card
        </button>
      </div>
      <p className="text-sm text-muted">
        Use cards for competition details, links for external pages, and PDF for downloadable briefs.
      </p>
      {resources.map((item, index) => (
        <div key={index} className="grid gap-3 rounded-xl border border-line p-4">
          <label className="grid gap-1.5 text-sm">
            Title
            <input
              value={item.title}
              onChange={(event) => update(index, { title: event.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            Detail
            <textarea
              value={item.detail ?? ""}
              onChange={(event) => update(index, { detail: event.target.value || null })}
              rows={2}
              className={fieldClass}
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              Kind
              <select
                value={item.kind}
                onChange={(event) => update(index, { kind: event.target.value as ResourceKind })}
                className={fieldClass}
              >
                <option value="card">Card</option>
                <option value="link">Link</option>
                <option value="pdf">PDF</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              URL
              <input
                value={item.href ?? ""}
                onChange={(event) => update(index, { href: event.target.value || null })}
                placeholder="https://"
                className={fieldClass}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => onChange(resources.filter((_, itemIndex) => itemIndex !== index))}
            className="justify-self-start text-xs text-muted"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
