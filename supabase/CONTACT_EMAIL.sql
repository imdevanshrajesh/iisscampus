-- Contact email for About and footer (opens the visitor's mail app).
-- Safe to run more than once.

alter table public.campus_settings
  add column if not exists contact_email text;

alter table public.campus_settings
  drop constraint if exists campus_settings_contact_email_format;

alter table public.campus_settings
  add constraint campus_settings_contact_email_format
  check (
    contact_email is null
    or contact_email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  );
