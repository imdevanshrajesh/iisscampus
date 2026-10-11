-- Paste into the Arigo Supabase SQL editor after reviewing.
-- Additive only. Does not alter Arigo, auth, or hackathon tables.
-- Safe to re-run: every change uses IF NOT EXISTS.

alter table public.campus_events
  add column if not exists resources jsonb not null default '[]'::jsonb;

alter table public.campus_achievements
  add column if not exists resources jsonb not null default '[]'::jsonb;

alter table public.campus_categories
  add column if not exists image_url text,
  add column if not exists pdf_url text;

alter table public.campus_settings
  add column if not exists newsletter_pdf_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'campus_categories_image_https'
  ) then
    alter table public.campus_categories
      add constraint campus_categories_image_https
      check (image_url is null or image_url ~* '^https://');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'campus_categories_pdf_https'
  ) then
    alter table public.campus_categories
      add constraint campus_categories_pdf_https
      check (pdf_url is null or pdf_url ~* '^https://');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'campus_settings_newsletter_pdf_https'
  ) then
    alter table public.campus_settings
      add constraint campus_settings_newsletter_pdf_https
      check (newsletter_pdf_url is null or newsletter_pdf_url ~* '^https://');
  end if;
end $$;
