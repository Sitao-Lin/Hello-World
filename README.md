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
