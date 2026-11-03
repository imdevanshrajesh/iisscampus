-- ==============================================================================
-- IISS BOYS CAMPUS - HOUSES, NOTICES & NAVIGATION MIGRATION SCRIPT
-- ==============================================================================

-- Clean up any legacy heads/incharges table
drop table if exists public.campus_school_incharges cascade;

-- 1. CAMPUS HOUSES TABLE (RUBY, SAPPHIRE, TOPAZ, EMERALD)
create table if not exists public.campus_houses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  color text not null, -- 'ruby', 'sapphire', 'topaz', 'emerald'
  points int default 0,
  incharge_name text not null default '',
  incharge_title text default 'Faculty Incharge',
  incharge_photo_url text,
  incharge_message text,
  captain_name text not null default '',
  captain_photo_url text,
  vice_captain_name text not null default '',
  vice_captain_photo_url text,
  motto text,
  description text,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint campus_houses_name_len check (char_length(name) between 2 and 80),
  constraint campus_houses_slug_len check (char_length(slug) between 2 and 40)
);

alter table public.campus_houses add column if not exists incharge_message text;

create index if not exists campus_houses_sort_idx
  on public.campus_houses (sort_order, slug);

drop trigger if exists campus_houses_set_updated_at on public.campus_houses;
create trigger campus_houses_set_updated_at
before update on public.campus_houses
for each row execute function public.set_updated_at();

alter table public.campus_houses enable row level security;

drop policy if exists "Public reads published houses" on public.campus_houses;
create policy "Public reads published houses"
on public.campus_houses for select
using (published = true);

drop policy if exists "Staff reads houses" on public.campus_houses;
create policy "Staff reads houses"
on public.campus_houses for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

drop policy if exists "Staff writes houses" on public.campus_houses;
create policy "Staff writes houses"
on public.campus_houses for all
to authenticated
using (public.is_campus_admin() and public.is_first_party_client())
with check (public.is_campus_admin() and public.is_first_party_client());

grant select on public.campus_houses to anon, authenticated;
grant all on public.campus_houses to authenticated;


-- 2. SEED THE 4 HOUSES (RUBY, SAPPHIRE, TOPAZ, EMERALD)
insert into public.campus_houses (name, slug, color, incharge_name, incharge_title, incharge_message, captain_name, vice_captain_name, motto, description, sort_order)
values
  (
    'Ruby',
    'ruby',
    'ruby',
    'Mr. Tariq Mansoor',
    'Faculty Incharge',
    'Strive with courage, give your utmost on every sports field, and hold your head high in triumph or defeat.',
    'ZAYAN JASSEER',
    'DANIAL POULOSE',
    'Courage, Passion & Strength',
    'United under the scarlet banner of courage, valor, and unwavering sportsmanship.',
    1
  ),
  (
    'Sapphire',
    'sapphire',
    'sapphire',
    'Mr. Suhail Hashim',
    'Faculty Incharge',
    'Wisdom is our armor, truth our shield. Compete with dignity and excel through brotherhood.',
    'ZAYAN MUHAMMED RIZAM',
    'SALAH MAHARUS NISAN',
    'Wisdom, Loyalty & Honor',
    'Soaring with the spirit of the ocean and sky, guided by integrity and sharp intellect.',
    2
  ),
  (
    'Topaz',
    'topaz',
    'topaz',
    'Mr. Abdul Razak',
    'Faculty Incharge',
    'Bring radiant enthusiasm, never surrender to doubt, and illuminate the campus with golden resolve.',
    'MOHAMMED IHSAN',
    'STEPHEN MASCARENHAS',
    'Brilliance, Energy & Optimism',
    'Radiating warmth, unstoppable enthusiasm, creativity, and tireless perseverance.',
    3
  ),
  (
    'Emerald',
    'emerald',
    'emerald',
    'Mr. Faisal Siddiqui',
    'Faculty Incharge',
    'Rooted like mighty trees, we grow together in resilience, discipline, and quiet determination.',
    'MOHAMMED AAZIM',
    'SHAZ MOHAMMED',
    'Growth, Harmony & Resilience',
    'Rooted in discipline and unity, flourishing through team spirit and quiet determination.',
    4
  )
on conflict (slug) do update set
  incharge_message = excluded.incharge_message,
  motto = excluded.motto,
  description = excluded.description;


-- 3. EXPAND NOTICES & CIRCULARS TABLE
alter table public.campus_announcements add column if not exists category text not null default 'general';
alter table public.campus_announcements add column if not exists program_id uuid references public.campus_custom_programs(id) on delete set null;
alter table public.campus_announcements add column if not exists wellness_id uuid references public.campus_wellness_items(id) on delete set null;
alter table public.campus_announcements add column if not exists cover_image_url text;


-- 4. EXPAND AWARENESS PROGRAMS TABLE
alter table public.campus_custom_programs add column if not exists category text not null default 'General';
alter table public.campus_custom_programs add column if not exists timing text;
alter table public.campus_custom_programs add column if not exists pdf_url text;


-- 5. NAVIGATION STRUCTURE UPDATE
-- Clean out any stray leadership or programs links from public navigation
delete from public.campus_nav_items
where href in ('/school/heads', '/heads', '/school/incharges', '/incharges', '/council/houses', '/programs', '/school/programs');

-- Move Newsletter to Council navigation group
update public.campus_nav_items items
set group_id = council_group.id,
    sort_order = 4
from (
  select id from public.campus_nav_groups
  where lower(label) = 'council' or id = 'a1b2c3d4-0001-4000-8000-000000000004'
  limit 1
) council_group
where items.href = '/newsletter';

-- Insert Houses under School navigation group
insert into public.campus_nav_items (id, group_id, title, description, href, sort_order, enabled)
select
  'a1b2c3d4-0002-4000-8000-000000000099'::uuid,
  school_group.id,
  'Houses',
  'Ruby, Sapphire, Topaz & Emerald',
  '/school/houses',
  0,
  true
from (
  select id from public.campus_nav_groups
  where lower(label) like '%school%' or id = 'a1b2c3d4-0001-4000-8000-000000000005'
  limit 1
) school_group
where not exists (
  select 1 from public.campus_nav_items existing
  where existing.href in ('/school/houses', '/houses')
);

-- Ensure correct ordering and URL for Houses
update public.campus_nav_items
set title = 'Houses',
    description = 'Ruby, Sapphire, Topaz & Emerald',
    href = '/school/houses',
    sort_order = 0
where href in ('/school/houses', '/houses');

-- Update Notices & Posts nav label
update public.campus_nav_items
set title = 'Notices & Posts',
    description = 'Official circulars, blogs & posts'
where href = '/announcements';
