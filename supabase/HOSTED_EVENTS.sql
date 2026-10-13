-- Hosted events that students register for on Arigo.
-- Run this in the Arigo Supabase SQL editor. Campus and Arigo share that project.
-- Safe to run more than once.
--
-- This does not change campus_events, hackathon tables, profiles, or auth.users.
-- Venue and map already live on campus_events (location_name, location_map_url).
-- The registration link Arigo returns is saved in the existing registration_url column.

create table if not exists public.hosted_hosts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  campus_origin text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.hosted_events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosted_hosts (id) on delete cascade,
  external_id text not null,
  source text not null default 'iisscampus',
  title text not null,
  slug text not null,
  listing text not null default 'event',
  short_description text not null,
  full_description text not null,
  event_date date,
  end_date date,
  start_time time,
  end_time time,
  venue_name text,
  map_url text,
  grade_from int,
  grade_to int,
  fee_aed numeric(10, 2),
  capacity int,
  registration_deadline date,
  registration_instructions text,
  campus_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.hosted_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.hosted_events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'registered',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.hosted_hosts drop constraint if exists hosted_hosts_slug_unique;
alter table public.hosted_hosts add constraint hosted_hosts_slug_unique unique (slug);

alter table public.hosted_hosts drop constraint if exists hosted_hosts_slug_check;
alter table public.hosted_hosts
  add constraint hosted_hosts_slug_check
  check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

alter table public.hosted_hosts drop constraint if exists hosted_hosts_name_len;
alter table public.hosted_hosts
  add constraint hosted_hosts_name_len
  check (char_length(btrim(name)) between 2 and 160);

alter table public.hosted_hosts drop constraint if exists hosted_hosts_origin_https;
alter table public.hosted_hosts
  add constraint hosted_hosts_origin_https
  check (campus_origin is null or campus_origin ~* '^https://');

alter table public.hosted_events drop constraint if exists hosted_events_external_unique;
alter table public.hosted_events
  add constraint hosted_events_external_unique unique (host_id, source, external_id);

alter table public.hosted_events drop constraint if exists hosted_events_slug_unique;
alter table public.hosted_events
  add constraint hosted_events_slug_unique unique (host_id, slug);

alter table public.hosted_events drop constraint if exists hosted_events_listing_check;
alter table public.hosted_events
  add constraint hosted_events_listing_check
  check (listing in ('event', 'competition'));

alter table public.hosted_events drop constraint if exists hosted_events_slug_check;
alter table public.hosted_events
  add constraint hosted_events_slug_check
  check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

alter table public.hosted_events drop constraint if exists hosted_events_title_len;
alter table public.hosted_events
  add constraint hosted_events_title_len
  check (char_length(title) between 2 and 140);

alter table public.hosted_events drop constraint if exists hosted_events_short_len;
alter table public.hosted_events
  add constraint hosted_events_short_len
  check (char_length(short_description) between 10 and 280);

alter table public.hosted_events drop constraint if exists hosted_events_full_len;
alter table public.hosted_events
  add constraint hosted_events_full_len
  check (char_length(full_description) between 20 and 12000);

alter table public.hosted_events drop constraint if exists hosted_events_dates;
alter table public.hosted_events
  add constraint hosted_events_dates
  check (end_date is null or event_date is null or end_date >= event_date);

alter table public.hosted_events drop constraint if exists hosted_events_venue_len;
alter table public.hosted_events
  add constraint hosted_events_venue_len
  check (venue_name is null or char_length(btrim(venue_name)) between 1 and 160);

alter table public.hosted_events drop constraint if exists hosted_events_map_https;
alter table public.hosted_events
  add constraint hosted_events_map_https
  check (map_url is null or map_url ~* '^https://');

alter table public.hosted_events drop constraint if exists hosted_events_campus_https;
alter table public.hosted_events
  add constraint hosted_events_campus_https
  check (campus_url is null or campus_url ~* '^https://');

alter table public.hosted_events drop constraint if exists hosted_events_grade_range;
alter table public.hosted_events
  add constraint hosted_events_grade_range
  check (
    (grade_from is null and grade_to is null)
    or (
      grade_from is not null
      and grade_to is not null
      and grade_from between 1 and 12
      and grade_to between 1 and 12
      and grade_to >= grade_from
    )
  );

alter table public.hosted_events drop constraint if exists hosted_events_fee_nonneg;
alter table public.hosted_events
  add constraint hosted_events_fee_nonneg
  check (fee_aed is null or fee_aed >= 0);

alter table public.hosted_events drop constraint if exists hosted_events_capacity_pos;
alter table public.hosted_events
  add constraint hosted_events_capacity_pos
  check (capacity is null or capacity > 0);

alter table public.hosted_events drop constraint if exists hosted_events_instructions_len;
alter table public.hosted_events
  add constraint hosted_events_instructions_len
  check (
    registration_instructions is null
    or not (char_length(registration_instructions) > 500)
  );

alter table public.hosted_events drop constraint if exists hosted_events_source_len;
alter table public.hosted_events
  add constraint hosted_events_source_len
  check (char_length(btrim(source)) between 2 and 40);

alter table public.hosted_events drop constraint if exists hosted_events_external_len;
alter table public.hosted_events
  add constraint hosted_events_external_len
  check (char_length(btrim(external_id)) between 2 and 80);

alter table public.hosted_registrations drop constraint if exists hosted_registrations_once;
alter table public.hosted_registrations
  add constraint hosted_registrations_once unique (event_id, user_id);

alter table public.hosted_registrations drop constraint if exists hosted_registrations_status_check;
alter table public.hosted_registrations
  add constraint hosted_registrations_status_check
  check (status in ('registered'));

create index if not exists hosted_events_host_idx
  on public.hosted_events (host_id, event_date);

create index if not exists hosted_registrations_user_idx
  on public.hosted_registrations (user_id);

insert into public.hosted_hosts (slug, name, campus_origin)
values (
  'india-international-school',
  'India International School',
  'https://campus.buildkre.com'
)
on conflict (slug) do update
set
  name = excluded.name,
  campus_origin = excluded.campus_origin,
  updated_at = timezone('utc', now());

drop trigger if exists hosted_hosts_set_updated_at on public.hosted_hosts;
create trigger hosted_hosts_set_updated_at
before update on public.hosted_hosts
for each row execute function public.set_updated_at();

drop trigger if exists hosted_events_set_updated_at on public.hosted_events;
create trigger hosted_events_set_updated_at
before update on public.hosted_events
for each row execute function public.set_updated_at();

alter table public.hosted_hosts enable row level security;
alter table public.hosted_events enable row level security;
alter table public.hosted_registrations enable row level security;

drop policy if exists hosted_hosts_public_read on public.hosted_hosts;
create policy hosted_hosts_public_read
  on public.hosted_hosts
  for select
  to anon, authenticated
  using (true);

drop policy if exists hosted_events_public_read on public.hosted_events;
create policy hosted_events_public_read
  on public.hosted_events
  for select
  to anon, authenticated
  using (true);

drop policy if exists hosted_registrations_select_own on public.hosted_registrations;
create policy hosted_registrations_select_own
  on public.hosted_registrations
  for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.hosted_register(p_event_id uuid)
returns public.hosted_registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  event public.hosted_events;
  existing public.hosted_registrations;
  taken bigint;
begin
  if not public.is_first_party_client() then
    raise exception 'Third-party clients cannot register directly';
  end if;

  if uid is null then
    raise exception 'Sign in required';
  end if;

  select * into event
  from public.hosted_events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'Event not found';
  end if;

  if event.registration_deadline is not null
     and not (event.registration_deadline >= timezone('utc', now())::date) then
    raise exception 'Registration has closed';
  end if;

  select * into existing
  from public.hosted_registrations
  where event_id = p_event_id
    and user_id = uid;

  if found then
    return existing;
  end if;

  if event.capacity is not null then
    select count(*) into taken
    from public.hosted_registrations
    where event_id = p_event_id
      and status = 'registered';

    if taken >= event.capacity then
      raise exception 'This event is full';
    end if;
  end if;

  insert into public.hosted_registrations (event_id, user_id)
  values (p_event_id, uid)
  returning * into existing;

  return existing;
end;
$$;

revoke all on function public.hosted_register(uuid) from public;
grant execute on function public.hosted_register(uuid) to authenticated;

revoke all on public.hosted_hosts from public, anon, authenticated;
revoke all on public.hosted_events from public, anon, authenticated;
revoke all on public.hosted_registrations from public, anon, authenticated;

grant select on public.hosted_hosts to anon, authenticated;
grant select on public.hosted_events to anon, authenticated;
grant select on public.hosted_registrations to authenticated;

grant all on
  public.hosted_hosts,
  public.hosted_events,
  public.hosted_registrations
to service_role;
