-- Columns the site already writes, missing from the live database.
-- Safe to run more than once. Does not overwrite saved links or newsletter text.

alter table public.campus_settings
  add column if not exists site_links jsonb,
  add column if not exists newsletter_title text,
  add column if not exists newsletter_image_url text,
  add column if not exists newsletter_href text,
  add column if not exists newsletter_pdf_url text,
  add column if not exists newsletter_published boolean not null default false;

update public.campus_settings
set site_links = jsonb_build_object(
  'schoolLabel', 'iiss.ae',
  'schoolUrl', 'https://iiss.ae',
  'instagramLabel', 'Instagram',
  'instagramUrl', coalesce(nullif(instagram_url, ''), 'https://www.instagram.com/iisscampus/'),
  'scixcomLabel', 'SciXcom',
  'scixcomInstagramUrl', coalesce(nullif(scixcom_instagram_url, ''), 'https://www.instagram.com/scixcom.27/'),
  'extraLinks', '[]'::jsonb
)
where id = true
  and site_links is null;

alter table public.campus_events
  add column if not exists push_to_arigo boolean not null default false;
