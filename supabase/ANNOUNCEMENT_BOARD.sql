-- Paste into the Supabase SQL editor after reviewing.
-- Additive only. Safe to re-run where noted.

alter table public.campus_announcements
  add column if not exists title text,
  add column if not exists body text not null default '',
  add column if not exists resources jsonb not null default '[]'::jsonb;

update public.campus_announcements
set title = message
where title is null or btrim(title) = '';

alter table public.campus_announcements
  alter column title set not null;

alter table public.campus_announcements
  alter column message set default '';

alter table public.campus_announcements
  drop constraint if exists campus_announcements_message_len;

alter table public.campus_announcements
  add constraint campus_announcements_title_len check (char_length(title) between 2 and 200),
  add constraint campus_announcements_message_len check (char_length(message) <= 500),
  add constraint campus_announcements_body_len check (char_length(body) <= 8000);

create index if not exists campus_announcements_enabled_created_idx
  on public.campus_announcements (enabled, created_at desc);
