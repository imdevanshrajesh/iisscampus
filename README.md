# IISSCampus

IISSCampus is an independent archive of student activities, events, and achievements for India International School, Sharjah. It is not the official school website. That site remains [iiss.ae](https://iiss.ae).

The public site runs without a database. Demonstration records for FIFA Fever, Mango Day, and the Sustainability Exhibition are labeled as samples. They are not verified historical accounts, and they do not include invented winners or dates.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` only when you are ready to connect the existing Supabase project. Leave the Supabase values empty until the campus migration has been reviewed and applied. Do not commit `.env.local`.

## Content workspace

The content workspace is at `/manage`. It is not linked from the public site. Hiding the address is not the security control.

Until Supabase environment variables are set, `/manage` explains that sign-in is unavailable and does not grant access. After they are set:

- Viewers stay anonymous and can read published pages only.
- Editors can draft events, galleries, categories, and achievements, then submit them for review.
- Administrators can publish, unpublish, archive, restore, approve image hosts, and assign roles.
- Editors cannot publish or change roles. Nobody can permanently delete a published record from the app.

Sign-in uses the existing Supabase Auth project. An Arigo account is not a campus role. Campus roles live in `campus_staff`, not in editable user metadata and not in Arigo's `admin_users` table.

### First administrator

Do not use a public signup page. After the migration is applied, edit `supabase/BOOTSTRAP_CAMPUS_ADMIN.sql`, replace the placeholder account id with an existing `auth.users` id, and run that statement in the Supabase SQL editor. Later changes go through Settings, which calls `grant_campus_role()`. That function only works for someone who is already a campus administrator.

Recovery uses the same SQL statement. It does not change Arigo's administrator list.

### Photographs

Paste an `https://` image address. The host must be on the list an administrator saves in Settings. Google Drive and Docs sharing links are rejected and are not rewritten into guessed download addresses. The browser loads the image. This server does not fetch it.

### Registration

Each event can store an external registration URL, usually an existing Arigo page. The public button appears only when registration is enabled and the URL is a valid `https://` link. IISSCampus does not collect Arigo passwords and does not write hackathon or competition registrations.

Set `NEXT_PUBLIC_ARIGO_URL` to the public Arigo origin when you want the community link and return-address allowlist. Per-event registration URLs are stored on the event.

## Database

`supabase/migrations/20261002120000_campus_content.sql` adds `campus_*` tables, row level security, and role helpers. It does not alter Arigo tables, signup, or email confirmation. It expects `set_updated_at()` and `is_first_party_client()` to already exist.

The migration has not been applied. Do not run it, and do not set the Supabase environment variables, until that change is approved. `supabase/ROLLBACK_CAMPUS.sql` removes only the campus objects.

The Supabase CLI was not available in this environment, so the migration file follows the existing `YYYYMMDDHHMMSS_name.sql` naming pattern instead of being created with `supabase migration new`.

## Checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Database persistence, live sign-in, and row level security have not been exercised against the Supabase project. The automated tests cover the permission rules, public filtering, image URL checks, registration states, and redirect allowlist in this repository.
