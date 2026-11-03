import { ManageSuggestionsList } from "@/components/manage/manage-suggestions-list";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { getStaffSuggestions } from "@/lib/data/queries";
import { requireAdministrator } from "@/lib/manage/access";

export default async function SuggestionsManagePage() {
  const access = await requireAdministrator();
  if (!access.ready) return <ManageUnavailable />;
  const { items, missing } = await getStaffSuggestions();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Student Suggestions</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Notes and ideas sent from students via the public suggestion box. Click any row to expand details.
          </p>
        </div>
        <div className="text-xs text-muted">
          Total notes: <span className="font-semibold text-ink">{items.length}</span>
        </div>
      </div>

      {missing ? (
        <p className="mt-6 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          Run supabase/SUGGESTIONS.sql in the database, then refresh this page.
        </p>
      ) : null}

      <div className="mt-8">
        {items.length ? (
          <ManageSuggestionsList items={items} />
        ) : missing ? null : (
          <p className="mt-8 text-sm text-muted">No student suggestions submitted yet.</p>
        )}
      </div>

      {items.length === 200 ? <p className="mt-4 text-xs text-muted">Showing the latest 200.</p> : null}
    </div>
  );
}
