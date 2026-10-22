-- Visitor suggestions. Public insert goes through submit_campus_suggestion only.

create table if not exists public.campus_suggestions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_key text not null,
  body text not null,
  client_ip text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  constraint campus_suggestions_email_len check (char_length(email) between 6 and 254),
  constraint campus_suggestions_email_key_len check (char_length(email_key) between 3 and 254),
  constraint campus_suggestions_body_len check (char_length(body) between 20 and 1500),
  constraint campus_suggestions_ip_len check (char_length(client_ip) <= 64)
);

create index if not exists campus_suggestions_email_idx
  on public.campus_suggestions (email_key, created_at desc);

create index if not exists campus_suggestions_ip_idx
  on public.campus_suggestions (client_ip, created_at desc);

create index if not exists campus_suggestions_created_idx
  on public.campus_suggestions (created_at desc);

alter table public.campus_suggestions enable row level security;

drop policy if exists "Admins read suggestions" on public.campus_suggestions;
create policy "Admins read suggestions"
on public.campus_suggestions for select
to authenticated
using (public.is_campus_admin() and public.is_first_party_client());

drop policy if exists "Admins delete suggestions" on public.campus_suggestions;
create policy "Admins delete suggestions"
on public.campus_suggestions for delete
to authenticated
using (public.is_campus_admin() and public.is_first_party_client());

grant select, delete on public.campus_suggestions to authenticated;
grant all on public.campus_suggestions to service_role;

create or replace function public.submit_campus_suggestion(
  raw_email text,
  raw_body text,
  raw_ip text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  visitor_email text;
  local_part text;
  domain text;
  rate_key text;
  suggestion_body text;
  visitor_ip text := '';
  link_count int;
begin
  if raw_email is null or char_length(raw_email) > 254 or raw_body is null or char_length(raw_body) > 4000 then
    raise exception 'invalid suggestion';
  end if;

  visitor_email := lower(btrim(raw_email));
  if visitor_email !~ '^[a-z0-9](?:[a-z0-9._%+\-]{0,62}[a-z0-9])?@[a-z0-9](?:[a-z0-9.\-]{0,250}[a-z0-9])?\.[a-z]{2,24}$' then
    raise exception 'invalid suggestion';
  end if;

  domain := split_part(visitor_email, '@', 2);
  local_part := split_part(visitor_email, '@', 1);
  if domain not in ('gmail.com', 'iiss.ae') or local_part = '' or position('..' in visitor_email) > 0 then
    raise exception 'invalid suggestion';
  end if;

  rate_key := local_part;
  if domain = 'gmail.com' then
    rate_key := replace(split_part(local_part, '+', 1), '.', '');
  end if;
  if rate_key = '' then
    raise exception 'invalid suggestion';
  end if;
  rate_key := rate_key || '@' || domain;

  suggestion_body := btrim(regexp_replace(raw_body, '[[:space:]]+', ' ', 'g'));
  if char_length(suggestion_body) < 20 or char_length(suggestion_body) > 1500 then
    raise exception 'invalid suggestion';
  end if;
  if position('<script' in lower(suggestion_body)) > 0 or position('javascript:' in lower(suggestion_body)) > 0 then
    raise exception 'invalid suggestion';
  end if;
  link_count :=
    (char_length(lower(suggestion_body)) - char_length(replace(lower(suggestion_body), 'http://', ''))) / 7
    + (char_length(lower(suggestion_body)) - char_length(replace(lower(suggestion_body), 'https://', ''))) / 8;
  if link_count > 3 then
    raise exception 'invalid suggestion';
  end if;

  if raw_ip is not null and char_length(btrim(raw_ip)) between 1 and 64 and btrim(raw_ip) ~ '^[0-9a-fA-F:.]+$' then
    visitor_ip := btrim(raw_ip);
  end if;

  perform pg_advisory_xact_lock(hashtext(rate_key));

  if (
    select count(*)
    from public.campus_suggestions existing
    where existing.email_key = rate_key
      and existing.created_at > timezone('utc', now()) - interval '24 hours'
  ) >= 3 then
    return 'rate';
  end if;

  if visitor_ip <> '' and (
    select count(*)
    from public.campus_suggestions existing
    where existing.client_ip = visitor_ip
      and existing.created_at > timezone('utc', now()) - interval '1 hour'
  ) >= 8 then
    return 'rate';
  end if;

  insert into public.campus_suggestions (email, email_key, body, client_ip)
  values (visitor_email, rate_key, suggestion_body, visitor_ip);

  return 'ok';
end;
$$;

revoke all on function public.submit_campus_suggestion(text, text, text) from public;
grant execute on function public.submit_campus_suggestion(text, text, text) to anon, authenticated;

insert into public.campus_nav_items (id, group_id, title, description, href, sort_order)
select
  'a1b2c3d4-0002-4000-8000-000000000009',
  groups.id,
  'Suggestions',
  'Send a note to the council',
  '/suggestions',
  10
from public.campus_nav_groups groups
where groups.label = 'Council'
  and not exists (
    select 1 from public.campus_nav_items existing where existing.href = '/suggestions'
  )
order by groups.sort_order
limit 1
on conflict (id) do nothing;

update public.campus_nav_items items
set group_id = groups.id,
    sort_order = 10
from public.campus_nav_groups groups
where items.href = '/suggestions'
  and groups.label = 'Council'
  and items.group_id is distinct from groups.id
  and groups.id = (
    select id
    from public.campus_nav_groups
    where label = 'Council'
    order by sort_order
    limit 1
  );
