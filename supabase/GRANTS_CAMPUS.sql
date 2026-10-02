-- Run this once in the Supabase SQL editor after the campus migration.
-- The tables exist, but the Data API roles still need privileges.
-- Row Level Security still decides which rows each role can see.

grant select on public.campus_categories to anon, authenticated;
grant insert, update on public.campus_categories to authenticated;

grant select on public.campus_settings to anon, authenticated;
grant update on public.campus_settings to authenticated;

grant select on public.campus_events to anon, authenticated;
grant insert, update on public.campus_events to authenticated;

grant select on public.campus_event_images to anon, authenticated;
grant insert, update, delete on public.campus_event_images to authenticated;

grant select on public.campus_event_relations to anon, authenticated;
grant insert, delete on public.campus_event_relations to authenticated;

grant select on public.campus_achievements to anon, authenticated;
grant insert, update on public.campus_achievements to authenticated;

grant select on public.campus_staff to authenticated;

grant select, insert on public.campus_audit_log to authenticated;

grant all on
  public.campus_categories,
  public.campus_settings,
  public.campus_events,
  public.campus_event_images,
  public.campus_event_relations,
  public.campus_achievements,
  public.campus_staff,
  public.campus_audit_log
to service_role;

grant execute on function public.is_campus_admin() to anon, authenticated, service_role;
grant execute on function public.is_campus_editor() to anon, authenticated, service_role;
grant execute on function public.campus_media_url_allowed(text) to anon, authenticated, service_role;
grant execute on function public.campus_reject_bad_media_url() to authenticated, service_role;
