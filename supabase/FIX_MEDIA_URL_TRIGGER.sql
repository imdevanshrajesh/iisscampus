-- Fix: saving campus_events failed with
--   record "new" has no field "url"
-- The shared media-url trigger used NEW.url in a CASE expression. Postgres
-- still resolves that field against campus_events, which only has cover_image_url.
-- Run this once in the Supabase SQL editor, then try saving an event again.

create or replace function public.campus_reject_bad_media_url()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target text;
  row_json jsonb := to_jsonb(new);
begin
  target := case tg_table_name
    when 'campus_event_images' then row_json ->> 'url'
    when 'campus_council_photos' then row_json ->> 'url'
    when 'campus_achievements' then row_json ->> 'image_url'
    when 'campus_council_posts' then row_json ->> 'image_url'
    when 'campus_council_members' then row_json ->> 'image_url'
    else row_json ->> 'cover_image_url'
  end;
  if not public.campus_media_url_allowed(target) then
    raise exception 'Image URL is not allowed';
  end if;
  return new;
end;
$$;
