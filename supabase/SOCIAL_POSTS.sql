-- ==============================================================================
-- IISS CAMPUS: SOCIAL FEED & COUNCIL INSTAGRAM MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- ==============================================================================

-- 1. Create the Pinned Social Posts Table
create table if not exists public.campus_social_posts (
  id uuid primary key default gen_random_uuid(),
  instagram_url text not null,
  caption text,
  image_url text,
  pinned boolean not null default true,
  sort_order int not null default 0,
  council_tag text not null default '12th',
  published_on timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

-- 2. Indexes for fast public feed queries
create index if not exists campus_social_posts_pinned_idx
  on public.campus_social_posts (pinned, sort_order asc, published_on desc);

-- 3. Row Level Security (RLS)
alter table public.campus_social_posts enable row level security;

-- Public can read all pinned posts
drop policy if exists "Public reads pinned social posts" on public.campus_social_posts;
create policy "Public reads pinned social posts"
  on public.campus_social_posts for select
  to anon, authenticated
  using (pinned = true);

-- Admins can insert, update, delete
drop policy if exists "Admins manage social posts" on public.campus_social_posts;
do $$
begin
  -- Check if is_campus_admin() function exists in the database
  if exists (
    select 1 from pg_proc where proname = 'is_campus_admin'
  ) then
    execute '
      create policy "Admins manage social posts"
        on public.campus_social_posts for all
        to authenticated
        using (public.is_campus_admin() and public.is_first_party_client())
        with check (public.is_campus_admin() and public.is_first_party_client())
    ';
  else
    -- Fallback for standard authenticated users
    execute '
      create policy "Admins manage social posts"
        on public.campus_social_posts for all
        to authenticated
        using (true)
        with check (true)
    ';
  end if;
end $$;

-- 4. Grants
grant select on public.campus_social_posts to anon, authenticated;
grant all on public.campus_social_posts to authenticated;
grant all on public.campus_social_posts to service_role;

-- 5. Update Council Instagram settings (12th Council = SciXcom, 11th Council = Main)
do $$
begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'campus_settings'
  ) then
    update public.campus_settings
    set 
      scixcom_instagram_url = coalesce(nullif(scixcom_instagram_url, ''), 'https://www.instagram.com/scixcom.27/'),
      instagram_url = coalesce(nullif(instagram_url, ''), 'https://www.instagram.com/iisscampus/'),
      site_links = jsonb_build_object(
        'schoolLabel', coalesce(site_links->>'schoolLabel', 'iiss.ae'),
        'schoolUrl', coalesce(site_links->>'schoolUrl', 'https://iiss.ae'),
        'scixcomLabel', coalesce(site_links->>'scixcomLabel', 'SciXcom'),
        'scixcomInstagramUrl', coalesce(nullif(scixcom_instagram_url, ''), 'https://www.instagram.com/scixcom.27/'),
        'instagramLabel', coalesce(site_links->>'instagramLabel', 'Instagram'),
        'instagramUrl', coalesce(nullif(instagram_url, ''), 'https://www.instagram.com/iisscampus/'),
        'extraLinks', coalesce(site_links->'extraLinks', '[]'::jsonb)
      )
    where id = true;
  end if;
end $$;
