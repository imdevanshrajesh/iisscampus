-- Pin selected event photographs for the public gallery page.
-- Safe to run more than once.

alter table public.campus_event_images
  add column if not exists pinned boolean not null default false;

create index if not exists campus_event_images_pinned_idx
  on public.campus_event_images (pinned, event_id)
  where pinned = true;
