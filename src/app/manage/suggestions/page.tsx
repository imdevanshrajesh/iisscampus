import { DeleteRecord } from "@/components/manage/delete-record";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { getStaffSuggestions } from "@/lib/data/queries";
import { requireAdministrator } from "@/lib/manage/access";
import { deleteSuggestion } from "@/lib/suggestions/actions";

const when = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Dubai",
});

export default async function SuggestionsManagePage() {
  const access = await requireAdministrator();
  if (!access.ready) return <ManageUnavailable />;
  const { items, missing } = await getStaffSuggestions();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <h1 className="text-3xl font-medium tracking-tight">Suggestions</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Notes sent from the public suggestions page. They stay in this workspace.
      </p>
      {missing ? (
        <p className="mt-6 text-sm">Run supabase/SUGGESTIONS.sql in the database, then refresh this page.</p>
      ) : null}
      {items.length ? (
        <ul className="mt-8 grid gap-4">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-[#e3e6ea] bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <a href={`mailto:${item.email}`} className="text-sm font-medium">
                  {item.email}
                </a>
                <time className="text-xs text-muted" dateTime={item.createdAt}>
                  {when.format(new Date(item.createdAt))}
                </time>
              </div>
              <p className="mt-3 text-sm leading-6 whitespace-pre-wrap">{item.body}</p>
              <div className="mt-4">
                <DeleteRecord action={deleteSuggestion} id={item.id} label="Delete" />
              </div>
            </li>
          ))}
        </ul>
      ) : missing ? null : (
        <p className="mt-8 text-sm text-muted">No suggestions yet.</p>
      )}
      {items.length === 200 ? <p className="mt-4 text-sm text-muted">Showing the latest 200.</p> : null}
    </div>
  );
}
