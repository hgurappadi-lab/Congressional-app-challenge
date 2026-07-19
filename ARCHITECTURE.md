# Architecture

## Overview

A Next.js 16 (App Router) application with Supabase as the database and auth provider, deployed on Vercel. The Google Maps JavaScript API renders the interactive map client-side only. All allergy/dietary matching, evidence classification, and ranking logic runs as deterministic JavaScript functions — not live AI calls — so results are explainable and testable.

```
Browser (React client components, Google Maps JS API)
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

- Next.js Route Handlers under `/src/app/api/*/route.js` (`search`, `rank`, `favorites`, `reports`). Each exports named async functions per HTTP verb (`GET`, `POST`, ...), reads query params via `request.nextUrl.searchParams`, reads bodies via `await request.json()`, and returns `Response.json(...)`.
- All allergen classification, scoring, evidence-confidence mapping, and question generation logic lives in plain, dependency-free functions under `/src/lib/` (`classification.js`, `scoring.js`, `evidence.js`, `questions.js`, `search.js`) so it can be unit-tested with Vitest independent of the network/database.
- Route handlers are thin: fetch data from Supabase, call the pure `/lib` functions, return the result.

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

Google Maps JavaScript API, loaded client-side only, with a browser API key restricted by HTTP referrer and scoped to the Maps JavaScript API alone (see `SECURITY_AND_PRIVACY.md`). The map never calls Google Places/Geocoding APIs live — all restaurant location data is pre-curated and stored in Supabase (see `DATA_SOURCES.md` for why).

## Data flow — Explore Nearby

1. User grants geolocation or enters a location manually; selects a radius.
2. Client requests `/api/rank?lat=...&lng=...&radius=...` (plus the user's profile).
3. Route handler queries `restaurants` (and joined menu/allergen data) from Supabase within the radius.
4. For each restaurant, `/lib/classification.js` classifies each menu item against the user's profile and matching strictness; `/lib/scoring.js` aggregates those classifications plus evidence quality and data freshness into a Choice Availability Score with an explanation breakdown.
5. Results are returned ranked; the client renders map markers and result cards.

## Data flow — Find a Dish

1. User enters a craving (e.g. "spicy fried rice").
2. `/lib/search.js` deterministically expands the query (normalization, synonym dictionary, cuisine tags, Postgres trigram/full-text similarity) to find exact and related dish name matches.
3. Matches are filtered/classified against the user's profile the same way as Explore Nearby, then ranked by a combination of craving relevance and compatibility.

## Ranking flow

Documented in full in the build plan (`§9`); implemented in `/lib/scoring.js`, unit-tested in `tests/scoring.test.js`. The score and its plain-language explanation are computed together — the UI never shows a bare number.

## External APIs

- **Google Maps JavaScript API** — client-side map rendering only (see above).
- **Supabase** — database + auth, accessed via `@supabase/supabase-js` (browser, anon key + RLS) and `@supabase/ssr` (server-side session handling).

## Deployment

- App: Vercel, connected to the GitHub repository, auto-deploying the production branch.
- Database/Auth: Supabase hosted project.
- Environment variables (see `.env.example`) are set in the Vercel project dashboard and in Supabase, never committed to the repo.

## Known technical constraints

_Updated as the project is built — see `LIMITATIONS.md` for the full list._
