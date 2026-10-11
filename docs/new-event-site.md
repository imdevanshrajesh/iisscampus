# Building a new event site on the Arigo database

This guide is for another AI or developer who needs to stand up a registration site (hackathon, competition, FIFA Fever, and so on) that:

- uses the **same Supabase project as Arigo**
- reuses the **same signup / onboarding flow as UNBOUND** (`hackathonunbound`)
- never breaks existing Arigo, campus, or hackathon tables

IISSCampus itself only links out with **Register now**. It does not create student accounts or write team rows. The new site is the place that does that.

## Hard rules

1. Point the new app at the existing Arigo Supabase URL and anon key. Do not create a second Supabase project.
2. Never `drop`, `truncate`, or rewrite Arigo profile tables, `auth.users`, `hackathon_*`, or `campus_*`.
3. New tables use a **new prefix** for that event only (examples: `fifa_`, `unbound_` already exists as `hackathon_`). Prefer `create table if not exists` and `add column if not exists`.
4. Auth stays on Supabase Auth. Students create an Arigo account, then complete the existing `complete_onboarding` RPC, then register for your event.
5. Keep mutations behind first-party checks (`is_first_party_client()`) the same way UNBOUND does.

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=<same as Arigo>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<same as Arigo>
NEXT_PUBLIC_SITE_URL=https://your-event.buildkre.com
```

Optional secret key only if organizers need server-only admin tools. Never put a service-role key in a `NEXT_PUBLIC_` variable.

## Signup and redirects (copy this flow)

UNBOUND flow to reproduce:

1. Visitor opens Register → if not signed in, redirect to `/signup?next=/register`.
2. `signUp` calls Supabase Auth with  
   `emailRedirectTo: ${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`.
3. Email confirm hits `/auth/callback`, exchanges the code, then redirects to `next`.
4. Register page checks profile. If missing, redirect to `/onboarding?next=/register`.
5. Onboarding calls the existing Arigo RPC `complete_onboarding`.
6. Register page writes only into **your new prefixed tables**.

`next` must be a same-origin path: starts with `/`, does not start with `//`.

### Supabase Auth URL allowlist

In the Arigo project dashboard → Authentication → URL configuration:

- Keep Arigo’s own Site URL as Arigo (`https://arigo.buildkre.com`).
- Add redirect URLs for the new site:
  - `https://your-event.buildkre.com/**`
  - `http://localhost:3000/**` for local work

Do not remove Arigo or UNBOUND redirect entries.

### Linking from IISSCampus

On the campus event, enable registration and either:

- paste the event site register URL (`https://your-event.buildkre.com/register`), or
- leave the URL blank so **Register now** sends people to Arigo signup (`NEXT_PUBLIC_ARIGO_URL/signup`). Prefer the specific event register URL when the new site exists.

## SQL for the new site

Use [`../supabase/NEW_EVENT_SITE.sql`](../supabase/NEW_EVENT_SITE.sql) as a pattern. Before running it:

1. Replace the `example_` prefix with your event prefix.
2. Review every statement.
3. Run it in the Arigo Supabase SQL editor only after review.

The template shows:

- one parent table (registration / team)
- one child table (members)
- indexes
- RLS
- a `security definer` RPC gated by `is_first_party_client()`

It does not alter existing tables.

## Checklist for the implementing AI

- [ ] Same Supabase project as Arigo
- [ ] Signup + callback + onboarding match UNBOUND
- [ ] Auth redirect allowlist includes the new origin
- [ ] Tables use a new prefix and additive SQL only
- [ ] No writes to `campus_*` or Arigo profile tables except through `complete_onboarding`
- [ ] Public register path requires signed-in Arigo user with a completed profile
- [ ] IISSCampus event button points at the new site register URL when ready

## Reference repos

| Repo | Role |
|------|------|
| Arigo | Shared Auth + profiles |
| hackathonunbound | Working signup → onboarding → register example |
| iisscampus | Public archive; Register now links out |
