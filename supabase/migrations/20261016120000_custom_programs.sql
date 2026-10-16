-- Custom programs shown below FAQ on the About page.

create table if not exists public.campus_custom_programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  website_label text,
  website_url text,
  photos jsonb not null default '[]'::jsonb,
  links jsonb not null default '[]'::jsonb,
  event_id uuid references public.campus_events (id) on delete set null,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint campus_custom_programs_title_len check (char_length(title) between 2 and 120),
  constraint campus_custom_programs_summary_len check (char_length(summary) <= 4000),
  constraint campus_custom_programs_website_label_len check (website_label is null or char_length(website_label) <= 80),
  constraint campus_custom_programs_website_url_len check (website_url is null or char_length(website_url) <= 2048),
  constraint campus_custom_programs_photos_array check (jsonb_typeof(photos) = 'array'),
  constraint campus_custom_programs_links_array check (jsonb_typeof(links) = 'array')
);

create index if not exists campus_custom_programs_published_idx
  on public.campus_custom_programs (published, sort_order);

drop trigger if exists campus_custom_programs_set_updated_at on public.campus_custom_programs;
create trigger campus_custom_programs_set_updated_at
before update on public.campus_custom_programs
for each row execute function public.set_updated_at();

alter table public.campus_custom_programs enable row level security;

drop policy if exists "Public reads published custom programs" on public.campus_custom_programs;
create policy "Public reads published custom programs"
on public.campus_custom_programs for select
using (published = true);

drop policy if exists "Staff reads custom programs" on public.campus_custom_programs;
create policy "Staff reads custom programs"
on public.campus_custom_programs for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

drop policy if exists "Staff writes custom programs" on public.campus_custom_programs;
create policy "Staff writes custom programs"
on public.campus_custom_programs for all
to authenticated
using (public.is_campus_admin() and public.is_first_party_client())
with check (public.is_campus_admin() and public.is_first_party_client());

grant select on public.campus_custom_programs to anon, authenticated;
grant insert, update, delete on public.campus_custom_programs to authenticated;
grant all on public.campus_custom_programs to service_role;
