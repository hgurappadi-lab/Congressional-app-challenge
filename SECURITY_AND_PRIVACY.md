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
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — exposed to the browser by design (client-side map rendering requires it), but restricted by HTTP referrer (only our deployed domain + localhost for dev) and scoped to the Maps JavaScript API only, with a Google Cloud billing budget alert configured as a safety net.
- No secret key is ever committed to the repository; `.env.local` is gitignored, and `.env.example` documents required variables with placeholder values only.

## User account deletion

_To be implemented and documented here alongside the profile/account feature (Phase 2/4): how a user deletes their account and what happens to their stored profile/favorites data._

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
