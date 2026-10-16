-- Stable key so Arigo can update the Bake & Sale card without duplicating campus custom programs.

alter table public.campus_custom_programs
  add column if not exists program_key text;

create unique index if not exists campus_custom_programs_program_key_idx
  on public.campus_custom_programs (program_key)
  where program_key is not null;
