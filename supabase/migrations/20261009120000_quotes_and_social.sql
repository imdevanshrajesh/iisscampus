-- Run this whole file once in the Supabase SQL editor.
-- Safe to run more than once.
--
-- It saves the two Instagram links, adds a message field on council members
-- when those tables exist, and adds the media and steam posts.

alter table public.campus_settings
  add column if not exists instagram_url text,
  add column if not exists scixcom_instagram_url text;

alter table public.campus_settings
  drop constraint if exists campus_settings_instagram_https;

alter table public.campus_settings
  add constraint campus_settings_instagram_https
  check (instagram_url is null or instagram_url ~* '^https://');

alter table public.campus_settings
  drop constraint if exists campus_settings_scixcom_instagram_https;

alter table public.campus_settings
  add constraint campus_settings_scixcom_instagram_https
  check (scixcom_instagram_url is null or scixcom_instagram_url ~* '^https://');

update public.campus_settings
set
  instagram_url = coalesce(instagram_url, 'https://www.instagram.com/iisscampus/'),
  scixcom_instagram_url = coalesce(scixcom_instagram_url, 'https://www.instagram.com/scixcom.27/')
where id = true;

do $outer$
begin
  if to_regclass('public.campus_council_members') is null then
    raise notice 'Council tables are not in this database yet. The new posts are already in the site roster. Run supabase/migrations/20261004180000_campus_council.sql before editing the council from the admin.';
    return;
  end if;

  execute $sql$
    alter table public.campus_council_members
      add column if not exists quote text
  $sql$;

  execute $sql$
    alter table public.campus_council_members
      drop constraint if exists campus_council_members_quote_len
  $sql$;

  execute $sql$
    alter table public.campus_council_members
      add constraint campus_council_members_quote_len
      check (quote is null or char_length(quote) between 1 and 400)
  $sql$;

  execute $sql$
    insert into public.campus_council_members (year_id, role, name, sort_order)
    select year.id,
      added.role,
      added.name,
      coalesce((
        select max(member.sort_order)
        from public.campus_council_members member
        where member.year_id = year.id
      ), -1) + added.offset
    from public.campus_council_years year
    cross join (
      values
        (1, 'Media Captain', 'ARMAN'),
        (2, 'Media Vice Captain', 'ZEBADIYA'),
        (3, 'Steam Captain', 'MUHAMMAD ZEHAL'),
        (4, 'Steam Vice Captain', 'ASWAS JOY')
    ) as added(offset, role, name)
    where year.kind = 'current'
      and year.publication_status = 'published'
      and not exists (
        select 1
        from public.campus_council_members existing
        where existing.year_id = year.id
          and existing.role = added.role
      )
  $sql$;
end
$outer$;
