-- Removes only IISSCampus objects. Does not drop Arigo tables or functions.
-- Run in the SQL editor if the campus migration needs to be reversed.

drop trigger if exists campus_council_photos_media_url on public.campus_council_photos;
drop trigger if exists campus_council_posts_media_url on public.campus_council_posts;
drop trigger if exists campus_council_years_set_updated_at on public.campus_council_years;
drop table if exists public.campus_council_members;
drop table if exists public.campus_council_posts;
drop table if exists public.campus_council_photos;
drop table if exists public.campus_council_years;
drop type if exists public.campus_council_kind;

drop trigger if exists campus_events_media_url on public.campus_events;
drop trigger if exists campus_event_images_media_url on public.campus_event_images;
drop trigger if exists campus_achievements_media_url on public.campus_achievements;
drop trigger if exists campus_events_set_updated_at on public.campus_events;
drop trigger if exists campus_achievements_set_updated_at on public.campus_achievements;
drop trigger if exists campus_settings_set_updated_at on public.campus_settings;

drop table if exists public.campus_audit_log;
drop table if exists public.campus_staff;
drop table if exists public.campus_event_relations;
drop table if exists public.campus_event_images;
drop table if exists public.campus_achievements;
drop table if exists public.campus_events;
drop table if exists public.campus_settings;
drop table if exists public.campus_categories;

drop function if exists public.grant_campus_role(uuid, public.campus_role, text);
drop function if exists public.campus_reject_bad_media_url();
drop function if exists public.campus_media_url_allowed(text);
drop function if exists public.is_campus_editor();
drop function if exists public.is_campus_admin();

drop type if exists public.campus_role;
drop type if exists public.campus_event_status;
drop type if exists public.campus_publication_status;
