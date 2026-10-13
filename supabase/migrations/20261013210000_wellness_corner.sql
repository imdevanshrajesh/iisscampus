-- Wellness Corner: renameable page title/nav label + multi-item posts (image, text, PDF).

alter table public.campus_settings
  add column if not exists wellness_page_title text not null default 'Wellness Corner',
  add column if not exists wellness_nav_label text not null default 'Wellness';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'campus_settings_wellness_page_title_len'
  ) then
    alter table public.campus_settings
      add constraint campus_settings_wellness_page_title_len
      check (char_length(wellness_page_title) between 2 and 80);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'campus_settings_wellness_nav_label_len'
  ) then
    alter table public.campus_settings
      add constraint campus_settings_wellness_nav_label_len
      check (char_length(wellness_nav_label) between 2 and 40);
  end if;
end $$;

create table if not exists public.campus_wellness_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  section text not null default '',
  image_url text,
  image_alt text not null default '',
  image_orientation text not null default 'auto',
  pdf_url text,
  sort_order int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint campus_wellness_items_title_len check (char_length(title) between 2 and 120),
  constraint campus_wellness_items_body_len check (char_length(body) <= 8000),
  constraint campus_wellness_items_section_len check (char_length(section) <= 80),
  constraint campus_wellness_items_image_alt_len check (char_length(image_alt) <= 200),
  constraint campus_wellness_items_orientation check (
    image_orientation in ('auto', 'portrait', 'landscape', 'square')
  ),
  constraint campus_wellness_items_image_https check (
    image_url is null or image_url ~* '^https://'
  ),
  constraint campus_wellness_items_pdf_https check (
    pdf_url is null or pdf_url ~* '^https://'
  )
);

create index if not exists campus_wellness_items_published_idx
  on public.campus_wellness_items (published, section, sort_order);

drop trigger if exists campus_wellness_items_set_updated_at on public.campus_wellness_items;
create trigger campus_wellness_items_set_updated_at
before update on public.campus_wellness_items
for each row execute function public.set_updated_at();

alter table public.campus_wellness_items enable row level security;

drop policy if exists "Public reads published wellness items" on public.campus_wellness_items;
create policy "Public reads published wellness items"
on public.campus_wellness_items for select
using (published = true);

drop policy if exists "Staff reads wellness items" on public.campus_wellness_items;
create policy "Staff reads wellness items"
on public.campus_wellness_items for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

drop policy if exists "Staff writes wellness items" on public.campus_wellness_items;
create policy "Staff writes wellness items"
on public.campus_wellness_items for all
to authenticated
using (public.is_campus_admin() and public.is_first_party_client())
with check (public.is_campus_admin() and public.is_first_party_client());

grant select on public.campus_wellness_items to anon, authenticated;
grant insert, update, delete on public.campus_wellness_items to authenticated;
grant all on public.campus_wellness_items to service_role;
