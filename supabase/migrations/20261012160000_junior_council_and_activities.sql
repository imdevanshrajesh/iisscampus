-- Junior council, logo URL, competitions, multi-category events,
-- school activity fields, announcements, and FAQs.
-- Additive. Does not alter Arigo tables. Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Council logo on site settings
-- ---------------------------------------------------------------------------

alter table public.campus_settings
  add column if not exists council_logo_url text;

alter table public.campus_settings
  drop constraint if exists campus_settings_council_logo_https;

alter table public.campus_settings
  add constraint campus_settings_council_logo_https
  check (council_logo_url is null or council_logo_url ~* '^https://');

alter table public.campus_settings
  add column if not exists contact_email text;

-- Pin selected photographs for the public gallery
alter table public.campus_event_images
  add column if not exists pinned boolean not null default false;

create index if not exists campus_event_images_pinned_idx
  on public.campus_event_images (pinned, event_id)
  where pinned = true;

alter table public.campus_settings
  drop constraint if exists campus_settings_contact_email_format;

alter table public.campus_settings
  add constraint campus_settings_contact_email_format
  check (
    contact_email is null
    or contact_email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  );

-- ---------------------------------------------------------------------------
-- Junior board on the same council year
-- ---------------------------------------------------------------------------

do $outer$
begin
  if to_regclass('public.campus_council_members') is null then
    raise notice 'Council member table missing; skip board column.';
    return;
  end if;

  if not exists (
    select 1 from pg_type where typname = 'campus_council_board'
  ) then
    create type public.campus_council_board as enum ('main', 'junior');
  end if;

  execute $sql$
    alter table public.campus_council_members
      add column if not exists board public.campus_council_board not null default 'main'
  $sql$;
end
$outer$;

do $outer$
begin
  if to_regclass('public.campus_council_years') is null then
    raise notice 'Council year table missing; skip junior heading.';
    return;
  end if;

  execute $sql$
    alter table public.campus_council_years
      add column if not exists junior_heading text not null default 'Junior Student Council'
  $sql$;

  execute $sql$
    alter table public.campus_council_years
      drop constraint if exists campus_council_years_junior_heading_len
  $sql$;

  execute $sql$
    alter table public.campus_council_years
      add constraint campus_council_years_junior_heading_len
      check (char_length(junior_heading) between 2 and 80)
  $sql$;
end
$outer$;

-- Seed junior club captains for the sitting year (2026-27 or current).
do $seed$
declare
  target_year uuid;
begin
  if to_regclass('public.campus_council_members') is null then
    return;
  end if;

  select id into target_year
  from public.campus_council_years
  where slug = '2026-27'
  limit 1;

  if target_year is null then
    select id into target_year
    from public.campus_council_years
    where kind = 'current'
    order by sort_order
    limit 1;
  end if;

  if target_year is null then
    raise notice 'No council year found for junior seed.';
    return;
  end if;

  insert into public.campus_council_members (year_id, role, name, sort_order, board)
  select target_year, added.role, added.name, added.sort_slot, 'junior'::public.campus_council_board
  from (
    values
      (100, 'Art And Craft Club Captain', 'RISHON ZACCARIA'),
      (101, 'Art And Craft Club Vice Captain', 'MOHAMMED AHYAN'),
      (102, 'Cyber Club Captain', 'MAHARAJA VELCHAMY'),
      (103, 'Cyber Club Vice Captain', 'ALWIN BIJU VARGHESE'),
      (104, 'Eco Club Captain', 'MOHAMED SUHAIL'),
      (105, 'Eco Club Vice Captain', 'AIDEN VELATHIPARAMBIL'),
      (106, 'Happiness Club Captain', 'YAZEED MOHAMED YUNUS'),
      (107, 'Happiness Club Vice Captain', 'SACHIT INDIRAKUMAR'),
      (108, 'Health And Fitness Club Captain', 'MUHAMMED EHAN'),
      (109, 'Health And Fitness Club Vice Captain', 'MUFASSIR AMAAN MOHAMMED'),
      (110, 'Heritage Club Captain', 'MOHAMMED JASIM SHEIK'),
      (111, 'Heritage Club Vice Captain', 'THARUN PALANI'),
      (112, 'Invention And Research Club Captain', 'MOHD SHOIAB'),
      (113, 'Invention And Research Club Vice Captain', 'MOHAMMED UBAIR'),
      (114, 'Islamic Club Captain', 'ANWAR AMEEN'),
      (115, 'Islamic Club Vice Captain', 'ANWAR AMER'),
      (116, 'Math Club Captain', 'ALAN THOMAS'),
      (117, 'Math Club Vice Captain', 'AYUSH PRAMANIK'),
      (118, 'Media Club Captain', 'MUHAMMAD FEZIN'),
      (119, 'Media Club Vice Captain', 'SIJIN SHAN'),
      (120, 'Quiz Club Captain', 'ATHIF BIN SAMEER'),
      (121, 'Quiz Club Vice Captain', 'ABDUL MANNAN'),
      (122, 'Science Club Captain', 'MOHAMMAD HABIBUR RAHMAN'),
      (123, 'Science Club Vice Captain', 'AASAAD SHABANDRI'),
      (124, 'Literary Club Captain', 'VENKATA SESHASAI'),
      (125, 'Literary Club Vice Captain', 'ZAID ABDUL KALEEM'),
      (126, 'Community Club Captain', 'MUHAMMED ARSALAN'),
      (127, 'Community Club Vice Captain', 'MUHAMMAD MUZZAMMIL')
  ) as added(sort_slot, role, name)
  where not exists (
    select 1
    from public.campus_council_members existing
    where existing.year_id = target_year
      and existing.role = added.role
      and existing.board = 'junior'
  );
end
$seed$;

-- ---------------------------------------------------------------------------
-- Event listing (event vs competition) and school fields
-- ---------------------------------------------------------------------------

do $listing$
begin
  if not exists (select 1 from pg_type where typname = 'campus_event_listing') then
    create type public.campus_event_listing as enum ('event', 'competition');
  end if;
end
$listing$;

alter table public.campus_events
  add column if not exists listing public.campus_event_listing not null default 'event';

alter table public.campus_events
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists location_name text,
  add column if not exists location_map_url text,
  add column if not exists grade_from int,
  add column if not exists grade_to int,
  add column if not exists fee_aed numeric(10, 2),
  add column if not exists capacity int,
  add column if not exists packing_list text;

alter table public.campus_events
  drop constraint if exists campus_events_location_map_https;

alter table public.campus_events
  add constraint campus_events_location_map_https
  check (location_map_url is null or location_map_url ~* '^https://');

alter table public.campus_events
  drop constraint if exists campus_events_grade_range;

alter table public.campus_events
  add constraint campus_events_grade_range
  check (
    (grade_from is null and grade_to is null)
    or (
      grade_from is not null
      and grade_to is not null
      and grade_from between 1 and 12
      and grade_to between 1 and 12
      and grade_to >= grade_from
    )
  );

alter table public.campus_events
  drop constraint if exists campus_events_fee_nonneg;

alter table public.campus_events
  add constraint campus_events_fee_nonneg
  check (fee_aed is null or fee_aed >= 0);

alter table public.campus_events
  drop constraint if exists campus_events_capacity_pos;

alter table public.campus_events
  add constraint campus_events_capacity_pos
  check (capacity is null or capacity > 0);

alter table public.campus_events
  drop constraint if exists campus_events_packing_len;

alter table public.campus_events
  add constraint campus_events_packing_len
  check (packing_list is null or char_length(packing_list) <= 4000);

alter table public.campus_events
  drop constraint if exists campus_events_location_name_len;

alter table public.campus_events
  add constraint campus_events_location_name_len
  check (location_name is null or char_length(location_name) between 1 and 160);

-- Normalize older free-text provider labels, then lock to the three modes.
update public.campus_events
set registration_provider = case
  when registration_provider is null or btrim(registration_provider) = '' then null
  when lower(registration_provider) like '%google%' or lower(registration_provider) like '%form%' then 'google_form'
  when registration_url ~ '^/' then 'page'
  else 'arigo'
end
where registration_provider is not null
  and registration_provider not in ('arigo', 'page', 'google_form');

alter table public.campus_events
  drop constraint if exists campus_events_registration_provider_check;

alter table public.campus_events
  add constraint campus_events_registration_provider_check
  check (
    registration_provider is null
    or registration_provider in ('arigo', 'page', 'google_form')
  );

-- Allow site paths (/events/...) as well as https:// registration links
alter table public.campus_events
  drop constraint if exists campus_events_registration_https;

alter table public.campus_events
  add constraint campus_events_registration_https
  check (
    registration_url is null
    or registration_url ~* '^https://'
    or registration_url ~ '^/[a-zA-Z0-9/_\-?=&%.]*$'
  );

create index if not exists campus_events_listing_idx
  on public.campus_events (listing, publication_status);

-- Extra categories (primary category_id stays on campus_events)
create table if not exists public.campus_event_categories (
  event_id uuid not null references public.campus_events (id) on delete cascade,
  category_id uuid not null references public.campus_categories (id) on delete cascade,
  primary key (event_id, category_id)
);

create index if not exists campus_event_categories_category_idx
  on public.campus_event_categories (category_id);

alter table public.campus_event_categories enable row level security;

drop policy if exists "Public reads event categories" on public.campus_event_categories;
create policy "Public reads event categories"
on public.campus_event_categories for select
using (
  exists (
    select 1 from public.campus_events event
    where event.id = event_id and event.publication_status = 'published'
  )
);

drop policy if exists "Staff reads event categories" on public.campus_event_categories;
create policy "Staff reads event categories"
on public.campus_event_categories for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

drop policy if exists "Staff writes event categories" on public.campus_event_categories;
create policy "Staff writes event categories"
on public.campus_event_categories for all
to authenticated
using (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1 from public.campus_events event
    where event.id = event_id
      and (public.is_campus_admin() or event.publication_status in ('draft', 'in_review'))
  )
)
with check (
  public.is_campus_editor()
  and public.is_first_party_client()
  and exists (
    select 1 from public.campus_events event
    where event.id = event_id
      and (public.is_campus_admin() or event.publication_status in ('draft', 'in_review'))
  )
);

-- Backfill join rows from the primary category
insert into public.campus_event_categories (event_id, category_id)
select id, category_id
from public.campus_events
on conflict do nothing;

grant select on public.campus_event_categories to anon, authenticated;
grant insert, update, delete on public.campus_event_categories to authenticated;
grant all on public.campus_event_categories to service_role;

-- ---------------------------------------------------------------------------
-- Announcements (scrolling homepage bar)
-- ---------------------------------------------------------------------------

create table if not exists public.campus_announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  event_id uuid references public.campus_events (id) on delete set null,
  enabled boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint campus_announcements_message_len check (char_length(message) between 2 and 500)
);

create index if not exists campus_announcements_enabled_idx
  on public.campus_announcements (enabled, sort_order);

drop trigger if exists campus_announcements_set_updated_at on public.campus_announcements;
create trigger campus_announcements_set_updated_at
before update on public.campus_announcements
for each row execute function public.set_updated_at();

alter table public.campus_announcements enable row level security;

drop policy if exists "Public reads enabled announcements" on public.campus_announcements;
create policy "Public reads enabled announcements"
on public.campus_announcements for select
using (enabled = true);

drop policy if exists "Staff reads announcements" on public.campus_announcements;
create policy "Staff reads announcements"
on public.campus_announcements for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

drop policy if exists "Staff writes announcements" on public.campus_announcements;
create policy "Staff writes announcements"
on public.campus_announcements for all
to authenticated
using (public.is_campus_admin() and public.is_first_party_client())
with check (public.is_campus_admin() and public.is_first_party_client());

grant select on public.campus_announcements to anon, authenticated;
grant insert, update, delete on public.campus_announcements to authenticated;
grant all on public.campus_announcements to service_role;

-- ---------------------------------------------------------------------------
-- FAQs
-- ---------------------------------------------------------------------------

create table if not exists public.campus_faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint campus_faqs_question_len check (char_length(question) between 2 and 200),
  constraint campus_faqs_answer_len check (char_length(answer) between 2 and 4000)
);

create index if not exists campus_faqs_published_idx
  on public.campus_faqs (published, sort_order);

drop trigger if exists campus_faqs_set_updated_at on public.campus_faqs;
create trigger campus_faqs_set_updated_at
before update on public.campus_faqs
for each row execute function public.set_updated_at();

alter table public.campus_faqs enable row level security;

drop policy if exists "Public reads published faqs" on public.campus_faqs;
create policy "Public reads published faqs"
on public.campus_faqs for select
using (published = true);

drop policy if exists "Staff reads faqs" on public.campus_faqs;
create policy "Staff reads faqs"
on public.campus_faqs for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

drop policy if exists "Staff writes faqs" on public.campus_faqs;
create policy "Staff writes faqs"
on public.campus_faqs for all
to authenticated
using (public.is_campus_admin() and public.is_first_party_client())
with check (public.is_campus_admin() and public.is_first_party_client());

grant select on public.campus_faqs to anon, authenticated;
grant insert, update, delete on public.campus_faqs to authenticated;
grant all on public.campus_faqs to service_role;

insert into public.campus_faqs (question, answer, sort_order, published)
select added.question, added.answer, added.sort_slot, true
from (
  values
    (
      0,
      'Who supervises activities?',
      'Teachers and the student council organise published activities. A teacher in charge is named for council work, and school staff supervise events on campus.'
    ),
    (
      1,
      'What should students bring?',
      'Check the packing list on each activity page. Bring your school ID, and any kit or materials listed for that day.'
    ),
    (
      2,
      'Who can take part?',
      'Each activity lists the grades that may join. If no grade range is shown, ask the organising teacher or the council.'
    ),
    (
      3,
      'How do I register?',
      'Open the activity page and use Register now. Some activities use Arigo, a Google Form, or a page on this site. Deadlines are shown when registration is open.'
    )
) as added(sort_slot, question, answer)
where not exists (
  select 1 from public.campus_faqs existing where existing.question = added.question
);
