# AI Usage Log

This project used Claude (Anthropic) as a development assistant. This log records every meaningful use, per the Congressional App Challenge AI-use disclosure requirements. Entries are added continuously during development, not reconstructed at the end.

For each entry: date, tool, what was asked, what Claude produced, what I (the student) changed or decided, what I tested, and what I learned.

---

## 2026-07-19 — Product concept review and Congressional App Challenge requirements

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** I provided a detailed product concept for an allergy-aware food discovery app, and the full 2026 Congressional App Challenge rules (eligibility, AI-use disclosure requirements, judging criteria, required documentation, submission timeline). Asked Claude to internalize the competition constraints before any building started.

**Assistance provided:** Claude summarized the competition's implications for the build (documentation requirements, AI-disclosure rules, data-sourcing/legal constraints, timeline), and asked clarifying questions rather than assuming a tech stack or data strategy.

**My contribution / decisions:** I made the calls on: solo entry, my own coding background, real-vs-mock location data, and — most substantively — I personally rewrote and significantly expanded Claude's first-draft build plan into a much more precise one: I introduced the seven-value allergen assessment taxonomy (`restaurant_disclosed_contains` / `official_guide_contains` / `ingredient_explicitly_listed` / `possible_based_on_description` / `not_identified_in_available_source` / `restaurant_disclosed_absent` / `unknown`), the matching-strictness system (`standard` / `cautious` / `cross_contact_sensitive`), the decision to manually curate real restaurant/menu data rather than bulk-import via Google Places, and the `item_dietary_attributes` table design separating halal/kosher certification from plain ingredient inference. Claude adopted my plan as the plan of record over its own draft.

**Tested:** N/A (planning only, no code yet).

**What I learned:** Why absence-of-mention can't be treated as evidence of absence for an allergen app, and why Halal/Kosher need a certification-and-preparation model rather than simple ingredient filtering.

**Retained/modified/discarded:** My revised plan was retained in full as `/Users/harshag/.claude/plans/federated-swimming-fountain.md`, superseding Claude's initial draft.

---

## 2026-07-19 — Project scaffolding

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Initial Next.js project setup: framework scaffold, dependency install, folder structure, environment variable template, and this documentation suite.

**Assistance provided:** Claude ran `create-next-app` (App Router, JavaScript, Tailwind CSS v4), installed `@supabase/supabase-js`, `@supabase/ssr`, and `vitest`, created the `/lib`, `/scripts`, `/data/seed`, `/tests`, and route-group folder structure matching the approved plan, wrote `.env.example` with inline comments explaining each variable's security posture, and drafted the initial versions of README.md, ARCHITECTURE.md, DATA_SOURCES.md, TESTING.md, SECURITY_AND_PRIVACY.md, LIMITATIONS.md, THIRD_PARTY.md, and LICENSE.

Claude also read the Next.js 16 docs bundled in `node_modules/next/dist/docs/` before writing any app code, since this Next.js version (16) postdates its training data and has breaking changes (async `params`/`searchParams`, route handler conventions, `fetch` caching defaults, `middleware.js` → `proxy.js`).

**My contribution:** [Fill in as you review the scaffold — e.g., which defaults you changed, which folder names you adjusted.]

**Tested:** [Fill in once `npm run dev` has been run and the default page confirmed loading.]

**What I learned:** [Fill in — e.g., how Next.js App Router route groups `(name)` organize URLs without affecting the path, or how async params work in Next 16.]

**Retained/modified/discarded:** Scaffold retained; documentation stubs will be filled in with real content as each corresponding feature is built, per the plan's Phase 10.

---

## 2026-07-19 — GitHub repo + database schema + Supabase auth + guest mode

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Push the scaffold to a real GitHub repository, design and write the full Postgres schema, and wire up Supabase authentication plus a no-account guest mode.

**Assistance provided:** Claude added the `git@github.com:hgurappadi-lab/Congressional-app-challenge.git` remote and pushed (after I created the repo myself and set my real git commit identity). It wrote `supabase/schema.sql` implementing the table design and evidence/allergen-assessment vocabulary I specified in the plan, using CHECK constraints (not native Postgres enums) so the vocabulary stays easy to extend, plus Row Level Security policies (private `profiles`/`favorites`, public-read/service-role-write everything else). It also wrote the Supabase client helpers (`src/lib/supabase/{client,server,admin}.js`), a `src/proxy.js` session-refresh handler (verified against the actual Next.js 16 docs, not assumed, since `middleware.js` was renamed to `proxy.js` in this version), sign up/in/out pages and an email-confirmation callback route, and `src/lib/profile.js` for localStorage-backed guest profiles.

**My contribution:** Created the real Supabase project (`hgurappadi-lab's Org` / project "Congressional app challenge"), ran `schema.sql` in the SQL Editor, configured the `/auth/callback` redirect URL, and provided the project credentials for `.env.local`. Caught and had Claude fix a real misconfiguration: I initially pasted the REST endpoint URL (`.../rest/v1/`) instead of the bare project URL into `NEXT_PUBLIC_SUPABASE_URL`, which broke every query with a client-side error — fixed by removing the path suffix.

**Tested so far:** All 10 tables confirmed created in the live Supabase project (verified by querying each one). Supabase Auth admin API confirmed working (created and deleted a throwaway test user programmatically). Then did the real end-to-end user journey manually in the browser against the running dev server: signed up with a real email at `/auth/signup`, received the confirmation email, clicked the link, landed on `/home` via `/auth/callback` showing "Signed in as [email]", clicked Sign out, confirmed it returned to guest-mode `/home`. All steps worked as expected — no errors.

**What I learned:** The moved-directory incident (see the 2026-07-19 "Move project off iCloud-synced Desktop" note in this log) plus the REST-URL misconfiguration were both good real debugging reps: reading actual error messages (`PGRST205` "table not found in schema cache" vs. `PGRST125` "invalid path") to distinguish "schema not run yet" from "wrong URL shape" rather than guessing. Also clarified why the service-role key is safe to use in a script but must never ship to the browser (it bypasses every RLS policy in `schema.sql`).

**Retained/modified/discarded:** All retained — this is the first fully live-tested piece of the app.

---

## 2026-07-19 — Moved project off iCloud-synced Desktop folder

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Fix a Finder "Error" state on project files (package.json, src/, supabase/, .git) discovered while trying to open `.env.local`.

**Assistance provided:** Claude diagnosed the cause via `brctl status` — my Mac's iCloud storage was full and Desktop is iCloud-synced, so the CloudDocs daemon was failing to sync project files (including a 1.77GB stuck video upload), which was surfacing as per-file errors in Finder. Risk: git + `node_modules` (thousands of small files) inside a full, actively-failing iCloud sync is a known source of file corruption and broken git state. Claude moved the whole project from `~/Desktop/CAC` to `~/Projects/allergy-food-app` (outside iCloud sync scope) and verified `git status` and `npm run build` both still worked cleanly from the new location before continuing.

**My contribution:** Chose the "move the project" option over freeing iCloud storage or disabling Desktop sync entirely, after Claude laid out the tradeoffs.

**Tested:** `git status` (clean, remote intact), `npm run build` (succeeded) immediately after the move.

**What I learned:** Desktop & Documents iCloud sync can silently interfere with local dev tooling (git, node_modules) well before it's obvious why — the Finder "Error" badges were the only visible symptom until the underlying `brctl status` output showed the actual quota-exceeded sync failure.

**Retained/modified/discarded:** Move retained; project now lives permanently at `~/Projects/allergy-food-app`.

---

## 2026-07-20 — Phase 3: curated pilot dataset (9 restaurants, 41 menu items)

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Build the first curated restaurant/menu dataset (plan §19 step 3), seeded into the live Supabase project.

**Assistance provided:** I gave Claude a reference coordinate (32°58'01.2"N 117°10'18.2"W) and a 15-mile search radius; Claude geocoded it (Torrey Highlands/Rancho del Sol, San Diego 92129, via OpenStreetMap Nominatim) and researched real San Diego-area restaurants within that radius using live web search and page fetches — not invented data. It read official allergen/ingredient sources directly (Chipotle's allergen statement, CAVA's and True Food Kitchen's official PDF allergen guides, In-N-Out's official allergen PDF) and public menu/pricing pages for five independent restaurants (Casa Lahori, Spoon Thai Kitchen, Burma Place, The Shop: Pizza + Cocktails, Sweetgreen), building `data/seed/restaurants.json` and `data/seed/menu-items.json` with per-allergen `evidence_source`/`confidence`/`evidence_note` fields matching the seven-value assessment taxonomy from the plan. It wrote `scripts/seed-restaurants.js` and `scripts/seed-menu-data.js` (idempotent — upsert restaurants/menu_items by id, delete-and-reinsert child evidence rows) plus a small dependency-free `.env.local` loader for running the scripts directly with `node`, then ran both scripts against the live database and verified row counts and a sample relational join.

**My contribution / decisions:** I set the actual geographic scope (initially proposed 20 miles, then tightened to 15 after review) rather than letting Claude pick a neighborhood unprompted. I also set a same-day-only relaxed permission rule for restaurant-research web fetches so Claude didn't have to stop for approval on every individual restaurant page during this research-heavy session.

**Tested:** Verified restaurant and menu item counts in the live Supabase project (9 restaurants, 41 menu items, 375 item_allergens rows, 21 item_dietary_attributes rows, 16 cross_contact_notes rows), and spot-checked a relational query (menu item joined to its restaurant and allergen rows) returning correct, sourced data. Ran `npm run build` afterward to confirm the seed scripts didn't affect the app build.

**What I learned:** Why chain restaurants with published official allergen guides (CAVA and True Food Kitchen in particular have detailed per-item allergen matrices as PDFs) make much stronger evidence sources than independent restaurants' marketing menu descriptions, and how to translate a real restaurant's own "contains X" / "may contain Y" (cross-contact) distinction into the app's `assessment` vs `cross_contact_notes` schema split without collapsing the two.

**Retained/modified/discarded:** All retained. This is a pilot batch (9 of the planned 15–30 restaurants); scaling to the full target and building the onboarding/search/detail-page phases that read this data are still open, per the build plan.

---

## 2026-07-20 — Phase 3 continued: scaled dataset to 20 restaurants

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Scale the curated dataset from the 9-restaurant pilot to 20 restaurants (within the plan's 15–30 target), using the same 15-mile radius and sourcing standards.

**Assistance provided:** Claude researched and added 11 more real restaurants across additional North County San Diego neighborhoods (Mira Mesa, Carmel Valley, Del Mar, Solana Beach, Encinitas) within the same 15-mile radius, geocoding each and pulling real menu items/prices where published. It added two more chains with official allergen documentation (Panera Bread, P.F. Chang's official gluten-free menu) and two restaurants with strong restaurant-level dietary claims (Plant Power Fast Food — 100% vegan; Nectarine Grove — 100% gluten-free), plus seven more independents (Carmel Sushi, Pho Ca Dao & Grill, Indian Tandoor, Aqua Mare Cucina Italiana, Manna Heaven BBQ, Szechuan House, The Fish Market - Del Mar) sourced the same conservative way as the pilot's independents. It appended all new records to the existing `data/seed/*.json` files and re-ran the existing seed scripts (idempotent, so the original 9 restaurants were re-upserted, not duplicated), then verified row counts.

**My contribution / decisions:** I set the target restaurant count (20) for this scaling pass.

**Tested:** Verified 20 restaurants and 74 menu items in the live Supabase project (675 item_allergens rows, 39 item_dietary_attributes rows, 19 cross_contact_notes rows), confirmed every restaurant's coordinates fall within the 15-mile radius via a script-computed distance check, and confirmed no duplicate or dangling IDs across both JSON files before seeding. Ran `npm run build` again afterward.

**What I learned:** A real-world lesson in why "manually curated" data collection matters even with AI assistance — one initially selected candidate restaurant (2Good2B Bakery & Cafe) turned out to have both its San Diego-area locations permanently closed per current Yelp listings, which Claude caught by checking status rather than assuming a search result implied an operating restaurant, and swapped in a currently-open alternative (Nectarine Grove) instead.

**Retained/modified/discarded:** All retained. Dataset is now at 20 of the planned 15–30 restaurants — within target range. Onboarding, search, and detail-page phases that read this data are still open, per the build plan.

---

## 2026-07-20 — Phase 4: onboarding UI (welcome + profile setup)

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Build the required-journey onboarding screens: Welcome and the allergy/dietary-restriction/matching-strictness profile form (plan §17), reusing the existing `src/lib/profile.js` guest/registered storage module from Phase 2.

**Assistance provided:** Claude created `src/lib/profile-options.js` (display metadata for the 9 allergens, 3 severity levels, 7 dietary restrictions, and 3 matching-strictness options — the allergen and dietary-restriction ids deliberately match the exact strings already used in the curated dataset's `item_allergens.allergen` / `item_dietary_attributes.attribute` columns, so later matching logic can compare them directly), `src/app/(onboarding)/welcome/page.js`, and `src/app/(onboarding)/profile/page.js` (a client component that loads an existing guest or signed-in profile, lets the user toggle allergies with a per-allergen severity picker, toggle dietary restrictions, choose matching strictness, shows the persistent safety disclaimer, and saves via the existing `saveGuestProfile`/`saveUserProfile` functions). It also rewired routing: root `/` now redirects to `/welcome`, the post-signup email-confirmation callback now lands on `/profile` instead of `/home`, and `/home` got an "Edit profile" link.

**My contribution:** Confirmed the app works end-to-end by clicking through it myself.

**Tested:** Claude ran `npm run lint` and `npm run build` (both clean, all routes registered), started the dev server, and verified via `curl` that `/welcome` and `/profile` render the expected server-side markup with no server errors in the dev log. Claude does not have browser automation available in this environment (no chromium-cli; the user declined the Claude-in-Chrome extension), so it could not itself click through the interactive form — I did that manually afterward and confirmed the profile flow works correctly.

**What I learned:** Why a coding agent without browser tooling has to be explicit about the difference between "the server renders the right HTML" and "the interactive client-side behavior actually works" — Claude flagged this gap itself rather than claiming the feature was verified.

**Retained/modified/discarded:** All retained. Explore Nearby / Find a Dish still need the core matching algorithms (classification/scoring/evidence), which had not been built yet at this point.

---

## 2026-07-20 — Phase 5 groundwork: classification, evidence, and scoring logic

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Build the deterministic `/lib` matching algorithms (plan §15) that Explore Nearby and Find a Dish both depend on: turning a user's allergy/dietary profile plus a dish's evidence rows into one of the 5 documented compatibility categories, and turning a restaurant's classified menu into a Choice Availability Score.

**Assistance provided:** Claude wrote `src/lib/evidence.js` (the evidence-source → confidence-tier mapping from the plan, plus comparison helpers), `src/lib/classification.js` (`classifyDish()` — evaluates every selected allergen and dietary restriction against a dish's evidence rows, resolves each to a severity level, and returns the single worst-case classification plus plain-language reasons grounded in the actual `evidence_note` text from the curated dataset where available), and `src/lib/scoring.js` (`scoreRestaurant()` — aggregates a restaurant's classified dishes into a 0–100 comparative score, weighting evidence quality per-dish so a restaurant with fewer but better-documented matches can outrank one with more but weakly-documented matches, plus menu-coverage, cross-contact-transparency, and data-freshness factors). It also designed a specific, explainable rule for how a documented modification (free-text, e.g. "can be made without cheese") gets matched to the allergen/dietary restriction it addresses, since the schema doesn't structurally link `modifications` rows to a specific allergen. Wrote `tests/evidence.test.js`, `tests/classification.test.js`, and `tests/scoring.test.js` (32 tests total) covering all 5 classification categories, the documented edge cases already named in this file (no allergens selected, all-unknown evidence, conflicting evidence between a disclosed allergen and a modification, matching-strictness effects for both `cautious` and `cross_contact_sensitive`), and the scoring property from the original product concept (fewer, higher-quality matches outranking more numerous, lower-quality ones).

**My contribution / decisions:** Directed Claude to build this /lib layer before the Explore Nearby UI, since the map/ranking screen has nothing to render without it.

**Tested:** All 32 unit tests pass (`npm test`), `npm run lint` and `npm run build` both clean.

**What I learned:** [Fill in — e.g. how the severity-per-criterion design lets one bad allergen flag a whole dish even when everything else about it looks fine, or how the modification-matching heuristic works.]

**Retained/modified/discarded:** All retained. Explore Nearby (radius search, map, ranked result cards using this scoring/classification logic) is the next open phase.

---

## 2026-07-20 — Phase 5: Explore Nearby

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Build the Explore Nearby journey (plan §5, §17, ARCHITECTURE.md's documented data flow): location + radius input, a live map, and ranked restaurant results using the classification/scoring logic from the previous session.

**Assistance provided:** Claude added `src/lib/geo.js` (haversine distance in miles, unit-tested against known reference distances) and `src/lib/neighborhoods.js` (a small curated list of manual-location fallback options — no live geocoding call is made, consistent with `DATA_SOURCES.md`'s existing commitment that Google APIs are only used for client-side map rendering, not for pulling in new location data). It also extended `classification.js`'s return value with a `confidences` array (the confidence tier behind each assessed criterion) so scoring could represent a dish's evidence quality as the weakest link among what was actually checked. It wrote `src/app/api/rank/route.js` (queries the curated dataset from Supabase with a single nested select, filters to the search radius, runs every menu item through `classifyDish()` against the caller's profile, aggregates each restaurant with `scoreRestaurant()`, and returns results ranked by score with distance as a secondary sort only, per plan §9), `src/components/RestaurantMap.js` (loads the Google Maps JavaScript API via the official `@googlemaps/js-api-loader` package and renders markers — falls back to a plain-text message instead of failing when no API key is configured, so a missing key never blocks the ranked list from working), and `src/app/map/page.js` (the actual Explore Nearby screen: "use my location" with a documented permission-denied fallback to the neighborhood picker, a radius selector, the map, and ranked result cards showing the Choice Availability Score and its plain-language explanation).

**My contribution / decisions:** None yet on this entry — reviewing.

**Tested:** Ran `npm test` (36/36 passing after the `classification.js` change), `npm run lint`, and `npm run build`, all clean. Claude directly load-tested the hardest and most important part — the `/api/rank` endpoint itself — against the live Supabase dataset with `curl`, and caught a real bug this way: an initial test combining a `peanuts` allergy with a `halal` dietary restriction returned a score of 0 for every restaurant, which looked like a bug but turned out to be correct behavior (almost no restaurant in the dataset has halal data, so the missing-halal criterion legitimately drags every result down to "insufficient information," regardless of how well-documented peanuts are). Re-testing with a single allergen in isolation showed the expected ranking (True Food Kitchen and CAVA's official per-item allergen guides scoring highest, restaurants with no peanut-specific data scoring 0), and an isolated halal-only search correctly ranked Casa Lahori highest. Claude did not have browser automation available in this environment, so I click-tested the actual `/map` page myself (location controls, radius selector, ranked cards with scores/badges/explanations all render and update correctly) and confirmed it with a screenshot. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is still not set, so the map itself shows the intended graceful-fallback message rather than a live map; the rest of the page works fully without it.

**What I learned:** Seeing the ranked list live made the score differences click in a way the raw numbers didn't — e.g. CAVA showing 4/100 with "5 dishes require confirmation before ordering" versus Manna Heaven BBQ's 0/100 with the same dish count but no cross-contact documentation at all made the scoring formula's reasoning tangible.

**Retained/modified/discarded:** All retained; the `/map` page is confirmed working. Find a Dish, restaurant/dish detail pages, and favorites are the remaining open phases. A full visual design pass is intentionally deferred until the app's functionality is complete, rather than styling screens that may still change shape.

---

## 2026-07-20 — Phase 6: Find a Dish

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Build the craving-search journey (plan §15, ARCHITECTURE.md's Find a Dish data flow). ARCHITECTURE.md's documented page list has no separate route for this, so Claude added it as a second mode on the existing `/map` page rather than a new page, sharing the same location/radius/profile controls as Explore Nearby.

**Assistance provided:** Claude wrote `src/lib/search.js` — deterministic text normalization, a JS implementation of trigram-set Jaccard similarity (mirroring what the schema's existing `pg_trgm` indexes on `menu_items.name`/`.description` would do via a live Postgres query, but done in-process against the small curated dataset instead, staying a pure/testable function like the rest of `/lib`), and a synonym-group expansion table covering common cravings for the dataset's cuisines (so "bbq" surfaces a "Bulgogi" dish that never uses the word). It refactored the restaurant-fetch query out of `/api/rank` into a shared `src/app/api/_lib/restaurants.js` helper (a Next.js "_"-prefixed folder, excluded from routing) so `/api/rank` and the new `/api/search` route don't duplicate the same Supabase select. `/api/search` ranks matches by a 50/50 combination of craving relevance and profile compatibility (a specific weighting Claude chose and documented in code, since the plan only specifies "a combination" without exact weights). It also added a mode toggle, craving text input (debounced 400ms), and dish-level result cards to the `/map` page, plus a `?mode=find-dish` deep link from `/home`.

**My contribution:** None yet — reviewing.

**Tested:** `npm test` (48/48 passing, 12 new for search.js), `npm run lint`, `npm run build` all clean — lint caught a real bug (`setState` called synchronously inside a `useEffect` for a value that should have been derived at render time instead), which Claude fixed by computing an `effectiveDishResults` value during render rather than storing "cleared" state in an effect. Claude also load-tested `/api/search` directly against the live dataset with `curl`: "spicy fried rice" correctly ranks Szechuan House's "House Special Fried Rice" first, "bbq" surfaces Manna Heaven BBQ's Bulgogi and Pork Belly via synonym expansion even though neither says "bbq", "pizza" returns exact matches, and a nonsense query returns zero results.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained. Restaurant/dish detail pages and favorites are the remaining open phases.
