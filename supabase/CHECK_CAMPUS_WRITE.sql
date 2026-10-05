-- Run while signed in as your campus account is not required.
-- This checks table privileges and whether campus staff / first-party checks look healthy.
-- Replace the placeholder UUID with your auth.users id before the staff check.

select
  table_name,
  grantee,
  string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'campus_events',
    'campus_event_images',
    'campus_event_relations',
    'campus_categories',
    'campus_settings',
    'campus_staff',
    'campus_achievements'
  )
  and grantee in ('anon', 'authenticated', 'service_role')
group by table_name, grantee
order by table_name, grantee;

select
  to_regclass('public.campus_council_years') as council_years,
  to_regclass('public.campus_council_photos') as council_photos,
  to_regclass('public.campus_council_posts') as council_posts,
  to_regclass('public.campus_council_members') as council_members;

-- Replace with your auth.users id.
select user_id, role
from public.campus_staff
where user_id = '00000000-0000-0000-0000-000000000000';
