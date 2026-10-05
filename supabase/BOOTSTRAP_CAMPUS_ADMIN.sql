-- One-time bootstrap for the first IISSCampus administrator.
-- 1. The person already has an Arigo Supabase Auth account.
-- 2. Replace the placeholder UUID below with that auth.users id
--    (Supabase → Authentication → Users → copy the user id).
-- 3. Run this in the Supabase SQL editor. Do not commit a real id.
-- 4. Later role changes go through grant_campus_role(), which only an existing campus administrator can call.
-- This does not change Arigo admin_users and does not make every Arigo admin a campus administrator.

insert into public.campus_staff (user_id, role, notes)
values ('00000000-0000-0000-0000-000000000000', 'administrator', 'First campus administrator')
on conflict (user_id) do nothing;
