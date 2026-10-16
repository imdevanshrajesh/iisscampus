import { NavGroupForm, NavItemForm } from "@/components/manage/nav-forms";
import { ManageUnavailable } from "@/components/manage/unavailable";
import { getEditableNavGroups } from "@/lib/data/queries";
import { requireAdministrator } from "@/lib/manage/access";

export default async function NavigationPage() {
  const access = await requireAdministrator();
  if (!access.ready) return <ManageUnavailable />;
  const groups = await getEditableNavGroups();
  const events = access.workspace.events.filter((event) => event.publicationStatus === "published");

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <h1 className="text-3xl font-medium tracking-tight">Navigation</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        These labels stay in the top bar. A label with cards opens them when someone clicks it. Choosing an activity
        fills that card from the event or competition.
      </p>
      {groups.length === 0 ? (
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
          If saving says the menu is missing, run supabase/NAVIGATION.sql in the database, then reload this page.
        </p>
      ) : null}
      <div className="mt-8 grid gap-6">
        <section className="grid gap-4 rounded-xl border border-line p-4">
          <h2 className="text-lg font-medium">New label</h2>
          <NavGroupForm group={null} />
        </section>
        {groups.map((group) => (
          <section key={group.id} className="grid gap-4 rounded-xl border border-line p-4">
            <h2 className="text-lg font-medium">{group.label}</h2>
            <NavGroupForm group={group} />
            <div className="grid gap-3">
              <h3 className="text-sm font-medium">Cards</h3>
              {group.items.map((item) => (
                <NavItemForm key={item.id} groupId={group.id} item={item} events={events} />
              ))}
              <NavItemForm groupId={group.id} item={null} events={events} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
