-- Student council years for IISSCampus. Additive. Does not alter Arigo tables.
-- Apply after 20261002120000_campus_content.sql.
-- Expects public.set_updated_at(), public.is_campus_editor(), public.is_campus_admin(),
-- public.is_first_party_client(), and public.campus_reject_bad_media_url() to exist.

create type public.campus_council_kind as enum ('current', 'upcoming', 'past');

create table public.campus_council_years (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  slug text not null unique,
  kind public.campus_council_kind not null default 'current',
  summary text not null default '',
  publication_status public.campus_publication_status not null default 'draft',
  sort_order int not null default 0,
  is_sample boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz,
  constraint campus_council_years_slug check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint campus_council_years_label_len check (char_length(label) between 2 and 40),
  constraint campus_council_years_summary_len check (char_length(summary) <= 800)
);

create table public.campus_council_photos (
  id uuid primary key default gen_random_uuid(),
  year_id uuid not null references public.campus_council_years (id) on delete cascade,
  url text not null,
  alt text not null,
  caption text,
  sort_order int not null default 0,
  constraint campus_council_photos_https check (url ~* '^https://'),
  constraint campus_council_photos_alt_len check (char_length(alt) between 1 and 200)
);

create table public.campus_council_posts (
  id uuid primary key default gen_random_uuid(),
  year_id uuid not null references public.campus_council_years (id) on delete cascade,
  title text not null,
  body text not null,
  published_on date,
  image_url text,
  image_alt text,
  sort_order int not null default 0,
  constraint campus_council_posts_title_len check (char_length(title) between 2 and 140),
  constraint campus_council_posts_body_len check (char_length(body) between 10 and 8000),
  constraint campus_council_posts_image_https check (image_url is null or image_url ~* '^https://')
);

create index campus_council_years_publication_idx on public.campus_council_years (publication_status, kind, sort_order);
create index campus_council_photos_year_idx on public.campus_council_photos (year_id, sort_order);
create index campus_council_posts_year_idx on public.campus_council_posts (year_id, sort_order);

create trigger campus_council_years_set_updated_at
before update on public.campus_council_years
for each row execute function public.set_updated_at();

create or replace function public.campus_reject_bad_media_url()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target text;
begin
  target := case
    when tg_table_name = 'campus_event_images' then new.url
    when tg_table_name = 'campus_council_photos' then new.url
    when tg_table_name = 'campus_achievements' then new.image_url
    when tg_table_name = 'campus_council_posts' then new.image_url
    when tg_table_name = 'campus_council_members' then new.image_url
    else new.cover_image_url
  end;
  if not public.campus_media_url_allowed(target) then
    raise exception 'Image URL is not allowed';
  end if;
  return new;
end;
$$;

create trigger campus_council_photos_media_url
before insert or update of url on public.campus_council_photos
for each row execute function public.campus_reject_bad_media_url();

create trigger campus_council_posts_media_url
before insert or update of image_url on public.campus_council_posts
for each row execute function public.campus_reject_bad_media_url();

alter table public.campus_council_years enable row level security;
alter table public.campus_council_photos enable row level security;
alter table public.campus_council_posts enable row level security;

create policy "Public reads published council years"
on public.campus_council_years for select
using (publication_status = 'published');

create policy "Staff reads council years"
on public.campus_council_years for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

create policy "Staff inserts council drafts"
on public.campus_council_years for insert
to authenticated
with check (
  public.is_campus_editor()
  and public.is_first_party_client()
  and publication_status = 'draft'
  and published_at is null
);

create policy "Editors update council drafts"
on public.campus_council_years for update
to authenticated
using (
  public.is_campus_editor()
  and public.is_first_party_client()
  and publication_status in ('draft', 'in_review')
)
with check (
  public.is_campus_editor()
  and public.is_first_party_client()
  and publication_status in ('draft', 'in_review')
);

create policy "Admins update council years"
on public.campus_council_years for update
to authenticated
using (public.is_campus_admin() and public.is_first_party_client())
with check (public.is_campus_admin() and public.is_first_party_client());

create policy "Editors delete council drafts"
on public.campus_council_years for delete
to authenticated
using (
  public.is_campus_editor()
  and public.is_first_party_client()
  and publication_status = 'draft'
);

create policy "Admins delete council years"
on public.campus_council_years for delete
to authenticated
using (public.is_campus_admin() and public.is_first_party_client());

create policy "Public reads council photos"
on public.campus_council_photos for select
using (
  exists (
    select 1 from public.campus_council_years year
    where year.id = year_id and year.publication_status = 'published'
  )
);

create policy "Staff reads council photos"
on public.campus_council_photos for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

create policy "Staff writes council photos"
on public.campus_council_photos for insert
to authenticated
with check (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1 from public.campus_council_years year
    where year.id = year_id
      and (public.is_campus_admin() or year.publication_status in ('draft', 'in_review'))
  )
);

create policy "Staff updates council photos"
on public.campus_council_photos for update
to authenticated
using (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1 from public.campus_council_years year
    where year.id = year_id
      and (public.is_campus_admin() or year.publication_status in ('draft', 'in_review'))
  )
)
with check (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1 from public.campus_council_years year
    where year.id = year_id
      and (public.is_campus_admin() or year.publication_status in ('draft', 'in_review'))
  )
);

create policy "Staff deletes council photos"
on public.campus_council_photos for delete
to authenticated
using (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1 from public.campus_council_years year
    where year.id = year_id
      and (public.is_campus_admin() or year.publication_status in ('draft', 'in_review'))
  )
);

create policy "Public reads council posts"
on public.campus_council_posts for select
using (
  exists (
    select 1 from public.campus_council_years year
    where year.id = year_id and year.publication_status = 'published'
  )
);

create policy "Staff reads council posts"
on public.campus_council_posts for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

create policy "Staff writes council posts"
on public.campus_council_posts for insert
to authenticated
with check (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1 from public.campus_council_years year
    where year.id = year_id
      and (public.is_campus_admin() or year.publication_status in ('draft', 'in_review'))
  )
);

create policy "Staff updates council posts"
on public.campus_council_posts for update
to authenticated
using (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1 from public.campus_council_years year
    where year.id = year_id
      and (public.is_campus_admin() or year.publication_status in ('draft', 'in_review'))
  )
)
with check (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1 from public.campus_council_years year
    where year.id = year_id
      and (public.is_campus_admin() or year.publication_status in ('draft', 'in_review'))
  )
);

create policy "Staff deletes council posts"
on public.campus_council_posts for delete
to authenticated
using (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1 from public.campus_council_years year
    where year.id = year_id
      and (public.is_campus_admin() or year.publication_status in ('draft', 'in_review'))
  )
);

create table public.campus_council_members (
  id uuid primary key default gen_random_uuid(),
  year_id uuid not null references public.campus_council_years (id) on delete cascade,
  role text not null,
  name text not null,
  image_url text,
  image_alt text,
  sort_order int not null default 0,
  constraint campus_council_members_role_len check (char_length(role) between 2 and 80),
  constraint campus_council_members_name_len check (char_length(name) between 2 and 80),
  constraint campus_council_members_image_https check (image_url is null or image_url ~* '^https://')
);

create index campus_council_members_year_idx on public.campus_council_members (year_id, sort_order);

create trigger campus_council_members_media_url
before insert or update of image_url on public.campus_council_members
for each row execute function public.campus_reject_bad_media_url();

alter table public.campus_council_members enable row level security;

create policy "Public reads council members"
on public.campus_council_members for select
using (
  exists (
    select 1 from public.campus_council_years year
    where year.id = year_id and year.publication_status = 'published'
  )
);

create policy "Staff reads council members"
on public.campus_council_members for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

create policy "Staff writes council members"
on public.campus_council_members for insert
to authenticated
with check (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1 from public.campus_council_years year
    where year.id = year_id
      and (public.is_campus_admin() or year.publication_status in ('draft', 'in_review'))
  )
);

create policy "Staff updates council members"
on public.campus_council_members for update
to authenticated
using (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1 from public.campus_council_years year
    where year.id = year_id
      and (public.is_campus_admin() or year.publication_status in ('draft', 'in_review'))
  )
)
with check (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1 from public.campus_council_years year
    where year.id = year_id
      and (public.is_campus_admin() or year.publication_status in ('draft', 'in_review'))
  )
);

create policy "Staff deletes council members"
on public.campus_council_members for delete
to authenticated
using (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1 from public.campus_council_years year
    where year.id = year_id
      and (public.is_campus_admin() or year.publication_status in ('draft', 'in_review'))
  )
);

grant select on public.campus_council_years to anon, authenticated;
grant insert, update, delete on public.campus_council_years to authenticated;

grant select on public.campus_council_photos to anon, authenticated;
grant insert, update, delete on public.campus_council_photos to authenticated;

grant select on public.campus_council_posts to anon, authenticated;
grant insert, update, delete on public.campus_council_posts to authenticated;

grant select on public.campus_council_members to anon, authenticated;
grant insert, update, delete on public.campus_council_members to authenticated;

grant all on
  public.campus_council_years,
  public.campus_council_photos,
  public.campus_council_posts,
  public.campus_council_members
to service_role;
