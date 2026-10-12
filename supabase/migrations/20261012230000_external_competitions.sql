-- Competitions hosted by other schools, and the name of the host school.
-- Safe to run more than once.

alter type public.campus_event_listing add value if not exists 'external';

alter table public.campus_events
  add column if not exists host_name text;

alter table public.campus_events
  drop constraint if exists campus_events_host_name_len;

alter table public.campus_events
  add constraint campus_events_host_name_len
  check (host_name is null or char_length(btrim(host_name)) between 1 and 120);
