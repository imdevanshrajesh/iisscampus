-- Adds AI configuration columns to campus_settings table
-- Supports xAI Grok, OpenAI, OpenRouter, Google Gemini, and custom OpenAI-compatible endpoints.

alter table public.campus_settings
  add column if not exists ai_provider text default 'xai',
  add column if not exists ai_api_key text,
  add column if not exists ai_model text default 'grok-2-latest',
  add column if not exists ai_base_url text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'campus_settings_ai_provider_check'
  ) then
    alter table public.campus_settings
      add constraint campus_settings_ai_provider_check
      check (ai_provider is null or ai_provider in ('xai', 'openai', 'openrouter', 'gemini', 'custom'));
  end if;
end $$;

update public.campus_settings
set
  ai_provider = coalesce(ai_provider, 'xai'),
  ai_model = coalesce(ai_model, 'grok-2-latest')
where id = true;
