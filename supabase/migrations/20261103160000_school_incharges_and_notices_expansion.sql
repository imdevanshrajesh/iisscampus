-- School incharges roster & notices/programs expansion

create table if not exists public.campus_school_incharges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  department text,
  photo_url text,
  about text not null default '',
  email text,
  phone text,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint campus_school_incharges_name_len check (char_length(name) between 2 and 120),
  constraint campus_school_incharges_role_len check (char_length(role) between 2 and 120),
  constraint campus_school_incharges_department_len check (department is null or char_length(department) <= 120),
  constraint campus_school_incharges_about_len check (char_length(about) <= 4000)
);

create index if not exists campus_school_incharges_published_idx
  on public.campus_school_incharges (published, sort_order);

drop trigger if exists campus_school_incharges_set_updated_at on public.campus_school_incharges;
create trigger campus_school_incharges_set_updated_at
before update on public.campus_school_incharges
for each row execute function public.set_updated_at();

alter table public.campus_school_incharges enable row level security;

drop policy if exists "Public reads published school incharges" on public.campus_school_incharges;
create policy "Public reads published school incharges"
on public.campus_school_incharges for select
using (published = true);

drop policy if exists "Staff reads school incharges" on public.campus_school_incharges;
create policy "Staff reads school incharges"
on public.campus_school_incharges for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

drop policy if exists "Staff writes school incharges" on public.campus_school_incharges;
create policy "Staff writes school incharges"
on public.campus_school_incharges for all
to authenticated
using (public.is_campus_admin() and public.is_first_party_client())
with check (public.is_campus_admin() and public.is_first_party_client());

grant select on public.campus_school_incharges to anon, authenticated;
grant insert, update, delete on public.campus_school_incharges to authenticated;
grant all on public.campus_school_incharges to service_role;

-- Announcements / Council Notices expansion: category/tag, linked program, linked wellness, cover image
alter table public.campus_announcements
  add column if not exists category text not null default 'General',
  add column if not exists program_id uuid references public.campus_custom_programs (id) on delete set null,
  add column if not exists wellness_id text,
  add column if not exists cover_image_url text;

-- Custom / Awareness Programs expansion: category/type, timing, pdf flyer
alter table public.campus_custom_programs
  add column if not exists category text not null default 'Awareness',
  add column if not exists timing text,
  add column if not exists pdf_url text;
