-- Run this whole file once in the Supabase SQL editor.
-- Safe to run more than once. It only adds columns on council members.

do $outer$
begin
  if to_regclass('public.campus_council_members') is null then
    raise notice 'Council tables are not in this database yet. Run supabase/migrations/20261004180000_campus_council.sql first.';
    return;
  end if;

  execute $sql$
    alter table public.campus_council_members
      add column if not exists about text,
      add column if not exists work text,
      add column if not exists slug text
  $sql$;

  execute $sql$
    alter table public.campus_council_members
      drop constraint if exists campus_council_members_about_len
  $sql$;

  execute $sql$
    alter table public.campus_council_members
      add constraint campus_council_members_about_len
      check (about is null or char_length(about) between 1 and 4000)
  $sql$;

  execute $sql$
    alter table public.campus_council_members
      drop constraint if exists campus_council_members_work_len
  $sql$;

  execute $sql$
    alter table public.campus_council_members
      add constraint campus_council_members_work_len
      check (work is null or char_length(work) between 1 and 4000)
  $sql$;

  execute $sql$
    alter table public.campus_council_members
      drop constraint if exists campus_council_members_slug_format
  $sql$;

  execute $sql$
    alter table public.campus_council_members
      add constraint campus_council_members_slug_format
      check (slug is null or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
  $sql$;

  execute $sql$
    with raw as (
      select
        id,
        year_id,
        sort_order,
        left(
          trim(both '-' from regexp_replace(
            regexp_replace(lower(name), '&', ' and ', 'g'),
            '[^a-z0-9]+',
            '-',
            'g'
          )),
          72
        ) as base
      from public.campus_council_members
      where slug is null or slug = ''
    ),
    numbered as (
      select
        id,
        case when base = '' then 'member' else base end as base,
        row_number() over (
          partition by year_id, case when base = '' then 'member' else base end
          order by sort_order, id
        ) as n
      from raw
    )
    update public.campus_council_members member
    set slug = case
      when numbered.n = 1 then numbered.base
      else left(numbered.base, 70) || '-' || numbered.n::text
    end
    from numbered
    where member.id = numbered.id
  $sql$;

  execute $sql$
    create unique index if not exists campus_council_members_year_slug_uidx
      on public.campus_council_members (year_id, slug)
  $sql$;
end
$outer$;
