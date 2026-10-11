alter table public.campus_settings
  add column if not exists newsletter_title text,
  add column if not exists newsletter_image_url text,
  add column if not exists newsletter_href text,
  add column if not exists newsletter_pdf_url text,
  add column if not exists newsletter_published boolean not null default false;
