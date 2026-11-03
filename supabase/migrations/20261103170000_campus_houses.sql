-- Campus houses & points system

create table if not exists public.campus_houses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  color text not null,
  points int not null default 0,
  incharge_name text not null default '',
  incharge_title text,
  incharge_photo_url text,
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
  constraint campus_houses_slug_len check (char_length(slug) between 2 and 40),
  constraint campus_houses_points_nonneg check (points >= 0)
);

create index if not exists campus_houses_sort_idx
  on public.campus_houses (sort_order, points desc);

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

-- Seed the four official campus houses
insert into public.campus_houses (name, slug, color, points, incharge_name, incharge_title, captain_name, vice_captain_name, motto, description, sort_order)
values
  (
    'Ruby House',
    'ruby',
    'ruby',
    1450,
    'Mr. Tariq Mansoor',
    'Faculty Incharge',
    'ZAYAN JASSEER',
    'DANIAL POULOSE',
    'Courage, Passion & Strength',
    'United under the scarlet banner of courage, valor, and unwavering sportsmanship.',
    1
  ),
  (
    'Sapphire House',
    'sapphire',
    'sapphire',
    1520,
    'Mr. Suhail Hashim',
    'Faculty Incharge',
    'ZAYAN MUHAMMED RIZAM',
    'SALAH MAHARUS NISAN',
    'Wisdom, Loyalty & Honor',
    'Soaring with the spirit of the ocean and sky, guided by integrity and sharp intellect.',
    2
  ),
  (
    'Topaz House',
    'topaz',
    'topaz',
    1380,
    'Mr. Abdul Razak',
    'Faculty Incharge',
    'MOHAMMED IHSAN',
    'STEPHEN MASCARENHAS',
    'Brilliance, Energy & Optimism',
    'Radiating warmth, unstoppable enthusiasm, creativity, and tireless perseverance.',
    3
  ),
  (
    'Emerald House',
    'emerald',
    'emerald',
    1490,
    'Mr. Faisal Siddiqui',
    'Faculty Incharge',
    'MOHAMMED AAZIM',
    'SHAZ MOHAMMED',
    'Growth, Harmony & Resilience',
    'Rooted in discipline and unity, flourishing through team spirit and quiet determination.',
    4
  )
on conflict (slug) do nothing;
