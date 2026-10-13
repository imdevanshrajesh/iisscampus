-- Paste after WELLNESS.sql (or alone if WELLNESS already ran).
-- Adds wellness categories and links items to them. Safe to re-run.

create table if not exists public.campus_wellness_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint campus_wellness_categories_name_len check (char_length(name) between 2 and 80)
);

create unique index if not exists campus_wellness_categories_name_unique
  on public.campus_wellness_categories (lower(name));

create index if not exists campus_wellness_categories_sort_idx
  on public.campus_wellness_categories (sort_order, name);

drop trigger if exists campus_wellness_categories_set_updated_at on public.campus_wellness_categories;
create trigger campus_wellness_categories_set_updated_at
before update on public.campus_wellness_categories
for each row execute function public.set_updated_at();

alter table public.campus_wellness_categories enable row level security;

drop policy if exists "Public reads wellness categories" on public.campus_wellness_categories;
create policy "Public reads wellness categories"
on public.campus_wellness_categories for select
using (true);

drop policy if exists "Staff reads wellness categories" on public.campus_wellness_categories;
create policy "Staff reads wellness categories"
on public.campus_wellness_categories for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

drop policy if exists "Staff writes wellness categories" on public.campus_wellness_categories;
create policy "Staff writes wellness categories"
on public.campus_wellness_categories for all
to authenticated
using (public.is_campus_admin() and public.is_first_party_client())
with check (public.is_campus_admin() and public.is_first_party_client());

grant select on public.campus_wellness_categories to anon, authenticated;
grant insert, update, delete on public.campus_wellness_categories to authenticated;
grant all on public.campus_wellness_categories to service_role;

alter table public.campus_wellness_items
  add column if not exists category_id uuid references public.campus_wellness_categories (id) on delete set null;

create index if not exists campus_wellness_items_category_idx
  on public.campus_wellness_items (category_id, sort_order);

-- Move free-text section values into categories when present.
insert into public.campus_wellness_categories (name, sort_order)
select distinct trim(section), 0
from public.campus_wellness_items
where coalesce(trim(section), '') <> ''
  and not exists (
    select 1
    from public.campus_wellness_categories existing
    where lower(existing.name) = lower(trim(campus_wellness_items.section))
  );

update public.campus_wellness_items as items
set category_id = categories.id
from public.campus_wellness_categories as categories
where items.category_id is null
  and coalesce(trim(items.section), '') <> ''
  and lower(categories.name) = lower(trim(items.section));
