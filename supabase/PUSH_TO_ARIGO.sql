-- Opt-in flag for listing a campus event on Arigo.
-- Paste into the shared Arigo Supabase SQL editor after review.
-- Safe to run more than once.
--
-- Also removes campus-sourced hosted events that were listed without this flag.
-- After this runs, tick Push to Arigo on the campus site and save/publish again.

alter table public.campus_events
  add column if not exists push_to_arigo boolean not null default false;

comment on column public.campus_events.push_to_arigo is
  'When true and published, list this event on Arigo as a partnered school event.';

-- Clear register links that pointed at Arigo hosted pages for events that are no longer opted in.
update public.campus_events
set registration_url = null
where coalesce(push_to_arigo, false) = false
  and registration_url is not null
  and registration_url ~* '/hosted/register/';

-- Remove campus-pushed rows from Arigo until they are opted in again.
delete from public.hosted_events
where source = 'iisscampus';
