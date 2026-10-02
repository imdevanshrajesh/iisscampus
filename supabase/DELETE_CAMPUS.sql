-- Allows editors to delete drafts and administrators to delete any campus record.
-- Run once in the Supabase SQL editor. Does not change Arigo tables.

grant delete on public.campus_events to authenticated;
grant delete on public.campus_achievements to authenticated;

drop policy if exists "Editors delete campus drafts" on public.campus_events;
create policy "Editors delete campus drafts"
on public.campus_events for delete
to authenticated
using (
  public.is_campus_editor()
  and public.is_first_party_client()
  and publication_status = 'draft'
);

drop policy if exists "Admins delete campus events" on public.campus_events;
create policy "Admins delete campus events"
on public.campus_events for delete
to authenticated
using (public.is_campus_admin() and public.is_first_party_client());

drop policy if exists "Editors delete achievement drafts" on public.campus_achievements;
create policy "Editors delete achievement drafts"
on public.campus_achievements for delete
to authenticated
using (
  public.is_campus_editor()
  and public.is_first_party_client()
  and publication_status = 'draft'
);

drop policy if exists "Admins delete campus achievements" on public.campus_achievements;
create policy "Admins delete campus achievements"
on public.campus_achievements for delete
to authenticated
using (public.is_campus_admin() and public.is_first_party_client());
