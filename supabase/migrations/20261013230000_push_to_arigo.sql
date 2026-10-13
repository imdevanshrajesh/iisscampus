-- Opt-in flag for listing a campus event on Arigo.
-- Default false so existing events stop auto-syncing until checked again.
-- Safe to run more than once. Does not alter Arigo hosted_* tables.

alter table public.campus_events
  add column if not exists push_to_arigo boolean not null default false;

comment on column public.campus_events.push_to_arigo is
  'When true and published, list this event on Arigo as a partnered school event.';
