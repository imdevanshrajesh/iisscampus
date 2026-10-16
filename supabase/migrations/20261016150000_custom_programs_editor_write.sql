-- Let campus editors manage custom program cards (not only administrators).

drop policy if exists "Staff writes custom programs" on public.campus_custom_programs;
create policy "Staff writes custom programs"
on public.campus_custom_programs for all
to authenticated
using (public.is_campus_editor() and public.is_first_party_client())
with check (public.is_campus_editor() and public.is_first_party_client());
