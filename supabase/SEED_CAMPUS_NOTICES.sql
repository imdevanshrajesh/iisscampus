-- Seed authentic campus notices into Supabase for IISS Boys
-- Paste into Supabase SQL Editor and execute. Safe to re-run.

-- 1. Ensure required columns exist on campus_announcements
alter table if exists public.campus_announcements
  add column if not exists title text,
  add column if not exists body text not null default '',
  add column if not exists resources jsonb not null default '[]'::jsonb;

-- 2. Populate title from message if null or blank
update public.campus_announcements
set title = coalesce(nullif(btrim(title), ''), nullif(btrim(message), ''), 'Campus Notice')
where title is null or btrim(title) = '';

-- 3. Upsert the 5 authentic campus notices (event_id is set to null to avoid FK constraint errors)
insert into public.campus_announcements (
  id,
  title,
  message,
  body,
  resources,
  event_id,
  enabled,
  sort_order,
  created_at,
  updated_at
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    'Term Examination Schedules & Academic Guidelines',
    'Official timetable for the upcoming mid-term examinations is now finalized.',
    'Official timetable for the upcoming mid-term examinations is now finalized. Morning sessions commence promptly at 08:00 AM. Students are required to be in full formal campus uniform with school identification badges visible at all times. Personal electronics, smart watches, and unauthorized stationery must be deposited with hall proctors prior to entry. Revision clinics will be hosted by department heads daily from 02:30 PM to 04:00 PM.',
    '[{"title": "Examination Timetable PDF", "url": "https://iissboys.com/docs/exam-schedule-term2.pdf", "kind": "pdf"}]'::jsonb,
    null,
    true,
    1,
    '2026-11-02 08:00:00+00',
    '2026-11-02 08:00:00+00'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    'Senior Leadership Council Nominations Open',
    'Applications are officially open for senior leadership prefectures and club presidencies.',
    'Applications are officially open for senior leadership prefectures and club presidencies for the upcoming academic cycle. Eligible Grade 10 and 11 students exhibiting exemplary discipline, academic diligence, and extracurricular initiative may collect official nomination dossiers from the Student Council Secretariat. Completed portfolios and faculty endorsements are due before the deadline.',
    '[{"title": "Prefect Nomination Dossier", "url": "https://iissboys.com/docs/prefect-nomination-2026.pdf", "kind": "pdf"}]'::jsonb,
    null,
    true,
    2,
    '2026-10-28 10:00:00+00',
    '2026-10-28 10:00:00+00'
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    'Inter-School Sports League Fixtures & Team Roster',
    'The campus athletics board has published the official match schedule for inter-school fixtures.',
    'The campus athletics board has published the official match schedule for the inter-school football, volleyball, and track invitational. Transport shuttles will depart from the main sports pavilion at 07:15 AM on match days. Visiting supporters must register with their house captains for spectator passes. All participating athletes must complete mandatory medical clearances.',
    '[{"title": "Tournament Bracket & Schedule", "url": "https://iissboys.com/docs/sports-fixtures-nov.pdf", "kind": "pdf"}]'::jsonb,
    null,
    true,
    3,
    '2026-10-25 14:30:00+00',
    '2026-10-25 14:30:00+00'
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    'Annual Science & STEM Robotics Exhibition',
    'Registration is open for project submissions for the Annual Science & STEM Robotics Exhibition.',
    'Registration is open for project submissions for the Annual Science & STEM Robotics Exhibition. Teams are invited across three divisions: Junior Engineering (Grades 6–8), Senior Robotics & Automation (Grades 9–10), and Advanced Applied Sciences (Grades 11–12). Lab facilities and 3D printing suites will be accessible after school hours with faculty supervision.',
    '[{"title": "STEM Exhibition Handbook", "url": "https://iissboys.com/docs/stem-exhibition-guide.pdf", "kind": "pdf"}]'::jsonb,
    null,
    true,
    4,
    '2026-10-20 09:15:00+00',
    '2026-10-20 09:15:00+00'
  ),
  (
    '40000000-0000-4000-8000-000000000005',
    'Winter Campus Protocol & Uniform Code Guidelines',
    'Winter campus uniform standard guidelines and extended library hours.',
    'Beginning Sunday next week, all students must adhere to the winter campus uniform standard: school blazers with embroidered crest, formal dress trousers, and navy pullovers. Sports tracksuits are strictly restricted to physical education blocks. The campus library and indoor recreational halls will maintain extended warming hours through 05:00 PM.',
    '[]'::jsonb,
    null,
    true,
    5,
    '2026-10-15 11:00:00+00',
    '2026-10-15 11:00:00+00'
  )
on conflict (id) do update set
  title = excluded.title,
  message = excluded.message,
  body = excluded.body,
  resources = excluded.resources,
  event_id = excluded.event_id,
  enabled = excluded.enabled,
  sort_order = excluded.sort_order,
  updated_at = now();

-- 4. Ensure "Campus Notices" is added to campus_nav_items under Council
insert into public.campus_nav_items (
  id,
  group_id,
  title,
  description,
  href,
  sort_order,
  enabled
)
select
  'a1b2c3d4-0002-4000-8000-000000000010',
  id,
  'Campus Notices',
  'Official circulars & directives',
  '/announcements',
  5,
  true
from public.campus_nav_groups
where lower(btrim(label)) = 'council' or id = 'a1b2c3d4-0001-4000-8000-000000000004'
limit 1
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  href = excluded.href,
  enabled = true;
