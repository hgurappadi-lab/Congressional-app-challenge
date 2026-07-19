# Supabase setup

1. Create a project at supabase.com (any region; `us-west-1` is closest to San Diego).
2. Project Settings → API → copy the **Project URL**, **anon public key**, and **service_role key**.
3. In the repo root: `cp .env.example .env.local`, then paste those three values into `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. Supabase Dashboard → SQL Editor → paste the entire contents of `schema.sql` in this folder → Run. It's safe to re-run if you make edits later (every statement is idempotent).
5. Authentication → Providers: Email should be enabled by default. Authentication → URL Configuration: add `http://localhost:3000/auth/callback` (and your Vercel deployment URL's equivalent once deployed) to the Redirect URLs allow-list, or email confirmation links won't work.
6. Run `npm run dev` and test: sign up with a real email you can check, confirm via the emailed link, sign in, sign out.
