-- Pinned Instagram & Social Posts
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

create index if not exists campus_social_posts_pinned_idx
  on public.campus_social_posts (pinned, sort_order asc, published_on desc);

alter table public.campus_social_posts enable row level security;

drop policy if exists "Public reads pinned social posts" on public.campus_social_posts;
create policy "Public reads pinned social posts"
  on public.campus_social_posts for select
  to anon, authenticated
  using (pinned = true);

drop policy if exists "Admins manage social posts" on public.campus_social_posts;
do $$
begin
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
    execute '
      create policy "Admins manage social posts"
        on public.campus_social_posts for all
        to authenticated
        using (true)
        with check (true)
    ';
  end if;
end $$;

grant select on public.campus_social_posts to anon, authenticated;
grant all on public.campus_social_posts to authenticated;
grant all on public.campus_social_posts to service_role;
