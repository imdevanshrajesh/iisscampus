-- Additive IISSCampus tables for the existing Arigo Supabase project.
-- Do not apply this file until it has been reviewed.
-- It does not alter Arigo tables, auth settings, or student data.
-- It expects public.set_updated_at() and public.is_first_party_client() to already exist.
-- Rollback: supabase/ROLLBACK_CAMPUS.sql

create type public.campus_publication_status as enum ('draft', 'in_review', 'published', 'archived');
create type public.campus_event_status as enum ('upcoming', 'ongoing', 'completed');
create type public.campus_role as enum ('editor', 'administrator');

create table public.campus_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint campus_categories_slug check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.campus_settings (
  id boolean primary key default true check (id),
  media_hosts text[] not null default '{}',
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.campus_settings (id, media_hosts) values (true, '{}');

create table public.campus_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text not null,
  full_description text not null,
  category_id uuid not null references public.campus_categories (id),
  cover_image_url text,
  cover_alt text,
  cover_attribution text,
  event_date date,
  end_date date,
  publication_status public.campus_publication_status not null default 'draft',
  event_status public.campus_event_status,
  featured boolean not null default false,
  is_sample boolean not null default false,
  registration_enabled boolean not null default false,
  registration_provider text,
  registration_url text,
  registration_label text,
  registration_deadline date,
  registration_instructions text,
  instagram_url text,
  purpose text,
  activities text,
  schedule jsonb not null default '[]'::jsonb,
  groups jsonb not null default '[]'::jsonb,
  video_url text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz,
  constraint campus_events_slug check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint campus_events_title_len check (char_length(title) between 2 and 140),
  constraint campus_events_short_len check (char_length(short_description) between 10 and 280),
  constraint campus_events_dates check (end_date is null or event_date is null or end_date >= event_date),
  constraint campus_events_cover_https check (cover_image_url is null or cover_image_url ~* '^https://'),
  constraint campus_events_registration_https check (registration_url is null or registration_url ~* '^https://'),
  constraint campus_events_instagram_https check (instagram_url is null or instagram_url ~* '^https://'),
  constraint campus_events_video_https check (video_url is null or video_url ~* '^https://')
);

create table public.campus_event_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.campus_events (id) on delete cascade,
  url text not null,
  alt text not null,
  caption text,
  attribution text,
  sort_order int not null default 0,
  constraint campus_event_images_https check (url ~* '^https://'),
  constraint campus_event_images_alt_len check (char_length(alt) between 1 and 200)
);

create table public.campus_event_relations (
  event_id uuid not null references public.campus_events (id) on delete cascade,
  related_event_id uuid not null references public.campus_events (id) on delete cascade,
  primary key (event_id, related_event_id),
  constraint campus_event_relations_distinct check (event_id <> related_event_id)
);

create table public.campus_achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  competition_name text not null,
  winner_name text,
  award text,
  event_date date,
  academic_year text,
  category_id uuid references public.campus_categories (id) on delete set null,
  event_id uuid references public.campus_events (id) on delete set null,
  image_url text,
  image_alt text,
  publication_status public.campus_publication_status not null default 'draft',
  is_sample boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz,
  constraint campus_achievements_image_https check (image_url is null or image_url ~* '^https://')
);

create table public.campus_staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.campus_role not null,
  granted_by uuid references auth.users (id) on delete set null,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.campus_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index campus_events_publication_idx on public.campus_events (publication_status);
create index campus_events_category_idx on public.campus_events (category_id);
create index campus_events_date_idx on public.campus_events (event_date);
create index campus_event_images_event_idx on public.campus_event_images (event_id, sort_order);
create index campus_achievements_publication_idx on public.campus_achievements (publication_status);
create index campus_audit_log_created_idx on public.campus_audit_log (created_at desc);

create trigger campus_events_set_updated_at
before update on public.campus_events
for each row execute function public.set_updated_at();

create trigger campus_achievements_set_updated_at
before update on public.campus_achievements
for each row execute function public.set_updated_at();

create trigger campus_settings_set_updated_at
before update on public.campus_settings
for each row execute function public.set_updated_at();

create or replace function public.is_campus_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campus_staff
    where user_id = auth.uid()
      and role = 'administrator'
  );
$$;

create or replace function public.is_campus_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campus_staff
    where user_id = auth.uid()
      and role in ('editor', 'administrator')
  );
$$;

create or replace function public.campus_media_url_allowed(raw text)
returns boolean
language plpgsql
stable
set search_path = public
as $$
declare
  rest text;
  host text;
  allowed text[];
begin
  if raw is null or length(btrim(raw)) = 0 then
    return true;
  end if;
  if char_length(raw) > 2048 or raw !~* '^https://' or raw ~ '@' then
    return false;
  end if;
  rest := substring(raw from 'https://([^/]+)');
  if rest is null or rest = '' or rest ~ ':' then
    return false;
  end if;
  host := lower(rest);
  if host in (
      'localhost',
      'drive.google.com',
      'docs.google.com',
      'drive.usercontent.google.com',
      'docs.usercontent.google.com'
    )
    or host like '%.localhost'
    or host like '%.local'
    or host ~ '^[0-9]+(\.[0-9]+){3}$'
  then
    return false;
  end if;
  select media_hosts into allowed from public.campus_settings where id = true;
  return host = any (coalesce(allowed, '{}'));
end;
$$;

create or replace function public.campus_reject_bad_media_url()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target text;
  row_json jsonb := to_jsonb(new);
begin
  -- Read fields via jsonb so the same function can fire on tables that do not
  -- all share url / image_url / cover_image_url columns.
  target := case tg_table_name
    when 'campus_event_images' then row_json ->> 'url'
    when 'campus_achievements' then row_json ->> 'image_url'
    else row_json ->> 'cover_image_url'
  end;
  if not public.campus_media_url_allowed(target) then
    raise exception 'Image URL is not allowed';
  end if;
  return new;
end;
$$;

create trigger campus_events_media_url
before insert or update of cover_image_url on public.campus_events
for each row execute function public.campus_reject_bad_media_url();

create trigger campus_event_images_media_url
before insert or update of url on public.campus_event_images
for each row execute function public.campus_reject_bad_media_url();

create trigger campus_achievements_media_url
before insert or update of image_url on public.campus_achievements
for each row execute function public.campus_reject_bad_media_url();

create or replace function public.grant_campus_role(
  target_user uuid,
  target_role public.campus_role,
  note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_campus_admin() or not public.is_first_party_client() then
    raise exception 'Forbidden';
  end if;
  if target_user is null then
    raise exception 'Missing user';
  end if;
  if target_role <> 'administrator' and (
    select count(*)
    from public.campus_staff
    where role = 'administrator'
      and user_id <> target_user
  ) < 1 then
    raise exception 'At least one administrator is required';
  end if;

  insert into public.campus_staff (user_id, role, granted_by, notes)
  values (target_user, target_role, auth.uid(), note)
  on conflict (user_id) do update
    set role = excluded.role,
        granted_by = excluded.granted_by,
        notes = excluded.notes;

  insert into public.campus_audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'grant_role',
    'campus_staff',
    target_user,
    jsonb_build_object('role', target_role)
  );
end;
$$;

revoke all on function public.grant_campus_role(uuid, public.campus_role, text) from public, anon;
grant execute on function public.grant_campus_role(uuid, public.campus_role, text) to authenticated;

alter table public.campus_categories enable row level security;
alter table public.campus_settings enable row level security;
alter table public.campus_events enable row level security;
alter table public.campus_event_images enable row level security;
alter table public.campus_event_relations enable row level security;
alter table public.campus_achievements enable row level security;
alter table public.campus_staff enable row level security;
alter table public.campus_audit_log enable row level security;

create policy "Public reads campus categories"
on public.campus_categories for select
using (true);

create policy "Editors manage campus categories"
on public.campus_categories for insert
to authenticated
with check (public.is_campus_editor() and public.is_first_party_client());

create policy "Editors update campus categories"
on public.campus_categories for update
to authenticated
using (public.is_campus_editor() and public.is_first_party_client())
with check (public.is_campus_editor() and public.is_first_party_client());

create policy "Public reads campus settings"
on public.campus_settings for select
using (true);

create policy "Admins update campus settings"
on public.campus_settings for update
to authenticated
using (public.is_campus_admin() and public.is_first_party_client())
with check (public.is_campus_admin() and public.is_first_party_client());

create policy "Public reads published campus events"
on public.campus_events for select
using (publication_status = 'published');

create policy "Staff reads campus events"
on public.campus_events for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

create policy "Staff inserts campus drafts"
on public.campus_events for insert
to authenticated
with check (
  public.is_campus_editor()
  and public.is_first_party_client()
  and publication_status = 'draft'
  and published_at is null
);

create policy "Editors update campus drafts"
on public.campus_events for update
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

create policy "Admins update campus events"
on public.campus_events for update
to authenticated
using (public.is_campus_admin() and public.is_first_party_client())
with check (public.is_campus_admin() and public.is_first_party_client());

create policy "Public reads images of published events"
on public.campus_event_images for select
using (
  exists (
    select 1
    from public.campus_events event
    where event.id = event_id
      and event.publication_status = 'published'
  )
);

create policy "Staff reads campus images"
on public.campus_event_images for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

create policy "Staff writes draft images"
on public.campus_event_images for insert
to authenticated
with check (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1
    from public.campus_events event
    where event.id = event_id
      and (
        public.is_campus_admin()
        or event.publication_status in ('draft', 'in_review')
      )
  )
);

create policy "Staff updates draft images"
on public.campus_event_images for update
to authenticated
using (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1
    from public.campus_events event
    where event.id = event_id
      and (
        public.is_campus_admin()
        or event.publication_status in ('draft', 'in_review')
      )
  )
)
with check (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1
    from public.campus_events event
    where event.id = event_id
      and (
        public.is_campus_admin()
        or event.publication_status in ('draft', 'in_review')
      )
  )
);

create policy "Staff deletes draft images"
on public.campus_event_images for delete
to authenticated
using (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1
    from public.campus_events event
    where event.id = event_id
      and (
        public.is_campus_admin()
        or event.publication_status in ('draft', 'in_review')
      )
  )
);

create policy "Public reads relations of published events"
on public.campus_event_relations for select
using (
  exists (
    select 1
    from public.campus_events event
    where event.id = event_id
      and event.publication_status = 'published'
  )
);

create policy "Staff reads campus relations"
on public.campus_event_relations for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

create policy "Staff writes campus relations"
on public.campus_event_relations for insert
to authenticated
with check (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1 from public.campus_events event
    where event.id = event_id
      and (public.is_campus_admin() or event.publication_status in ('draft', 'in_review'))
  )
);

create policy "Staff deletes campus relations"
on public.campus_event_relations for delete
to authenticated
using (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1 from public.campus_events event
    where event.id = event_id
      and (public.is_campus_admin() or event.publication_status in ('draft', 'in_review'))
  )
);

create policy "Public reads published campus achievements"
on public.campus_achievements for select
using (publication_status = 'published');

create policy "Staff reads campus achievements"
on public.campus_achievements for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

create policy "Staff inserts achievement drafts"
on public.campus_achievements for insert
to authenticated
with check (
  public.is_campus_editor()
  and public.is_first_party_client()
  and publication_status = 'draft'
);

create policy "Editors update achievement drafts"
on public.campus_achievements for update
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

create policy "Admins update campus achievements"
on public.campus_achievements for update
to authenticated
using (public.is_campus_admin() and public.is_first_party_client())
with check (public.is_campus_admin() and public.is_first_party_client());

create policy "Staff reads own campus role"
on public.campus_staff for select
to authenticated
using (user_id = auth.uid() or (public.is_campus_admin() and public.is_first_party_client()));

create policy "No client insert of campus staff"
on public.campus_staff for insert
to authenticated
with check (false);

create policy "No client update of campus staff"
on public.campus_staff for update
to authenticated
using (false);

create policy "No client delete of campus staff"
on public.campus_staff for delete
to authenticated
using (false);

create policy "Admins read campus audit log"
on public.campus_audit_log for select
to authenticated
using (public.is_campus_admin() and public.is_first_party_client());

create policy "Staff inserts own audit rows"
on public.campus_audit_log for insert
to authenticated
with check (
  actor_id = auth.uid()
  and public.is_campus_editor()
  and public.is_first_party_client()
);

insert into public.campus_categories (id, slug, name, description, sort_order)
values
  ('10000000-0000-4000-8000-000000000001', 'cultural', 'Cultural', 'Performances, heritage programmes, and cultural gatherings.', 1),
  ('10000000-0000-4000-8000-000000000002', 'sports', 'Sports', 'Matches, house sport, and athletic gatherings.', 2),
  ('10000000-0000-4000-8000-000000000003', 'academic', 'Academic', 'Subject exhibitions, academic contests, and scholarly work.', 3),
  ('10000000-0000-4000-8000-000000000004', 'technology', 'Technology', 'Computing, design, and technology showcases.', 4),
  ('10000000-0000-4000-8000-000000000005', 'sustainability', 'Sustainability', 'Environmental projects and campus sustainability work.', 5),
  ('10000000-0000-4000-8000-000000000006', 'student-initiatives', 'Student Initiatives', 'Activities organised and led by students.', 6),
  ('10000000-0000-4000-8000-000000000007', 'celebrations', 'Celebrations', 'Festive days and community celebrations.', 7)
on conflict (id) do nothing;

grant select on public.campus_categories to anon, authenticated;
grant insert, update on public.campus_categories to authenticated;

grant select on public.campus_settings to anon, authenticated;
grant update on public.campus_settings to authenticated;

grant select on public.campus_events to anon, authenticated;
grant insert, update on public.campus_events to authenticated;

grant select on public.campus_event_images to anon, authenticated;
grant insert, update, delete on public.campus_event_images to authenticated;

grant select on public.campus_event_relations to anon, authenticated;
grant insert, delete on public.campus_event_relations to authenticated;

grant select on public.campus_achievements to anon, authenticated;
grant insert, update on public.campus_achievements to authenticated;

grant select on public.campus_staff to authenticated;

grant select, insert on public.campus_audit_log to authenticated;

grant all on
  public.campus_categories,
  public.campus_settings,
  public.campus_events,
  public.campus_event_images,
  public.campus_event_relations,
  public.campus_achievements,
  public.campus_staff,
  public.campus_audit_log
to service_role;

grant execute on function public.is_campus_admin() to anon, authenticated, service_role;
grant execute on function public.is_campus_editor() to anon, authenticated, service_role;
grant execute on function public.campus_media_url_allowed(text) to anon, authenticated, service_role;
grant execute on function public.campus_reject_bad_media_url() to authenticated, service_role;
