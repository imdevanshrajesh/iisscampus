-- Top-bar groups and the cards that open under them.

create table if not exists public.campus_nav_groups (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text,
  include_listing text,
  enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint campus_nav_groups_label_len check (char_length(btrim(label)) between 1 and 40),
  constraint campus_nav_groups_href check (
    href is null or href ~ '^(/|https://)'
  ),
  constraint campus_nav_groups_listing check (
    include_listing is null or include_listing in ('event', 'competition')
  )
);

create table if not exists public.campus_nav_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.campus_nav_groups (id) on delete cascade,
  title text not null default '',
  description text not null default '',
  href text,
  event_id uuid references public.campus_events (id) on delete set null,
  enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint campus_nav_items_title_len check (char_length(title) <= 80),
  constraint campus_nav_items_description_len check (char_length(description) <= 160),
  constraint campus_nav_items_href check (
    href is null or href ~ '^(/|https://)'
  ),
  constraint campus_nav_items_target check (
    event_id is not null or (char_length(btrim(title)) >= 1 and href is not null)
  )
);

create index if not exists campus_nav_groups_sort_idx
  on public.campus_nav_groups (enabled, sort_order);

create index if not exists campus_nav_items_group_idx
  on public.campus_nav_items (group_id, enabled, sort_order);

drop trigger if exists campus_nav_groups_set_updated_at on public.campus_nav_groups;
create trigger campus_nav_groups_set_updated_at
before update on public.campus_nav_groups
for each row execute function public.set_updated_at();

drop trigger if exists campus_nav_items_set_updated_at on public.campus_nav_items;
create trigger campus_nav_items_set_updated_at
before update on public.campus_nav_items
for each row execute function public.set_updated_at();

alter table public.campus_nav_groups enable row level security;
alter table public.campus_nav_items enable row level security;

drop policy if exists "Public reads enabled nav groups" on public.campus_nav_groups;
create policy "Public reads enabled nav groups"
on public.campus_nav_groups for select
using (enabled = true);

drop policy if exists "Staff reads nav groups" on public.campus_nav_groups;
create policy "Staff reads nav groups"
on public.campus_nav_groups for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

drop policy if exists "Staff writes nav groups" on public.campus_nav_groups;
create policy "Staff writes nav groups"
on public.campus_nav_groups for all
to authenticated
using (public.is_campus_admin() and public.is_first_party_client())
with check (public.is_campus_admin() and public.is_first_party_client());

drop policy if exists "Public reads enabled nav items" on public.campus_nav_items;
create policy "Public reads enabled nav items"
on public.campus_nav_items for select
using (
  enabled = true
  and exists (
    select 1
    from public.campus_nav_groups groups
    where groups.id = group_id
      and groups.enabled = true
  )
);

drop policy if exists "Staff reads nav items" on public.campus_nav_items;
create policy "Staff reads nav items"
on public.campus_nav_items for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

drop policy if exists "Staff writes nav items" on public.campus_nav_items;
create policy "Staff writes nav items"
on public.campus_nav_items for all
to authenticated
using (public.is_campus_admin() and public.is_first_party_client())
with check (public.is_campus_admin() and public.is_first_party_client());

grant select on public.campus_nav_groups to anon, authenticated;
grant insert, update, delete on public.campus_nav_groups to authenticated;
grant all on public.campus_nav_groups to service_role;

grant select on public.campus_nav_items to anon, authenticated;
grant insert, update, delete on public.campus_nav_items to authenticated;
grant all on public.campus_nav_items to service_role;

insert into public.campus_nav_groups (id, label, href, include_listing, enabled, sort_order)
values
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Home', '/', null, true, 0),
  ('a1b2c3d4-0001-4000-8000-000000000002', 'Events', null, 'event', true, 10),
  ('a1b2c3d4-0001-4000-8000-000000000003', 'Competitions', null, 'competition', true, 20),
  ('a1b2c3d4-0001-4000-8000-000000000004', 'Council', null, null, true, 30),
  ('a1b2c3d4-0001-4000-8000-000000000005', 'School', null, null, true, 40)
on conflict (id) do nothing;

insert into public.campus_nav_items (id, group_id, title, description, href, sort_order)
values
  ('a1b2c3d4-0002-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000002', 'All events', 'Everything coming up on campus', '/events', 0),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'a1b2c3d4-0001-4000-8000-000000000003', 'All competitions', 'Contests and fixtures on campus', '/competitions', 0),
  ('a1b2c3d4-0002-4000-8000-000000000003', 'a1b2c3d4-0001-4000-8000-000000000004', 'The council', 'Meet the boys'' student council', '/council', 0),
  ('a1b2c3d4-0002-4000-8000-000000000004', 'a1b2c3d4-0001-4000-8000-000000000005', 'Gallery', 'Photographs from campus', '/gallery', 0),
  ('a1b2c3d4-0002-4000-8000-000000000005', 'a1b2c3d4-0001-4000-8000-000000000005', 'Newsletter', 'The latest letter', '/newsletter', 10),
  ('a1b2c3d4-0002-4000-8000-000000000006', 'a1b2c3d4-0001-4000-8000-000000000005', 'Wellness', 'A quiet corner for wellbeing', '/wellness', 20),
  ('a1b2c3d4-0002-4000-8000-000000000007', 'a1b2c3d4-0001-4000-8000-000000000005', 'Achievements', 'Awards and results', '/achievements', 30),
  ('a1b2c3d4-0002-4000-8000-000000000008', 'a1b2c3d4-0001-4000-8000-000000000005', 'FAQ & About', 'Questions and how the council works', '/about', 40),
  ('a1b2c3d4-0002-4000-8000-000000000009', 'a1b2c3d4-0001-4000-8000-000000000004', 'Suggestions', 'Send a note to the council', '/suggestions', 10)
on conflict (id) do nothing;
