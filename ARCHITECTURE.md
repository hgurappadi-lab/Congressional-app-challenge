# Architecture

## Overview

A Next.js 16 (App Router) application with Supabase as the database (curated restaurant/menu data only — no accounts), deployed on Vercel. Leaflet with OpenStreetMap tiles renders the interactive map client-side only — free, no API key or billing account required. All allergy/dietary matching, evidence classification, and ranking logic runs as deterministic JavaScript functions — not live AI calls — so results are explainable and testable.

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
- `SiteHeader` (`src/components/SiteHeader.js`) renders once in `RootLayout` (`src/app/layout.js`), giving every page persistent nav for free. Hides itself (returns `null`) on `/` and `/home` (its hero already has an equivalent nav) — everywhere else gets it automatically, no per-page wiring needed.
- Server Components by default; interactive pieces (forms, map, filters) are explicit Client Components (`'use client'`).
- Next.js 16 makes route `params`/`searchParams` `Promise`s in every file convention (`page.js`, `layout.js`, `route.js`, `generateMetadata`) — always `await`ed in Server Components, or read via React's `use()`/`useParams()` in Client Components.

## Backend

- Next.js Route Handlers under `/src/app/api/*/route.js`: `rank` (POST — Explore Nearby ranking), `search` (POST — Find a Dish), `restaurant/[id]` (POST — restaurant detail), `dish/[id]` (POST — dish detail), `nearby-live` (POST — live Google Places discovery), `website-lookup` (POST — on-demand AI website read). `reports` (community corrections) is a documented stretch feature per the build plan and has no route yet. Each exports named async functions per HTTP verb; the profile-driven routes (`rank`/`search`/`restaurant`/`dish`) take the caller's allergy/dietary profile as a JSON body via `await request.json()` rather than query params, since a profile is a nested object (allergy list with severities, dietary restriction list) that doesn't map cleanly onto a query string.
- All allergen classification, scoring, evidence-confidence mapping, question generation, and display-label logic lives in plain, dependency-free functions under `/src/lib/` (`classification.js`, `scoring.js`, `evidence.js`, `questions.js`, `search.js`, `group-dishes.js`, `classification-labels.js`, `evidence-labels.js`, `favorites.js`'s pure half) so it can be unit-tested with Vitest independent of the network/database.
- Route handlers are thin: fetch data from Supabase (via small server-only helpers under `/src/app/api/_lib/`, kept separate from `/src/lib` since they're not pure), call the pure `/lib` functions, return the result.

## Database (Supabase / Postgres)

See the full schema in the approved build plan; summarized here:

- `restaurants`, `menu_items` — the curated dataset, each row carrying `source_url`, `source_type`, `data_collected_at`, `last_checked_at`.
- `item_ingredients`, `item_allergens`, `item_dietary_attributes`, `cross_contact_notes`, `modifications` — structured, evidence-tagged detail rows per menu item.
- `user_reports` — stretch feature, community corrections.

`restaurants`/`menu_items`/etc. are publicly readable (it's the app's curated dataset, not user-owned data) but writable only via the service-role key used in seed scripts, never from the browser. This app has no accounts (see "Authentication" below), so the schema's `profiles`/`favorites` tables and their Row Level Security policies (still present in `supabase/schema.sql` and the live project as of this writing) are unused by the app code — ask before dropping them from the live database, since that's a real, hard-to-reverse data-loss action distinct from removing the app code that used them.

## Authentication

**None — this app has no accounts.** Removed entirely (2026-09-11) per explicit user direction: "everyone that uses this website is a guest." Every profile/favorites entry lives only in the browser's `localStorage` (`src/lib/profile.js`, `src/lib/favorites.js`) — nothing is ever sent to or read from the server for identity. This is also what lets a judge use the full app with zero signup (CAC §16 requires judge access without an account). There is no session, no sign-in/sign-up flow, and no `/api/account` or `/api/favorites` server route — every page loads its profile client-side on mount.

## Map integration

Leaflet, loaded client-side only (`src/components/RestaurantMap.js`), rendering OpenStreetMap raster tiles — free, no API key or billing account, only the on-map attribution OpenStreetMap's tile usage policy requires (which Leaflet shows by default). Restaurant markers are simple inline-SVG pins (no external marker-image assets, which don't resolve cleanly under Turbopack). The map view fits itself to whatever restaurant markers are currently shown (`fitBounds`) rather than a fixed zoom level, so results are never off-screen on a short mobile viewport. The map never calls a live geocoding/places API — all restaurant location data is pre-curated and stored in Supabase (see `DATA_SOURCES.md` for why).

## Data flow — Explore Nearby

1. User grants geolocation via their device (works anywhere in the world, no manual location entry); selects a radius.
2. Client `POST`s to `/api/rank` with `{ lat, lng, radiusMiles, allergies, dietaryRestrictions, matchingStrictness }`.
3. Route handler queries `restaurants` (and joined menu/allergen data) from Supabase, then filters to the radius client-side via `/lib/geo.js`'s haversine distance.
4. For each restaurant, `/lib/classification.js` classifies each menu item against the user's profile and matching strictness; `/lib/scoring.js` aggregates those classifications plus evidence quality and data freshness into a Choice Availability Score with an explanation breakdown.
5. Results are returned ranked (distance is a secondary sort only, never a scoring input) and capped client-side to the top 3 ("Choice #1/#2/#3", `TOP_RESULTS_COUNT` in `MapPageClient.js`); the client renders map markers and result cards for those 3, each linking to `/restaurant/[id]`. The restaurant detail page (`ScoreSummary`) shows the qualitative tier badge and explanation but not the raw numeric score — the number still drives sorting/tier internally, it's just not displayed.

## Data flow — live nearby lookup (unscored)

Runs alongside Explore Nearby, independently: `/map` also `POST`s to `/api/nearby-live` with `{ lat, lng, radiusMiles, query? }`, which queries the Google Places API (New) (`/lib/google-places.js` — shared with `scripts/find-restaurant-candidates.js`) for restaurants near that point, regardless of whether they're in the curated dataset. With no `query` (Explore Nearby) it's a Nearby Search, sorted by distance; with a `query` (Find a Dish's craving, e.g. "pizza") it switches to a Text Search instead, so the results are actually relevant to what was typed rather than the same generic nearby list either way — still entirely Google's own ranking, never an AI selection. These render in a visually distinct "More restaurants nearby — not yet verified" section (`UnscoredRestaurantCard`) — no score, no badge, no link to `/restaurant/[id]`, since they aren't Supabase rows, and the list itself is always chosen deterministically by distance — AI is never used to pick, rank, or filter which restaurants appear here. If a candidate has a website, the user can trigger `POST /api/website-lookup` on demand (one click, one restaurant — never run automatically for a list, and never across several restaurants at once), which fetches that page server-side and asks Claude (Anthropic Messages API) to quote — never infer — any allergen/menu text present. In Find a Dish mode, the same button also takes an optional `craving` (`LiveWebsiteLookup`'s `craving` prop, folded into `/lib/website-extraction.js`'s `buildExtractionMessages`) so Claude additionally looks for a matching dish on that one restaurant's site — still a single-restaurant, quote-only read, never a cross-restaurant AI judgment call. The result renders as labeled, quoted, unverified excerpts and is never persisted or scored; see `LIMITATIONS.md` for the trust boundary between this and the curated dataset. Restaurant *discovery* here (Google Places) and allergen-text *reading* (Claude) are deliberately separate concerns handled by separate services — see "Why Google Places, not Overpass" in `DATA_SOURCES.md` for why discovery moved off the earlier free OpenStreetMap approach.

## Data flow — Find a Dish

1. User enters a craving (e.g. "spicy fried rice").
2. Client `POST`s to `/api/search` with the same shape as `/api/rank` plus `{ query }`.
3. `/lib/search.js` deterministically expands the query (normalization, synonym dictionary, in-process trigram similarity) to find exact and related dish name matches across every restaurant within the radius.
4. Matches are classified against the user's profile the same way as Explore Nearby, then ranked by a combination of craving relevance and compatibility; each result links to `/dish/[id]`.
5. Once a craving is typed, the "More restaurants nearby" section (same `/api/nearby-live` + `UnscoredRestaurantCard` pipeline as Explore Nearby) also becomes available, with the craving passed through to each card's on-demand "Check for '{craving}' with AI" button — see "Data flow — live nearby lookup (unscored)" above.

## Data flow — restaurant/dish detail

`/restaurant/[id]` and `/dish/[id]` follow the same page/client-component split as `/map` (a thin `page.js` server wrapper awaiting the route's `params`, plus a `"use client"` component that loads the caller's profile and `POST`s it to the matching API route). `/api/restaurant/[id]` re-runs `classifyDish`/`scoreRestaurant` over just that restaurant's menu and returns a full per-dish breakdown grouped by category (`/lib/group-dishes.js`) client-side. `/api/dish/[id]` goes further than the restaurant route: alongside the personalized classification, it returns every raw evidence row for that dish (all documented allergens/dietary attributes/modifications/cross-contact notes, not just the ones the caller's profile touches) so the page can be fully transparent, plus `/lib/questions.js`'s generated staff questions for whatever gaps remain in the evidence.

## Ranking flow

Documented in full in the build plan (`§9`); implemented in `/lib/scoring.js`, unit-tested in `tests/scoring.test.js`. The score and its plain-language explanation are computed together — the UI never shows a bare number.

## Favorites

Entirely client-side (`localStorage`, `/lib/favorites.js`, mirroring the profile pattern in `/lib/profile.js`) and never touch the server — no accounts means no signed-in favorites path. The `/favorites` page resolves each saved id's display name via the existing public restaurant/dish detail routes (`resolveGuestFavorite` in `FavoritesPageClient.js`), an accepted N+1 tradeoff since N is one guest's favorites list, small by construction.

## External APIs

- **OpenStreetMap** (via Leaflet) — client-side map *rendering* only (see above) — unaffected by the discovery API below; the visual map tiles stay free.
- **Supabase** — database only (the curated dataset), accessed via `@supabase/supabase-js`/`@supabase/ssr` with the public anon key + RLS. No auth usage — this app has no accounts.
- **Google Places API (New)** (`GOOGLE_PLACES_API_KEY`, server-only, paid) — restaurant *discovery* for anything outside the curated dataset, used both dev-time (`scripts/find-restaurant-candidates.js`, helps the curator find restaurants worth researching) and live at runtime (`/api/nearby-live`). Always deterministic (nearest by distance) — never an AI selection. Never writes to the curated dataset itself — see `DATA_SOURCES.md`.
- **Anthropic API** (`ANTHROPIC_API_KEY`, server-only) — one on-demand, manually-triggered use: `/api/website-lookup`, a quote-only read of exactly one restaurant's own site (optionally also looking for one specific craving/dish). Never produces a score, badge, or classification, never picks or ranks across restaurants, and is unrelated to `/lib/classification.js`/`/lib/scoring.js` — see `LIMITATIONS.md`.

## Deployment

- App: Vercel, connected to the GitHub repository, auto-deploying the production branch.
- Database/Auth: Supabase hosted project.
- Environment variables (see `.env.example`) are set in the Vercel project dashboard and in Supabase, never committed to the repo.

## Known technical constraints

_Updated as the project is built — see `LIMITATIONS.md` for the full list._
