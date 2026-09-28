# The Reading Room

Assignment #2 extends the original Hello World Next.js app with a live book list at `/`.
The server fetches `public.books` through the Supabase REST API on every request.
There is no hardcoded fallback list; empty and failed requests have separate states.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/setup.sql` in its SQL Editor. This creates and seeds the books table,
   enables row-level security, and grants public read access only.
3. Copy `.env.example` to `.env.local` in this repository root.
4. Fill in `SUPABASE_URL` and `SUPABASE_ANON_KEY` from your project's API settings.
   Use the legacy anon key, not the service-role key. Never commit `.env.local`.

## Local development

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Add or edit a book in Supabase and refresh to verify live data.

```sh
npx eslint src
npm run build
```

## Vercel

Use the existing Vercel project linked to this GitHub repository. The app is in the
repository root (not the legacy `hello-world` generated-assets folder).
Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` for both Production and Preview environments,
then deploy the commit containing these changes. In project settings, disable
Deployment Protection as required for the assignment. Open the deployment-specific
URL from that commit's deployment details in an incognito window and confirm books
are visible without signing in. Submit that URL, not the moving production alias.

Supabase reference: https://supabase.com/docs/guides/api

## Week 3: Google sign-in and profiles

The existing collection remains public. `/reading-room` requires a verified session
and a completed name; `/profile` requires a verified session. Navigation changes
with the login state. Authentication uses Supabase SSR cookies and the Next.js 16
proxy, with all database writes checked again on the server.

1. In the **existing** Supabase project, run `supabase/auth.sql` after the project
   has finished starting. It creates nullable first/last name fields, a trigger
   on `auth.users`, profiles for existing users, and a private `avatars` bucket.
   RLS limits profile and photo access to each owner.
2. Create your own Google Cloud OAuth client of type **Web application**. Configure
   its consent screen for external users. To allow grading by other accounts,
   publish the app to production when ready (or add the grader as a test user).
   Request only the standard `openid`, `email`, and `profile` scopes.
3. In Google's **Authorized redirect URIs**, enter the Supabase callback URL:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`.
   Save that client's ID and secret in Supabase Authentication → Google provider.
   Never put the Google client secret in this repository or the browser.
4. In Supabase Authentication → URL Configuration, add the app's exact callback
   URLs: `http://localhost:3000/auth/callback`, your production URL followed by
   `/auth/callback`, and the commit-specific Vercel URL followed by `/auth/callback`.
   Set Site URL to your production URL. The app sends `/auth/callback` without
   custom query parameters; Supabase appends its required authorization code.
5. Keep the existing `SUPABASE_URL` and `SUPABASE_ANON_KEY` Vercel variables.
   No additional browser environment variables are needed because this app starts
   OAuth and handles profile uploads with server actions. `APP_URL` is an optional
   fixed origin; leave it unset to keep login on each deployment's own domain.

The profile form requires both names before entering the reading room. Photos are
validated as JPG, PNG or WebP, at most 2 MB, and stored in Storage; the relational
row stores only a path. Private photos are displayed with short-lived signed URLs.
Replacing a photo removes the previous file after the profile update succeeds.

### Acceptance checks

- Incognito: collection loads; navigation shows Sign in; direct visits to
  `/reading-room` and `/profile` redirect to `/login`.
- Google sign-in: callback returns to this deployment and creates one profile.
  New users are prompted for both names; signing in again does not duplicate it.
- Blank or whitespace names are rejected. Save names and enter the reading room.
- Upload a valid photo, refresh, and verify it persists. Replace it and verify the
  old file is removed. Reject files larger than 2 MB or with unsupported types.
- Sign out: private routes redirect to login again. A second user cannot read or
  update the first user's profile or private avatar using their own session.
- Verify Deployment Protection is off and submit the **commit-specific** URL.

References: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs),
[Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google).
