# Security and Privacy

## What user information is stored

Registered users: email (via Supabase Auth) and a saved food profile (`allergies`, `dietary_restrictions`, `matching_strictness`). Guest users: nothing is persisted server-side — profile selections live only in client-side session state and disappear when the session ends, unless the user creates an account.

Favorites (saved restaurants/dishes) are stored per-user for registered accounts.

## Location data

Exact device location, if the user grants browser geolocation, is used only to compute distance/radius for the current search and is **not persisted** to the database by default. Manual location entry (neighborhood/ZIP/address) is always available as an alternative, and denying location permission does not block use of the app.

## Authentication

Supabase Auth handles password hashing and session management — this app never stores or handles raw passwords itself. Session tokens are managed via `@supabase/ssr` cookie helpers.

## Row Level Security

Supabase RLS policies ensure a user can only read/write their own `profiles` and `favorites` rows. The curated restaurant/menu dataset is publicly readable but writable only via the service-role key (server-side seed scripts only — never shipped to the browser).

## API key handling

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe to expose to the browser; protected by RLS, not secrecy.
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only, never in client code, never committed, used only by seed scripts.
- No map API key is needed — the interactive map uses Leaflet with OpenStreetMap tiles, which are free and don't require a key, account, or billing setup.
- No secret key is ever committed to the repository; `.env.local` is gitignored, and `.env.example` documents required variables with placeholder values only.

## User account deletion

A signed-in user can permanently delete their account from `/profile` ("Delete my account", behind a confirmation prompt). This calls `DELETE /api/account`, which verifies the request's own session identity (never a client-supplied id — a user can only ever delete their own account) and then deletes the underlying Supabase Auth user via the service-role admin client (deleting an `auth.users` row requires admin privileges). Both `profiles` and `favorites` reference `auth.users(id)` with `on delete cascade` (see `supabase/schema.sql`), so the user's saved food profile and all favorites are removed automatically in the same operation — no separate cleanup step, and nothing is left behind. Guest users have nothing to delete server-side; clearing their browser's localStorage removes everything.

## Reviewed dependency vulnerabilities

`npm audit` flags a moderate-severity PostCSS advisory nested inside Next.js's own build-time dependency tree (CSS stringification XSS, GHSA-qx2v-qp2m-jg93). This affects Next's internal build tooling, not code that processes user-supplied input at runtime, and the suggested automated fix would downgrade Next.js to version 9 — a materially worse outcome. Reviewed and accepted; re-checked periodically via `npm audit`.

## Why this app does not guarantee safety

The app never uses language implying a guarantee ("safe to eat," "allergy-proof," "completely allergen-free," "no risk"). Every classification is evidence-based and explicitly labeled with its confidence level and source, because:

- Menu descriptions and even official allergen guides can be incomplete or outdated.
- Cross-contact risk (shared fryers, grills, prep surfaces) is a separate risk category from ingredient content and is often undocumented.
- Restaurant recipes, suppliers, and procedures can change without our dataset being updated.

A persistent disclaimer (see `README.md` and in-app footer) states this plainly, and every dish/restaurant page repeats a short reminder to confirm with the restaurant directly before ordering.

## Content and IP

No indecent, defamatory, hateful, or otherwise prohibited content is included. Restaurant/menu data is sourced from each restaurant's own public materials (see `DATA_SOURCES.md`); no restaurant logos, photography, or other copyrighted creative assets are reproduced, and no proprietary third-party datasets are used without permission.
