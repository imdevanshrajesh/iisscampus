-- Additive migration: Academic Term / Year lifecycle across content tables
-- Idempotent: safe to run multiple times in Supabase SQL Editor.

alter table public.campus_settings
  add column if not exists active_term_label text,
  add column if not exists active_term_start date;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'campus_settings_active_term_label_len'
  ) then
    alter table public.campus_settings
      add constraint campus_settings_active_term_label_len
      check (active_term_label is null or char_length(btrim(active_term_label)) <= 32);
  end if;
end $$;

alter table public.campus_events
  add column if not exists academic_year text;

create index if not exists campus_events_academic_year_idx
  on public.campus_events (academic_year);

alter table public.campus_announcements
  add column if not exists academic_year text;

create index if not exists campus_announcements_academic_year_idx
  on public.campus_announcements (academic_year);

alter table public.campus_social_posts
  add column if not exists academic_year text;

create index if not exists campus_social_posts_academic_year_idx
  on public.campus_social_posts (academic_year);
