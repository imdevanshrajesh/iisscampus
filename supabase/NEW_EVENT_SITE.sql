-- PATTERN ONLY. Do not run this file as-is.
-- Copy it, replace every "example_" prefix with your event prefix (for example fifa_),
-- review the result, then paste into the Arigo Supabase SQL editor.
--
-- Rules:
--   - Same Supabase project as Arigo
--   - create table if not exists / additive changes only
--   - never drop or alter Arigo, hackathon_*, or campus_* tables
--   - reuse auth.users and complete_onboarding; do not invent a second auth system

create table if not exists public.example_registrations (
  id uuid primary key default gen_random_uuid(),
  team_name text not null,
  school_name text not null,
  leader_user_id uuid references auth.users (id) on delete set null,
  status text not null default 'submitted',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint example_registrations_team_len check (char_length(team_name) between 2 and 120),
  constraint example_registrations_school_len check (char_length(school_name) between 2 and 160)
);

create table if not exists public.example_members (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.example_registrations (id) on delete cascade,
  full_name text not null,
  email text,
  grade_year text,
  is_leader boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint example_members_name_len check (char_length(full_name) between 2 and 120)
);

create index if not exists example_registrations_leader_idx
  on public.example_registrations (leader_user_id);

create index if not exists example_members_registration_idx
  on public.example_members (registration_id, sort_order);

alter table public.example_registrations enable row level security;
alter table public.example_members enable row level security;

drop policy if exists example_registrations_select_own on public.example_registrations;
create policy example_registrations_select_own
  on public.example_registrations
  for select
  to authenticated
  using (leader_user_id = auth.uid());

drop policy if exists example_members_select_own on public.example_members;
create policy example_members_select_own
  on public.example_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.example_registrations r
      where r.id = registration_id
        and r.leader_user_id = auth.uid()
    )
  );

create or replace function public.example_submit_registration(
  p_team_name text,
  p_school_name text,
  p_members jsonb
)
returns public.example_registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  created public.example_registrations;
  member jsonb;
  idx int := 0;
begin
  if not public.is_first_party_client() then
    raise exception 'Third-party clients cannot submit directly';
  end if;

  if uid is null then
    raise exception 'Sign in required';
  end if;

  if p_members is null or jsonb_typeof(p_members) <> 'array' or jsonb_array_length(p_members) < 1 then
    raise exception 'Add at least one team member';
  end if;

  insert into public.example_registrations (team_name, school_name, leader_user_id)
  values (trim(p_team_name), trim(p_school_name), uid)
  returning * into created;

  for member in select * from jsonb_array_elements(p_members)
  loop
    insert into public.example_members (
      registration_id,
      full_name,
      email,
      grade_year,
      is_leader,
      sort_order
    ) values (
      created.id,
      trim(coalesce(member->>'full_name', '')),
      nullif(trim(coalesce(member->>'email', '')), ''),
      nullif(trim(coalesce(member->>'grade_year', '')), ''),
      coalesce((member->>'is_leader')::boolean, false),
      idx
    );
    idx := idx + 1;
  end loop;

  return created;
end;
$$;

revoke all on function public.example_submit_registration(text, text, jsonb) from public;
grant execute on function public.example_submit_registration(text, text, jsonb) to authenticated;
