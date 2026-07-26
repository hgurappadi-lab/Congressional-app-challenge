# Architecture

## Overview

A Next.js 16 (App Router) application with Supabase as the database and auth provider, deployed on Vercel. Leaflet with OpenStreetMap tiles renders the interactive map client-side only — free, no API key or billing account required. All allergy/dietary matching, evidence classification, and ranking logic runs as deterministic JavaScript functions — not live AI calls — so results are explainable and testable.

```
Browser (React client components, Leaflet + OpenStreetMap)
   |
   |  fetch()
   v
Next.js Route Handlers (/src/app/api/*)  --  deterministic logic in /src/lib/*.js
   |
   |  @supabase/supabase-js
   v
Supabase (Postgres + Auth + Row Level Security)
```

## Frontend

- Next.js 16 App Router, plain JavaScript, Tailwind CSS 4.
- Route groups: `(onboarding)/welcome`, `(onboarding)/profile` for first-run flow (the parentheses create a URL-less grouping folder — doesn't add a path segment).
- Pages: `/home`, `/map`, `/restaurant/[id]`, `/dish/[id]`, `/favorites`.
- Server Components by default; interactive pieces (forms, map, filters) are explicit Client Components (`'use client'`).
- Next.js 16 makes route `params`/`searchParams` `Promise`s in every file convention (`page.js`, `layout.js`, `route.js`, `generateMetadata`) — always `await`ed in Server Components, or read via React's `use()`/`useParams()` in Client Components.

## Backend

- Next.js Route Handlers under `/src/app/api/*/route.js`: `rank` (POST — Explore Nearby ranking), `search` (POST — Find a Dish), `restaurant/[id]` (POST — restaurant detail), `dish/[id]` (POST — dish detail), `favorites` (GET/POST/DELETE — the first auth-gated route in the app), `account` (DELETE — account deletion). `reports` (community corrections) is a documented stretch feature per the build plan and has no route yet. Each exports named async functions per HTTP verb; the profile-driven routes (`rank`/`search`/`restaurant`/`dish`) take the caller's allergy/dietary profile as a JSON body via `await request.json()` rather than query params, since a profile is a nested object (allergy list with severities, dietary restriction list) that doesn't map cleanly onto a query string; `favorites`' `GET` is the one place query params are used, for a lightweight single-item favorited-or-not check.
- All allergen classification, scoring, evidence-confidence mapping, question generation, and display-label logic lives in plain, dependency-free functions under `/src/lib/` (`classification.js`, `scoring.js`, `evidence.js`, `questions.js`, `search.js`, `group-dishes.js`, `classification-labels.js`, `evidence-labels.js`, `favorites.js`'s pure half) so it can be unit-tested with Vitest independent of the network/database.
- Route handlers are thin: fetch data from Supabase (via small server-only helpers under `/src/app/api/_lib/`, kept separate from `/src/lib` since they're not pure), call the pure `/lib` functions, return the result.
- `/api/account` and `/api/favorites` are the only routes that require authentication — they call `supabase.auth.getUser()` first and return an explicit `401` if there's no session, rather than relying on Row Level Security to fail silently. `/api/account`'s `DELETE` handler is also the only place `src/lib/supabase/admin.js` (the service-role client) is used outside the one-time seed scripts — deleting a Supabase Auth user requires admin privileges, but the route always derives *which* user to delete from the caller's own session, never a client-supplied id.

## Database (Supabase / Postgres)

See the full schema in the approved build plan; summarized here:

- `profiles` — one row per registered user (`id` = `auth.users.id`), storing `allergies` (jsonb array of `{allergen, severity}`), `dietary_restrictions`, `matching_strictness`.
- `restaurants`, `menu_items` — the curated dataset, each row carrying `source_url`, `source_type`, `data_collected_at`, `last_checked_at`.
- `item_ingredients`, `item_allergens`, `item_dietary_attributes`, `cross_contact_notes`, `modifications` — structured, evidence-tagged detail rows per menu item.
- `favorites` — saved restaurants/dishes per user.
- `user_reports` — stretch feature, community corrections.

Row Level Security (RLS) policies restrict `profiles` and `favorites` rows so a user can only read/write their own; `restaurants`/`menu_items`/etc. are publicly readable (it's the app's curated dataset, not user-owned data) but writable only via the service-role key used in seed scripts, never from the browser.

## Authentication

Supabase Auth (email/password) for registered accounts. A **guest mode** lets a user complete the full journey (profile, search, ranking, favorites-in-session) without an account, so judges can evaluate the app without creating credentials — guest profile state lives client-side (not persisted server-side) until/unless the user signs up.

## Map integration

Leaflet, loaded client-side only (`src/components/RestaurantMap.js`), rendering OpenStreetMap raster tiles — free, no API key or billing account, only the on-map attribution OpenStreetMap's tile usage policy requires (which Leaflet shows by default). Restaurant markers are simple inline-SVG pins (no external marker-image assets, which don't resolve cleanly under Turbopack). The map view fits itself to whatever restaurant markers are currently shown (`fitBounds`) rather than a fixed zoom level, so results are never off-screen on a short mobile viewport. The map never calls a live geocoding/places API — all restaurant location data is pre-curated and stored in Supabase (see `DATA_SOURCES.md` for why).

## Data flow — Explore Nearby

1. User grants geolocation or enters a location manually; selects a radius.
2. Client `POST`s to `/api/rank` with `{ lat, lng, radiusMiles, allergies, dietaryRestrictions, matchingStrictness }`.
3. Route handler queries `restaurants` (and joined menu/allergen data) from Supabase, then filters to the radius client-side via `/lib/geo.js`'s haversine distance.
4. For each restaurant, `/lib/classification.js` classifies each menu item against the user's profile and matching strictness; `/lib/scoring.js` aggregates those classifications plus evidence quality and data freshness into a Choice Availability Score with an explanation breakdown.
5. Results are returned ranked (distance is a secondary sort only, never a scoring input); the client renders map markers and result cards, each linking to `/restaurant/[id]`.

## Data flow — Find a Dish

1. User enters a craving (e.g. "spicy fried rice").
2. Client `POST`s to `/api/search` with the same shape as `/api/rank` plus `{ query }`.
3. `/lib/search.js` deterministically expands the query (normalization, synonym dictionary, in-process trigram similarity) to find exact and related dish name matches across every restaurant within the radius.
4. Matches are classified against the user's profile the same way as Explore Nearby, then ranked by a combination of craving relevance and compatibility; each result links to `/dish/[id]`.

## Data flow — restaurant/dish detail

`/restaurant/[id]` and `/dish/[id]` follow the same page/client-component split as `/map` (a thin `page.js` server wrapper awaiting the route's `params`, plus a `"use client"` component that loads the caller's profile and `POST`s it to the matching API route). `/api/restaurant/[id]` re-runs `classifyDish`/`scoreRestaurant` over just that restaurant's menu and returns a full per-dish breakdown grouped by category (`/lib/group-dishes.js`) client-side. `/api/dish/[id]` goes further than the restaurant route: alongside the personalized classification, it returns every raw evidence row for that dish (all documented allergens/dietary attributes/modifications/cross-contact notes, not just the ones the caller's profile touches) so the page can be fully transparent, plus `/lib/questions.js`'s generated staff questions for whatever gaps remain in the evidence.

## Ranking flow

Documented in full in the build plan (`§9`); implemented in `/lib/scoring.js`, unit-tested in `tests/scoring.test.js`. The score and its plain-language explanation are computed together — the UI never shows a bare number.

## Favorites

`favorites.user_id` is `NOT NULL` in the schema, so a favorites row cannot exist without a signed-in user. Guest favorites are therefore entirely client-side (`localStorage`, mirroring the guest-profile pattern in `/lib/profile.js`) and never touch the server; signed-in favorites go through `/api/favorites`. Since `favorites.target_id` has no foreign key to `restaurants`/`menu_items` (disambiguated only by `target_type`), listing a user's favorites with real names requires a second lookup query merged back in by id (`/lib/favorites.js`'s `mergeFavoritesWithTargets`), not an automatic Supabase join.

## External APIs

- **OpenStreetMap** (via Leaflet) — client-side map rendering only (see above).
- **Supabase** — database + auth, accessed via `@supabase/supabase-js` (browser, anon key + RLS) and `@supabase/ssr` (server-side session handling).

## Deployment

- App: Vercel, connected to the GitHub repository, auto-deploying the production branch.
- Database/Auth: Supabase hosted project.
- Environment variables (see `.env.example`) are set in the Vercel project dashboard and in Supabase, never committed to the repo.

## Known technical constraints

_Updated as the project is built — see `LIMITATIONS.md` for the full list._
