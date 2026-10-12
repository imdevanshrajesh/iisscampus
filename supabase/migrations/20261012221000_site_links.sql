-- Labels and addresses for the school site, Instagram, the council account, and extra links.
-- Safe to run more than once. Does not overwrite links an administrator has already saved.

alter table public.campus_settings
  add column if not exists site_links jsonb;

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
