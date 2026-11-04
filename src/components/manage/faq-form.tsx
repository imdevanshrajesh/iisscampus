"use client";

import { useActionState, useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { deleteFaq, saveFaq, type ActionState } from "@/lib/manage/actions";
import type { Faq } from "@/lib/types";

const fieldClass = "w-full rounded-md border border-line bg-background px-3 py-2 text-sm";

export function FaqForm({
  faq,
  isOpen: controlledOpen,
  onToggle,
}: {
  faq: Faq | null;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggle = onToggle ?? (() => setInternalOpen((prev) => !prev));

  const [state, action, pending] = useActionState(saveFaq, {} as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteFaq, {} as ActionState);
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [answer, setAnswer] = useState(faq?.answer ?? "");
  const [clientError, setClientError] = useState<string | null>(null);

  const missingFields: string[] = [];
  if (!question.trim() || question.trim().length < 2) missingFields.push("Question (min 2 chars)");
  if (!answer.trim() || answer.trim().length < 2) missingFields.push("Answer (min 2 chars)");

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
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-white hover:bg-[#fbfaf4] transition cursor-pointer select-none border-b border-transparent data-[open=true]:border-line"
        data-open={isOpen}
      >
        {faq === null ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/5 text-navy">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Add New FAQ Question</h2>
              <p className="text-xs text-muted">Click to draft a new question and answer</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${
                faq.published ? "bg-emerald-500" : "bg-muted"
              }`}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-ink truncate">{faq.question}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    faq.published ? "bg-emerald-500/10 text-emerald-700" : "bg-muted/15 text-muted"
                  }`}
                >
                  {faq.published ? "Published" : "Draft"}
                </span>
                <span className="text-[10px] text-muted">Order #{faq.sortOrder}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted truncate max-w-xl">
                {faq.answer || "No answer provided yet."}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-muted shrink-0 pl-3">
          <span className="text-xs font-medium">{isOpen ? "Close" : faq ? "Edit" : "Open"}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-accent transition-transform" />
          ) : (
            <ChevronRight className="h-4 w-4 transition-transform" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 pt-3 bg-[#faf9f5]/50 border-t border-line/40 grid gap-4">
          <form action={action} onSubmit={handleSubmit} noValidate className="grid gap-3">
            {faq ? <input type="hidden" name="id" value={faq.id} /> : null}
            {clientError ? <p className="rounded-xl border border-red-300 bg-red-50 text-red-900 px-4 py-3 text-sm font-medium">{clientError}</p> : null}
            <label className="grid gap-1.5 text-sm font-medium text-ink">
              <span>Question <span className="text-red-500 font-bold" title="Required">*</span></span>
              <input
                name="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                className={fieldClass}
                placeholder="e.g. How do I participate in campus events?"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-ink">
              <span>Answer <span className="text-red-500 font-bold" title="Required">*</span></span>
              <textarea
                name="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={5}
                required
                className={fieldClass}
                placeholder="Detailed answer for students and parents..."
              />
            </label>
            <label className="grid max-w-32 gap-1.5 text-sm">
              Order
              <input type="number" name="sortOrder" defaultValue={faq?.sortOrder ?? 0} className={fieldClass} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="published" defaultChecked={faq?.published ?? true} />
              Published
            </label>
            {state.error ? <p className="text-sm text-red-600 font-medium">{state.error}</p> : null}
            {state.ok ? <p className="text-sm text-accent font-medium">{state.ok}</p> : null}

            {!isFormValid && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200/80 px-3 py-2 text-xs text-amber-900">
                <span className="font-bold shrink-0">Required (*):</span>
                <span>Fill in {missingFields.join(", ")} to save.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={pending || !isFormValid}
              className="justify-self-start rounded-md bg-navy px-4 py-2 text-sm text-white transition hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {pending ? "Saving..." : faq ? "Save changes" : "Add FAQ"}
            </button>
          </form>
          {faq ? (
            <form action={deleteAction} className="flex flex-wrap items-center gap-3 border-t border-line/60 pt-3">
              <input type="hidden" name="id" value={faq.id} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="confirm" value="yes" />
                Confirm delete
              </label>
              <button
                type="submit"
                disabled={deleting}
                className="rounded-md border border-line bg-white px-3 py-1.5 text-sm text-muted hover:text-red-600 transition"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
              {deleteState.error ? <p className="text-sm text-red-600">{deleteState.error}</p> : null}
            </form>
          ) : null}
        </div>
      )}
    </div>
  );
}
