-- Give myiisscampus@gmail.com the same campus role as devanshs149@gmail.com.
-- Run once in the Supabase SQL editor. Safe to run again.
-- The Gmail address must already exist under Authentication → Users.

do $outer$
declare
  admin_id uuid;
  admin_role public.campus_role;
  target_id uuid;
begin
  select id into admin_id
  from auth.users
  where lower(email) = 'devanshs149@gmail.com';

  if admin_id is null then
    raise exception 'No sign-in account exists for devanshs149@gmail.com';
  end if;

  select role into admin_role
  from public.campus_staff
  where user_id = admin_id;

  if admin_role is null then
    raise exception 'devanshs149@gmail.com has no campus role';
  end if;

  select id into target_id
  from auth.users
  where lower(email) = 'myiisscampus@gmail.com';

  if target_id is null then
    raise exception 'No sign-in account exists for myiisscampus@gmail.com. Add that user under Authentication, then run this again.';
  end if;

  insert into public.campus_staff (user_id, role, granted_by, notes)
  values (target_id, admin_role, admin_id, 'Same campus role as devanshs149@gmail.com')
  on conflict (user_id) do update
    set role = excluded.role,
        granted_by = excluded.granted_by,
        notes = excluded.notes;

  raise notice 'Granted % to myiisscampus@gmail.com', admin_role;
end
$outer$;

select u.email, s.role
from auth.users u
left join public.campus_staff s on s.user_id = u.id
where lower(u.email) in ('devanshs149@gmail.com', 'myiisscampus@gmail.com')
order by u.email;
