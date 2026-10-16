-- Logo, name, and link used only in the top bar.
-- Safe to run more than once.

alter table public.campus_settings
  add column if not exists nav_logo_url text;

alter table public.campus_settings
  drop constraint if exists campus_settings_nav_logo_https;

alter table public.campus_settings
  add constraint campus_settings_nav_logo_https
  check (nav_logo_url is null or nav_logo_url ~* '^https://');

alter table public.campus_settings
  add column if not exists nav_logo_href text;

alter table public.campus_settings
  drop constraint if exists campus_settings_nav_logo_href;

alter table public.campus_settings
  add constraint campus_settings_nav_logo_href
  check (nav_logo_href is null or nav_logo_href ~ '^(/|https://)');

alter table public.campus_settings
  add column if not exists nav_label text;

alter table public.campus_settings
  drop constraint if exists campus_settings_nav_label_len;

alter table public.campus_settings
  add constraint campus_settings_nav_label_len
  check (nav_label is null or char_length(btrim(nav_label)) between 1 and 40);
