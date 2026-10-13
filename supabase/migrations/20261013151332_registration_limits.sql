-- Per-event registration limit, the number recorded so far, and a Google Form
-- shown once that limit is reached.
-- Safe to run more than once.

alter table public.campus_events
  add column if not exists registration_limit int,
  add column if not exists registration_count int not null default 0,
  add column if not exists overflow_registration_url text,
  add column if not exists overflow_registration_label text;

alter table public.campus_events
  alter column registration_count set default 0;

update public.campus_events
set registration_count = 0
where registration_count is null;

alter table public.campus_events
  alter column registration_count set not null;

alter table public.campus_events
  drop constraint if exists campus_events_registration_limit_pos;

alter table public.campus_events
  add constraint campus_events_registration_limit_pos
  check (registration_limit is null or registration_limit > 0);

alter table public.campus_events
  drop constraint if exists campus_events_registration_count_nonneg;

alter table public.campus_events
  add constraint campus_events_registration_count_nonneg
  check (registration_count >= 0);

alter table public.campus_events
  drop constraint if exists campus_events_overflow_url;

alter table public.campus_events
  add constraint campus_events_overflow_url
  check (
    overflow_registration_url is null
    or overflow_registration_url ~* '^https://(www\.)?forms\.gle/.+'
    or overflow_registration_url ~* '^https://(www\.)?docs\.google\.com/forms/.+'
  );

alter table public.campus_events
  drop constraint if exists campus_events_overflow_label_len;

alter table public.campus_events
  add constraint campus_events_overflow_label_len
  check (
    overflow_registration_label is null
    or char_length(btrim(overflow_registration_label)) between 1 and 80
  );
