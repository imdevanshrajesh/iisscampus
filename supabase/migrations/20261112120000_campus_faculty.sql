-- Campus Faculty directory (Principal, Vice Principals, Headmistress & Headmaster, Supervisors)
-- and Navigation menu entry under School.

create table if not exists public.campus_faculty (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  tier text not null default 'supervisor',
  department text,
  photo_url text,
  message text not null default '',
  email text,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint campus_faculty_name_len check (char_length(btrim(name)) between 2 and 120),
  constraint campus_faculty_role_len check (char_length(btrim(role)) between 2 and 120),
  constraint campus_faculty_tier_check check (tier in ('principal', 'vice_principal', 'head', 'supervisor')),
  constraint campus_faculty_department_len check (department is null or char_length(department) <= 120),
  constraint campus_faculty_photo_len check (photo_url is null or char_length(photo_url) <= 2048),
  constraint campus_faculty_message_len check (char_length(message) <= 4000),
  constraint campus_faculty_email_len check (email is null or char_length(email) <= 160)
);

create index if not exists campus_faculty_published_idx
  on public.campus_faculty (published, sort_order, created_at);

drop trigger if exists campus_faculty_set_updated_at on public.campus_faculty;
create trigger campus_faculty_set_updated_at
before update on public.campus_faculty
for each row execute function public.set_updated_at();

alter table public.campus_faculty enable row level security;

drop policy if exists "Public reads published faculty" on public.campus_faculty;
create policy "Public reads published faculty"
on public.campus_faculty for select
using (published = true);

drop policy if exists "Staff reads faculty" on public.campus_faculty;
create policy "Staff reads faculty"
on public.campus_faculty for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

drop policy if exists "Staff writes faculty" on public.campus_faculty;
create policy "Staff writes faculty"
on public.campus_faculty for all
to authenticated
using (public.is_campus_editor() and public.is_first_party_client())
with check (public.is_campus_editor() and public.is_first_party_client());

grant select on public.campus_faculty to anon, authenticated;
grant insert, update, delete on public.campus_faculty to authenticated;
grant all on public.campus_faculty to service_role;

-- Initial editable rows in the database (only inserted when the table is empty).
-- Every record is editable and removable directly from the Faculty page or /manage/faculty.
insert into public.campus_faculty (name, role, tier, department, message, sort_order, published)
select v.name, v.role, v.tier, v.department, v.message, v.sort_order, v.published
from (
  values
    ('Principal', 'Principal', 'principal', 'India International School, Sharjah', '', 1, true),
    ('Shifana Muiz', 'Vice Principal', 'vice_principal', null, '', 10, true),
    ('Mr. Sunaj Abdul Majeed', 'Vice Principal', 'vice_principal', null, '', 20, true),
    ('Headmistress', 'Headmistress', 'head', null, '', 30, true),
    ('Headmaster', 'Headmaster', 'head', null, '', 40, true),
    ('Abdul Haleem', 'Supervisor', 'supervisor', null, '', 50, true)
) as v(name, role, tier, department, message, sort_order, published)
where not exists (select 1 from public.campus_faculty);

-- Add Faculty under School in the top navigation menu if not already present.
insert into public.campus_nav_items (id, group_id, title, description, href, sort_order, enabled)
select
  'a1b2c3d4-0002-4000-8000-000000000101'::uuid,
  school_group.id,
  'Faculty',
  'Principal, Vice Principals, Heads & Supervisors',
  '/school/faculty',
  5,
  true
from (
  select id
  from public.campus_nav_groups
  where lower(label) like '%school%' or id = 'a1b2c3d4-0001-4000-8000-000000000005'
  limit 1
) school_group
where not exists (
  select 1
  from public.campus_nav_items existing
  where existing.href in ('/school/faculty', '/faculty')
);
