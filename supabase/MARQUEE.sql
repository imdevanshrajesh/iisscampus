-- Paste into the Supabase SQL editor after reviewing.
-- Adds a marquee table, separate from visitor announcements.
-- Copies existing announcement ticker lines once. Safe to re-run.

create table if not exists public.campus_marquee (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  event_id uuid references public.campus_events (id) on delete set null,
  enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint campus_marquee_message_len check (char_length(message) between 2 and 500)
);

create index if not exists campus_marquee_enabled_idx
  on public.campus_marquee (enabled, sort_order);

drop trigger if exists campus_marquee_set_updated_at on public.campus_marquee;
create trigger campus_marquee_set_updated_at
before update on public.campus_marquee
for each row execute function public.set_updated_at();

alter table public.campus_marquee enable row level security;

drop policy if exists "Public reads enabled marquee" on public.campus_marquee;
create policy "Public reads enabled marquee"
on public.campus_marquee for select
using (enabled = true);

drop policy if exists "Staff reads marquee" on public.campus_marquee;
create policy "Staff reads marquee"
on public.campus_marquee for select
to authenticated
using (public.is_campus_editor() and public.is_first_party_client());

drop policy if exists "Staff writes marquee" on public.campus_marquee;
create policy "Staff writes marquee"
on public.campus_marquee for all
to authenticated
using (public.is_campus_admin() and public.is_first_party_client())
with check (public.is_campus_admin() and public.is_first_party_client());

grant select on public.campus_marquee to anon, authenticated;
grant insert, update, delete on public.campus_marquee to authenticated;
grant all on public.campus_marquee to service_role;

insert into public.campus_marquee (message, event_id, enabled, sort_order)
select btrim(message), event_id, enabled, sort_order
from public.campus_announcements
where char_length(btrim(message)) between 2 and 500
  and not exists (
    select 1
    from public.campus_marquee existing
    where existing.message = btrim(campus_announcements.message)
      and existing.event_id is not distinct from campus_announcements.event_id
  );

alter table public.campus_announcements
  alter column message set default '';

alter table public.campus_announcements
  drop constraint if exists campus_announcements_message_len;

alter table public.campus_announcements
  add constraint campus_announcements_message_len check (char_length(message) <= 500);
