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

---

## 2026-07-20 — Phase 7: Restaurant detail pages

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Build the restaurant detail page (plan §17): the drill-down from an Explore Nearby result card into a single restaurant's full Choice Availability Score breakdown and categorized menu.

**Assistance provided:** Claude planned the feature in plan mode before writing code (design written to `~/.claude/plans/drifting-giggling-cupcake.md`) and, once approved, added `fetchRestaurantById()` to the shared `src/app/api/_lib/restaurants.js` helper (a server-side `.eq("id", id)` filter rather than reusing the existing `fetchRestaurantsWithEvidence()` and discarding all but one row), a new `POST /api/restaurant/[id]` route handler that runs the restaurant's full menu through the existing `classifyDish()`/`scoreRestaurant()` logic and returns full per-dish detail (not the abbreviated list-view shape `/api/rank` returns), and the page itself (`src/app/restaurant/[id]/page.js` + `RestaurantDetailClient.js`, following the same profile-loading pattern already established in `MapPageClient.js`). While building this, Claude also factored two small pieces out of `MapPageClient.js` that were about to be duplicated a second time: `CLASSIFICATION_LABELS` into `src/lib/classification-labels.js`, and the plan §18 safety-disclaimer paragraph into `src/components/SafetyDisclaimer.js` — both will be reused again by the dish detail page (step 8) and favorites (step 9). Added `src/lib/group-dishes.js` (`groupDishesByCategory()`, the one genuinely new piece of deterministic logic in this step) with unit tests, plus a unit test asserting `CLASSIFICATION_LABELS` stays in sync with the 5 classification values. Wired `/map`'s restaurant cards to actually link to the new page.

**My contribution:** None yet — reviewing.

**Tested:** `npm test` (52/52 passing, 4 new). `npm run lint` and `npm run build` both clean. This session, Claude got real browser automation for the first time (Playwright, driven headlessly via a throwaway driver script — the Claude-in-Chrome extension the user installed previously still isn't exposed as a tool in this environment) and used it to click an actual restaurant card on `/map`, land on `/restaurant/[id]`, and confirm the score/stats/disclaimer/categorized-menu all render correctly — including confirming the score and per-dish reasons actually change when a peanut allergy is set in the profile (score dropped from a documented 90/100 with no profile to 0/100 with peanuts selected, since Manna Heaven BBQ has no peanut-specific evidence). Also drove a fake-UUID URL directly to confirm the 404 case shows a clean "Restaurant not found" state instead of crashing.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained. Dish detail pages and favorites are the remaining open phases.

---

## 2026-07-21 — Phase 8: Dish detail pages + the question generator

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Build dish detail pages (plan §17) and `src/lib/questions.js`, the last unbuilt `/lib` algorithm from plan §15 — the build sequence (§19 step 8) bundles the restaurant-staff question generator into this step rather than treating it separately.

**Assistance provided:** Claude again planned in plan mode first (design written to `~/.claude/plans/drifting-giggling-cupcake.md`, overwriting the completed step 7 plan). It made a small additive change to `classification.js` (exporting two already-existing internal helpers, `label` and `isAddressedByModification`, with no behavior change) so `questions.js` could reuse the exact same modification-matching heuristic rather than duplicating it. It wrote `src/lib/questions.js` (`generateQuestions()` — deterministic templates covering unresolved/unknown allergens, `possible_based_on_description` assessments, confirmed-contains-with-a-documented-modification, the dietary-restriction equivalents, and a general cross-contact question whenever an allergy is selected but no cross-contact notes exist at all) and `src/lib/evidence-labels.js` (plain-language labels for the 7 assessment values, 6 dietary-status values, and 7 evidence-source values stored as raw snake_case DB enums — written carefully against plan §5's "absence of evidence is never proof of absence" rule, e.g. `restaurant_disclosed_absent` is labeled as not guaranteeing freedom from cross-contact, and `not_identified_in_available_source` is labeled as possibly incomplete rather than confirmed-absent). It added `src/app/api/_lib/menu-items.js` (`fetchMenuItemById()` — the first nested Supabase select in this codebase to embed a many-to-one "belongs to" relation, pulling the parent restaurant up through a menu item rather than a list of children down from a parent) and `POST /api/dish/[id]`, which — unlike `/api/restaurant/[id]` — returns every raw evidence row for a dish (not just what the user's profile touches) so the detail page can be fully transparent, each allergen/dietary row tagged with whether it matches the user's selected profile. Built the page itself (`src/app/dish/[id]/page.js` + `DishDetailClient.js`) and wired the two places that reference a dish id but couldn't link anywhere before this step existed: restaurant detail's menu cards and Find a Dish's result cards.

**My contribution:** None yet — reviewing.

**Tested:** `npm test` (73/73 passing, 21 new). `npm run lint` and `npm run build` both clean, all 16 routes registered including the two new dynamic ones. Claude's first unit-test run for `questions.js` caught its own test-writing mistake, not an implementation bug: several "asks nothing" test cases forgot that `generateQuestions` legitimately adds a general cross-contact question whenever any allergy is selected with no cross-contact notes present, so the tests needed to supply notes to isolate what they were actually checking — fixed by adding `crossContactNotes` fixtures rather than changing the (correct) implementation. Playwright-driven browser check: clicked from a restaurant's menu into a dish detail page and confirmed every section renders (personalized classification, all 9 documented allergen rows with the "Selected in your profile" tag correctly appearing only on the peanut row, evidence source/confidence/date on each row, generated questions matching the underlying evidence exactly); also clicked through from a Find a Dish search result to the same page; confirmed a fake-UUID `/dish/<uuid>` shows a clean "Dish not found" state. Specifically verified the one genuinely new Supabase query shape — the many-to-one `restaurants` embed — actually resolved to a usable `{id, name}` rather than an unexpected array shape (it returned a plain object as expected; the defensive array-normalization code path was insurance that turned out not to be needed, left in place since it's cheap and this direction of embed hadn't been exercised in this codebase before).

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained. Favorites (step 9) is the only remaining open MVP phase.

---

## 2026-07-21 — Phase 9: Favorites (last MVP-required feature)

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Build Favorites (plan §17, §20) — the last MVP-required feature before documentation/testing/deployment hardening (steps 10-12).

**Assistance provided:** Claude again planned in plan mode first, driven by a schema constraint that shapes the whole feature: `favorites.user_id` is `NOT NULL` with RLS scoping every row to `auth.uid()`, so a favorites row literally cannot exist without a signed-in user — guest favorites had to be entirely client-side, mirroring `src/lib/profile.js`'s existing guest-storage pattern exactly. It wrote `src/lib/favorites.js` (guest localStorage I/O plus pure, unit-tested array helpers for idempotent add/remove/toggle, and `mergeFavoritesWithTargets()` — since `favorites.target_id` has no foreign key to `restaurants`/`menu_items`, unlike every previous nested-select in this codebase, so listing a user's favorites with real names requires a separate lookup query merged back in by id rather than an automatic join), `src/app/api/_lib/favorite-targets.js` (the two bulk lookup queries), and `src/app/api/favorites/route.js` — the first auth-gated route in this codebase (`GET`/`POST`/`DELETE`, all requiring `supabase.auth.getUser()` to succeed, returning an explicit 401 rather than relying on RLS to fail silently; `POST` uses `.upsert()` against the table's existing unique constraint to make favoriting idempotent). It built `src/components/FavoriteButton.js` (a reusable toggle, dropped into the two placeholder comments left in steps 7-8 of `RestaurantDetailClient.js`/`DishDetailClient.js`) and `src/app/favorites/page.js` + `FavoritesPageClient.js`, which for guest users resolves display names by calling the existing public `/api/restaurant/[id]`/`/api/dish/[id]` routes rather than building a new bulk-lookup endpoint (an accepted N+1 tradeoff, since N is one guest's favorites list). Added a "View saved favorites" link to `/home`, which was otherwise the only way to reach the new page.

**My contribution:** None yet — reviewing.

**Tested:** `npm test` (85/85 passing, 12 new). `npm run lint` and `npm run build` both clean, all 18 routes registered. Verification here went further than prior phases because this was the first feature with genuinely different behavior for guest vs. signed-in users, and the first server-side auth check in the app: curl-tested `GET`/`POST`/`DELETE /api/favorites` with no session cookie and confirmed all three return a clean `401` rather than a 500 or a silent empty response. For the signed-in path, rather than requiring email-confirmation click-through (which an automated browser session can't complete without inbox access), Claude used the same Supabase admin client already trusted by this repo's seed scripts (`scripts/lib/supabase-admin.js`, service-role key) to create and later delete a scratch pre-confirmed test account outside the app's own signup flow, then drove the real UI against it with Playwright — confirmed real `POST`/`GET`/`DELETE` network calls to `/api/favorites` (not just React state), a restaurant favorite appearing on `/favorites`, and removal persisting after a reload. Separately verified the guest path end-to-end (save on a restaurant page → survives a reload → appears on `/favorites` with its dish counterpart correctly showing the parent restaurant's name → remove persists after reload) starting from an explicitly cleared `localStorage`, and confirmed the empty-state message renders correctly for a fresh guest.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained. All MVP-required features (plan §20) are now built — steps 10-12 (documentation, full testing pass, deployment hardening) are what's left before submission.

---

## 2026-07-21 — Start of Phase 10-12: full regression, cross-browser, mobile, and accessibility pass

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Before starting documentation/deployment work (plan §21's "before Oct 15" testing requirements), verify the whole app end-to-end after five phases of feature work landed back-to-back, and do a first automated pass at the mobile/accessibility/browser-testing gaps `TESTING.md` had flagged as outstanding since Phase 1.

**Assistance provided:** Claude wrote a 20-check Playwright regression script covering the entire primary journey in one run (root redirect → guest → profile → Explore Nearby → restaurant detail → dish detail → favorite toggle → Find a Dish → favorites page → both 404 states) and ran it clean. It then installed Firefox and WebKit browser engines (previously only Chromium was available in this environment) and re-ran the same journey across all three engines plus a 390×844 mobile viewport — 24/24 checks passed, zero unexpected console errors. It injected `axe-core` (via CDN, no new dependency added to the repo) into all 7 primary-journey pages and found one real, critical-impact WCAG violation: the per-allergen severity `<select>` on `/profile` had no accessible name. Claude fixed it directly (`aria-label={\`${allergen.label} severity\`}`) and re-ran the scan to confirm zero violations remain. Filled in `TESTING.md`'s previously-placeholder Mobile/Accessibility/Browser-testing/Integration-tests sections with these real findings, including what's still only automated-proxy-tested and would benefit from a genuine manual pass (real device, real screen reader, real browser installs) before the Oct 15 deadline.

**My contribution:** None yet — reviewing.

**Tested:** `npm test` (85/85, unchanged — this pass found a UI bug unit tests can't catch, not a logic bug), `npm run lint` clean after the fix. This is the first phase where Claude proactively went looking for problems across the whole app rather than verifying one new feature in isolation, and the accessibility scan is the first time an automated tool (not manual reasoning) caught something a careful read-through of the code missed.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** The `aria-label` fix retained. Everything else was verification, not new code.

---

## 2026-07-21 — Account deletion (plan §16 privacy requirement)

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** `SECURITY_AND_PRIVACY.md` had a "to be implemented" gap for user account deletion, which plan §16 requires at minimum as "data-deletion instructions." The user chose to build a real self-service delete button rather than just document a manual process.

**Assistance provided:** Claude added `DELETE /api/account`, using `src/lib/supabase/admin.js` — a service-role admin client that already existed in the repo (scaffolded but unused until now, with a comment specifically anticipating "a privileged Route Handler that has its own explicit authorization check"). The route confirms the caller's identity via their own cookie-scoped session first (never a client-supplied id, so it can only ever delete the caller's own account), then uses the admin client to delete the underlying Supabase Auth user — a regular RLS-scoped client can't delete an `auth.users` row, only the admin API can. Both `profiles` and `favorites` already have `on delete cascade` FKs to `auth.users(id)` (`supabase/schema.sql`), so no separate cleanup queries were needed — deleting the auth user removes everything. Added a "Delete my account" button to `/profile` (signed-in users only, behind a `window.confirm()` prompt) and updated `SECURITY_AND_PRIVACY.md`'s placeholder section to describe the real behavior.

**My contribution:** User decided to build a real feature here rather than just write instructions, when given the choice.

**Tested:** `npm test` (85/85, unchanged — no new pure logic), `npm run lint`/`npm run build` clean. Curl-tested the unauthenticated case: `DELETE /api/account` with no session returns the expected `401`. For the real deletion path, reused the same scratch-account technique from the Favorites phase (created via `scripts/lib/supabase-admin.js`'s admin client) — signed in with Playwright, clicked "Delete my account," confirmed the dialog, landed on `/welcome`, then attempted to sign in again with the same credentials and got "Invalid login credentials" — proof the account was actually deleted from Supabase Auth, not just signed out client-side.

**What I learned:** [Fill in.]

---

## 2026-07-21 — Full visual/information-hierarchy redesign (ui-ux-pro-max)

**Tool:** Claude (Sonnet 5, via Claude Code, using the `ui-ux-pro-max` skill)

**Purpose:** All MVP functionality was done; this was the dedicated design pass deferred since Phase 2 (styling had deliberately stayed plain default Tailwind/zinc so early screens wouldn't need rework mid-build). The user supplied an exhaustive design spec — exact hex palette, type scale, spacing, a 5-way status-color mapping, and a page-by-page progressive-disclosure requirement ("show the conclusion first, the reason second, evidence only on request") — and asked for a page-by-page review/plan before any files changed.

**Assistance provided:** Claude reviewed every existing page, listed where excessive evidence was dumped onto compact cards (full bullet-list `explanation`/`reasons` arrays, always-expanded per-allergen assessments mixing selected/unselected allergens, a medical-wording severity picker that `classification.js` already documented as unused in scoring), then wrote a plan (`~/.claude/plans/moonlit-growing-conway.md`) enumerating 4 small, additive, explicitly-flagged business-logic touches before implementing: (1) `classifyDish()` now also returns a `criteria` array — the per-criterion detail it already computed internally but discarded, exposed so cards can show accurate "3 unknown"/"Milk identified" badges without parsing `reasons` strings; (2) `/api/search` and `/api/restaurant/[id]` pass `criteria` through (additive field only); (3) all three ranking/search/detail routes gained an additive `evidenceHighlight` field, read off already-fetched `item_allergens[].evidence_source`, for the one evidence-quality badge per card; (4) `profile-options.js`'s matching-strictness labels were reworded to "Standard caution"/"Extra cautious"/"Cross-contact sensitive" (ids unchanged — a DB `CHECK` constraint depends on them) and the unused per-allergen severity picker was dropped from the UI. Everything else was presentation-layer: new Tailwind v4 `@theme` tokens replacing Geist/zinc/dark-mode entirely (light theme only, per the spec), Inter via `next/font/google`, `lucide-react` added for icons, a new `design-system/MASTER.md`, a `src/lib/result-summary.js` module of pure presentation helpers (unit-tested), and 16 new reusable components (`StatusBadge`, `RestaurantResultCard`, `DishResultCard`, `AllergenAssessmentRow`, `ScoreSummary`, `QuestionChecklist`, etc.) that every page was rebuilt on top of, staged in the order the user asked for (globals → cards → Home → Profile → Explore/Find a Dish → restaurant detail → dish detail → Favorites).

**My contribution:** None yet — reviewing.

**Tested:** `npm test` (92/92 — 7 new `result-summary.js` tests, everything else unchanged), `npm run lint`/`npm run build` clean across all 17 routes. Installed Playwright as a devDependency (the Chrome extension wasn't connected in this session) and drove the full guest journey — welcome → profile → home → Explore Nearby → restaurant detail → dish detail → Find a Dish → favorites — at both a 1280px desktop and a 390px mobile viewport, with zero console/page errors. Verified every new expandable (`ExpandableExplanation`, the dish-detail collapsible sections, individual allergen rows) toggles `aria-expanded` correctly and is keyboard-operable (tested via `.focus()` + `Enter`, not just click). The mobile pass caught one real bug the desktop pass didn't: the neighborhood `<select>`'s long option text pushed the page to 441px wide inside a 390px viewport (horizontal scroll) — fixed by stacking that control to full width below `sm:`, re-verified `scrollWidth === clientWidth` afterward. Also confirmed a `fullPage` Playwright screenshot appearing to show the sticky mobile "Save profile" bar floating mid-page was a screenshot-only artifact of capturing `position: fixed` content beyond the viewport, not a real bug — a viewport-only screenshot while scrolled confirmed it stays correctly pinned to the bottom.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained. Favorites intentionally does *not* reuse `RestaurantResultCard`/`DishResultCard` — both the guest-favorite lookup and the signed-in `/api/favorites` list use a stub/no profile, so a classification badge there would show results unrelated to the user's real allergies; kept as a simpler, honestly-scoped name+link+remove card instead.

---

## 2026-07-21 — Add Plumeria Vegetarian Restaurant to the curated dataset

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** The user asked to add "Plumeria Vegetarian Thai" to the restaurant list.

**Assistance provided:** Claude searched for and identified the real restaurant — its actual name is "Plumeria Vegetarian Restaurant" (myplumeria.com), 4661 Park Blvd, San Diego, CA 92116 (University Heights), an all-vegetarian/vegan Thai kitchen. Computed its distance from the dataset's reference point using the app's own `haversineDistanceMiles()`: ~14.2 miles, inside the dataset's documented 15-mile radius but near the edge (only surfaces when a user selects the widest, 15 mi, search radius). Confirmed via a very recently updated Yelp listing that it's still operating. The restaurant's own menu page (myplumeria.com/menu/) 404'd during collection, so the 4 menu items added (Somtom, Thai Salad, Special Coconut Crispy Rice Salad, Pineapple Fried Rice) were sourced from a third-party ordering aggregator (res-pick.com) that reproduces the restaurant's real posted menu text, prices, and dietary tags — recorded as `official_menu_description` evidence at `medium` (not `high`) confidence specifically because it's a once-removed reproduction rather than the primary site. Every allergen the restaurant's own description doesn't name (e.g. milk, eggs, wheat) was recorded as `unknown`/`insufficient`, per the existing convention of enumerating all 9 tracked allergens per dish rather than only the ones with evidence. Also pulled a genuine quote from the restaurant's own root website ("our kitchen is not gluten-free, and we cannot guarantee that any menu items are free from gluten cross-contamination") and added it as the dataset's first *restaurant-level* cross-contact note — `cross_contact_notes.restaurant_id` already existed in the schema and was already read by every route, but no prior seed data had used it (only per-dish notes existed until now), so `scripts/seed-restaurants.js` was extended with a small, additive insert step for it (cleared/re-inserted per run, same idempotent pattern as the existing per-dish seeding in `seed-menu-data.js`). Updated `DATA_SOURCES.md`'s dataset-scope section and restaurant table to match.

**My contribution:** None yet — reviewing.

**Tested:** Ran `node scripts/seed-restaurants.js` and `node scripts/seed-menu-data.js` against the live Supabase project (both idempotent/safe to re-run, per their existing design). Caught one real mistake this way: the cross-contact note's `evidence_source` was initially set to a value (`official_restaurant_website`) that isn't in the `cross_contact_notes` table's `CHECK` constraint — Postgres rejected the insert with a clear `23514` constraint-violation error, which was fixed to the correct existing enum value (`official_menu_description`) and re-run successfully. Curl-verified `/api/rank` with a peanut allergy at a 15 mi radius: Plumeria appears at 14.2 mi with 3 of its 4 dishes correctly flagged `allergen_identified` (the 3 dishes whose descriptions name peanuts) and the 4th correctly `insufficient_information` (peanuts aren't addressed either way for that one). Curl-verified `/api/dish/[id]` for the Pineapple Fried Rice with a tree-nut allergy + vegan restriction: correctly `allergen_identified` (cashews named) with `vegan: confirmed by the restaurant` also present. Screenshotted the live restaurant detail page in a browser to confirm it renders correctly end-to-end. `npm test` (92/92, unchanged — this was data, not logic), `npm run lint` clean.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained.

---

## 2026-07-23 — Profile shortcut bug, honest "no match" empty state, scoring fix, and CAVA/Chipotle vegan data

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Follow-up from adding the profile shortcut pill: the user set their profile to vegan-only (no allergies) and the pill still read "Set your allergies," and separately asked why Explore Nearby was showing restaurants with no real vegan match at all, and why CAVA/Chipotle — which the user has personally verified are vegan/vegetarian-friendly — weren't showing up or reading that way.

**Assistance provided:** Three fixes: (1) `ProfileShortcut.js` only ever read `profile.allergies`, never `profile.dietary_restrictions` — a real bug (present since the component was built) that made a vegan-only or vegetarian-only profile look unset. Fixed to combine both into the same compact list, matching what `ProfileSummary` already did correctly elsewhere. (2) Investigated the Explore Nearby complaint directly against the live API rather than guessing: at the user's 5 mi radius, every nearby restaurant had zero dishes classified as an actual match (`strong_documented_potential_match`/`modification_needed`/`confirm_before_ordering`) for a vegan profile — everything was "no data" or a confirmed conflict — yet the UI still displayed them as a ranked list. Added a `hasAnyRealMatch` check in `MapPageClient.js` so that when literally nothing in range has a real candidate, the page shows a plain "No options in the dataset match your profile here" empty state instead of a list that reads as options but isn't. Also found the reason CAVA (5.3 mi) and Chipotle (5.2 mi) never appeared in a 5 mi search: pure geography — both are just outside the radius, confirmed by direct distance query, not a data or ranking bug. (3) Since the user has personally verified CAVA/Chipotle's vegan/vegetarian friendliness, researched both chains' official ingredient/allergen sourcing and cross-referenced third-party vegan-ordering guides (godairyfree.org, PETA) to add real, sourced data: added Chipotle's well-documented "Sofritas Vegan Bowl" (no cheese/sour cream, same official allergen-guide sourcing as its other items) as a new menu item, and added `vegan` dietary_attributes to CAVA's existing Harissa Avocado Bowl and Falafel Crunch Bowl — recorded as `student_analysis_of_public_description` (not `official_allergen_guide`) since CAVA's own site doesn't itself label these specific combinations vegan, only its individual ingredients. Also separately noticed and fixed a real scoring gap while investigating: `scoreRestaurant()`'s point weights treated `insufficient_information` (no data either way) and `allergen_identified` (confirmed conflict) identically at 0 points, and the weighting formula multiplied even that by a confidence factor that's always 0 for "insufficient," silently erasing any distinction — fixed so restaurants with a confirmed conflict now correctly rank below ones that are simply undocumented, without touching `ALLERGEN_IDENTIFIED`'s floor.

**My contribution:** None yet — reviewing.

**Tested:** `npm test` (92/92, unchanged for the UI/data fixes; `scoring.test.js` unaffected — no test asserted the old 0-vs-0 tie behavior). `npm run lint`/`npm run build` clean. Re-seeded live Supabase via `scripts/seed-menu-data.js` and curl-verified the before/after: Chipotle's vegan score at 15 mi went from 36 to 48 (2 strong matches instead of 1), CAVA's classification counts shifted from all-insufficient to 2 confirm-before-ordering dishes. Playwright-verified the profile pill now shows "Vegan" instead of "Set your allergies," and reproduced both the exact "no real match anywhere" scenario (peanuts+eggs+soy+sesame at 5 mi, all 5 restaurants previously tied at 0) to confirm the new empty state renders, and a scenario where at least one restaurant has a real (if weak) candidate to confirm the ranked list still shows correctly in that case rather than over-triggering the empty state.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained.

---

## 2026-07-23 — Dietary-attribute completeness pass across the whole dataset

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** The user found a concrete bug: with their profile set to vegetarian, "Salt & Pepper Chicken Wings" showed as "Insufficient information" instead of correctly flagging that chicken isn't vegetarian — the dish simply had no `vegetarian` row recorded at all, despite "chicken" being right in its name. The user asked for this fixed generally (name-based meat/veg/vegan/GF detection), not just for the one dish shown.

**Assistance provided:** Rather than patch the single example, Claude wrote a one-time Python pass over all 79 menu items' name+description text and applied a conservative, word-boundary keyword rule, filling in *only* missing dietary_attributes rows (never touching ones already curated): unambiguous meat/poultry/seafood words → `vegetarian`/`vegan`: `not_compatible`; dairy/egg words with no meat present → `vegan`: `not_compatible` only; explicit "vegan"/"vegetarian"/"veggie" wording → the matching positive attribute; a "GF " name prefix or "gluten-free" wording → `gluten_free`: `restaurant_confirmed`. This caught the reported bug plus 49 other items with the same gap, including 3 P.F. Chang's items and a True Food Kitchen pizza whose names literally start with "GF" but had never had a `gluten_free` attribute recorded at all. Deliberately left alone anything not obvious from the name/description itself — Caesar dressings' commonly-unstated anchovy content, dishes where a protein is described as "optional" — rather than assume either way, since that's outside knowledge, not what's actually published. Explicitly scoped down the user's second ask (checking each restaurant's real online menu for printed veg/vegan/GF symbols) rather than silently skipping it — that's a much larger per-restaurant research task (21 restaurants) not attempted in this pass.

**My contribution:** None yet — reviewing.

**Tested:** Before writing to Supabase, ran a script-level review of every proposed change and caught 2 real false positives from an earlier, cruder version of the keyword pass: "Special Coconut Crispy Rice Salad" (soy-based *mock* chicken — a plant-based protein, incorrectly flagged as containing real meat) and "Kale Caesar" ("chicken optional" — meaning the base dish has none by default). Both were corrected before seeding. Also ran an automated consistency check across the full dataset for a specific logical contradiction (an item marked vegan-compatible while also marked `vegetarian: not_compatible`, which is impossible since vegan implies vegetarian) — zero found after the fixes. `npm test` (92/92, unchanged — pure data), `npm run lint`/`npm run build` clean. Re-seeded live Supabase (`item_dietary_attributes` rows went from 49 to 136) and curl-verified the exact reported dish: Salt & Pepper Chicken Wings now returns `classification: allergen_identified` with `vegetarian: this dish is not compatible` for a vegetarian profile, confirmed again with a full Playwright screenshot of the restaurant page.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained.

---

## 2026-07-23 — Restaurant detail redesign, Google Maps link, and vegan-implies-vegetarian fix

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** The user shared a reference screenshot for the restaurant detail page and asked for it applied everywhere (minus per-dish images, which the user explicitly deferred after a scoping question about licensing/sourcing), plus a Google Maps link for the address, plus a specific classification fix: a dish documented as vegan should count as a vegetarian match too, but not the reverse.

**Assistance provided:** Redesigned `RestaurantDetailClient.js` (applies to every restaurant, since it's one shared component) — chevron back button, serif restaurant name, address linking to a Google Maps search URL built from the stored address (no new geocoding call), website link with icon, a decorated safety-disclaimer box and a two-column `ScoreSummary` with checkmark-bulleted factors (both shared components, so restaurant/dish detail pages get the improvement together), and small icons per menu-category heading. For the vegan/vegetarian fix, added a shared `findDietaryEvidence()` helper in `classification.js` (also reused by `questions.js`, per that file's existing "logic can't diverge" convention) that falls back to a dish's `vegan` evidence when checking `vegetarian` and none exists directly — but only when the vegan evidence is itself positive (`restaurant_confirmed`/`possible`/etc.), never when it's `not_compatible`, since a vegan disqualifier (dairy, egg) says nothing about whether a dish separately contains meat.

**My contribution:** None yet — reviewing.

**Tested:** Caught a real bug in my own first pass while testing: the initial fallback returned *any* vegan row regardless of status, so a dish marked vegan `not_compatible` (e.g. containing dairy) was incorrectly read as also disqualifying vegetarian — fixed before it shipped, with a unit test added specifically for that case ("a dish marked not-vegan is NOT thereby marked not-vegetarian") alongside the positive-inference tests. `npm test` (96/96), `npm run lint`/`npm run build` clean. Playwright-verified the exact restaurant from the user's reference screenshot end-to-end: matching "5/100" score, "Egg Rolls: Insufficient information" outcome (unaffected by the fix, correctly), and confirmed the Google Maps link's `href` resolves to a correct address-based search URL.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained.

---

## 2026-07-23/24 — Free interactive map (Leaflet + OpenStreetMap, replacing Google Maps)

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** The map had never been usable in practice — `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` was left empty since setting it up requires a Google Cloud billing account. The user asked how to add a working map "for free," and after discussing the tradeoff (Google Maps needs billing even though it stays within the free tier at this app's scale; Leaflet + OpenStreetMap needs no key or account at all, at the cost of a less polished look), chose the free option.

**Assistance provided:** Replaced `@googlemaps/js-api-loader` with `leaflet` in `src/components/RestaurantMap.js` — OpenStreetMap raster tiles (with the attribution its tile-usage policy requires, which Leaflet shows by default), and restaurant markers built as inline-SVG pins in the app's brand green rather than Leaflet's default marker images (which don't resolve correctly under Next.js/Turbopack bundling without extra webpack config). Removed the "no API key configured" fallback UI entirely — nothing to configure. Updated `ARCHITECTURE.md`, `THIRD_PARTY.md`, `SECURITY_AND_PRIVACY.md`, `DATA_SOURCES.md`, `README.md`, and `.env.example` to describe the new provider and remove the now-nonexistent API key variable.

**My contribution:** None yet — reviewing.

**Tested:** This took real debugging, not just a swap-and-ship. First found a genuine bug: the map mounted while hidden behind the mobile Map/List toggle (`display:none`, zero size), leaving tiles rendered wrong even after becoming visible — fixed by having `MapPageClient` only mount `RestaurantMap` once its container will actually be visible (tracked via a `matchMedia` breakpoint check for desktop, or the mobile toggle state), rather than CSS-hiding an already-mounted map. Second, chased what looked like a marker-position bug for a while (a marker's `boundingBox()` consistently fell outside the visible container) before realizing it wasn't a bug at all: a fixed `zoom: 12` doesn't guarantee every restaurant marker fits within a short 256px mobile map height — some legitimately projected outside the visible area. Fixed properly with `fitBounds()` (capped at `maxZoom: 15`) so the map always frames whatever markers are currently shown, instead of a fixed zoom level. Verified via Playwright: real OpenStreetMap tiles load (12+ tile requests succeed), all 5 markers land within the visible container bounds on both a 390px mobile viewport and 1200px desktop, and clicking a marker on mobile correctly opens the bottom-sheet restaurant preview. `npm test` (96/96, unaffected — this was UI-only), `npm run lint`/`npm run build` clean.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained.

---

## 2026-07-24 — Chipotle egg confidence fix, and a simpler Explore Nearby card

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Two follow-ups. First, the user pointed out Chipotle was showing "confirm eggs before ordering" even though Chipotle's own public allergen statement explicitly says it doesn't use eggs at all. Second, the compact restaurant cards on Explore Nearby still read as too text-heavy even after the earlier redesign passes.

**Assistance provided:** Traced the egg issue to the data, not the classification logic: every Chipotle item's "eggs" row was `restaurant_disclosed_absent` at `medium` confidence, and `classification.js`'s `evaluateAllergen()` only treats a disclosed-absent claim as a clear match (not "needs confirmation") when confidence is `high`. Checked the underlying evidence — Chipotle's own statement ("We do not use eggs, mustard, peanuts, tree nuts, sesame, shellfish, or fish as ingredients") is an explicit, company-wide published claim, about as strong as evidence gets — and raised confidence from `medium` to `high` for that exact claim across all 5 Chipotle items and all 6 allergens it actually covers (eggs, tree_nuts, peanuts, sesame, fish, shellfish) — 30 rows total, found via two passes since the note text was phrased slightly differently across items ("We do not use..." vs "does not use..."). Left `soy`/`wheat` untouched — those are item-specific claims (some Chipotle items do contain soy/wheat), not part of the blanket statement, so their confidence correctly stays contextual. Separately, further simplified `RestaurantResultCard.js` per the user's "click it to see everything" direction: dropped the 1–2 sentence explanation, the up-to-4 badges, and the inline "Why this score?" expansion from the compact card entirely, leaving just name, distance, cuisine, one status badge, and "View restaurant" — all the removed detail is still on the restaurant detail page, nothing lost, just moved behind the click-through.

**My contribution:** None yet — reviewing.

**Tested:** `npm test` (96/96, unaffected — pure data), `npm run lint`/`npm run build` clean. Re-seeded live Supabase and curl-verified: Sofritas Burrito with an egg allergy now classifies `strong_documented_potential_match` (was `confirm_before_ordering`), and Chipotle's overall score for an egg-only profile jumped from 36 to 96 (all 5 dishes now strong matches, zero needing confirmation). Screenshotted the simplified Explore Nearby cards to confirm the shorter layout reads cleanly at both the "top pick" highlighted state and normal state.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained.

---

## 2026-07-24 — Cut unnecessary text: dish detail simplification and "Recommended for you" menus

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** The user shared two more screenshots and asked for a broader simplicity pass: (1) on the dish detail page, hide any allergen/dietary row with literally no documented information instead of showing a placeholder, and cut the page down to essentially allergy checks, sources/dates, and the safety warning; (2) on restaurant pages, stop dumping every dish (including all the "insufficient information" ones) into one list — instead recommend the single best dish, highlight it, and make clear it's "not 100%." The user also asked, more generally, to cut unnecessary/repetitive text sitewide, with one explicit exception: keep the safety warning repeated everywhere it already appears.

**Assistance provided:** In `DishDetailClient.js`, merged the allergen and dietary-restriction assessments into one selected/other pair and filtered out any row with `assessment`/`status: "unknown"` — no more "no assessment available" placeholders. Removed the standalone always-rendered "Dietary fit" section (folded into the merged lists) and made "Available modifications" and "Cross-contact" conditional on having at least one real entry. Rewrote `DishResultCard.js` down to name/meta/one status badge/"View details" (matching the shape `RestaurantResultCard.js` already had), adding a `highlight` prop with a "Best match here" badge. Added `getRecommendedDishes()` to `src/lib/result-summary.js` (dishes classified as strong match / modification needed / confirm-before-ordering, best-first) and used it in both `RestaurantDetailClient.js` (restaurant menu → "Recommended for you" up to 3, plus a collapsed-by-default "See full menu" with everything grouped by category) and `MapPageClient.js`'s Find a Dish mode (same pattern, up to 5, collapsed "See more results" for the rest, since a craving search spans many restaurants). Both recommended sections show a `SafetyReminder` line as the "not 100%" caveat. Nothing is deleted — every dish and every evidence field is still reachable, just not shown by default when it's undocumented. Documented both changes in a new `design-system/pages/dish-and-restaurant-detail.md` and corrected an outdated note in `explore-nearby.md` that no longer matched `DishResultCard.js`.

**My contribution:** None yet — reviewing.

**Tested:** `npm test` (96/96), `npm run lint`/`npm run build` clean. Playwright-verified end-to-end on a guest profile with an egg allergy: the dish detail page for "Egg Rolls" (Pho Ca Dao & Grill) now shows only "Your allergy checks" (Eggs), "Other allergen information," "Questions to ask," and "Sources and dates" — no empty-placeholder sections. The restaurant page shows "Recommended for you" with Egg Rolls highlighted as "Best match here," and a collapsed "See full menu (3 items)" that expands to the full category-grouped list including the two insufficient-information noodle dishes. Also verified Find a Dish separately: searching "pho" (no real match for an egg profile) correctly shows an empty-state message plus a collapsed "See more results (2)"; searching "chicken" at a 15-mile radius correctly highlights Chipotle's "Chicken Burrito Bowl" as a strong documented match above 4 confirm-before-ordering dishes, with a "See more results (7)" toggle for the rest. No console errors in any of the four scenarios.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained.

---

## 2026-08-03 — Find a Dish ranking bug and cuisine-diversity dataset expansion

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** The user reported that searching "spicy fried rice" on the live site surfaced "True Crisp'd Air Fried French Fries" as the top "Best match," with the two actual fried-rice dishes in the dataset nowhere near the top. Their initial theory was that the dataset just needed more restaurants/cuisines to match against.

**Assistance provided:** Before acting on that theory, ran the actual `searchMenuItems()` text-relevance function directly against the dataset and found it already ranked the real fried-rice dishes highest on pure text relevance — so the bug wasn't a data gap, it was in `/api/search/route.js`'s final ranking. `combinedScore` there was `relevance*0.5 + compatibilityWeight*0.5` (additive): True Food Kitchen's fries have every one of 9 allergens marked `restaurant_disclosed_absent` at high confidence, so they always score a perfect 1.0 compatibility for any allergy profile, while the fried-rice dishes' sparser evidence caps them at 0.2–0.4 — enough for the well-documented-but-irrelevant fries (relevance 0.12) to outscore the on-topic dishes (relevance 0.45) for essentially any allergy selection. Presented this finding plus a fix (change to `relevance*(0.5 + 0.5*compatibility)`, multiplicative — compatibility can no longer promote a near-zero-relevance dish to the top, but still reorders dishes of similar relevance by safety) via AskUserQuestion; the user chose to do both the ranking fix and the dataset expansion. Verified the fix with a scratch vitest script simulating the real route logic against the live dataset for multiple allergy profiles before/after (deleted after use, not committed). Then added 6 real, currently-open San Diego-area restaurants chosen specifically to fill cuisine gaps that were producing dead-end searches (no "ramen," "poke," or "gyro" results existed at all before this): HiroNori Craft Ramen, Phil's BBQ - Rancho Bernardo, Poke Chop, Kusina San Diego (Filipino), Spiro's Mediterranean Cuisine (Greek), and Emerald Chinese Cuisine (Cantonese/dim sum, including a real Shrimp Fried Rice item) — full sourcing detail per restaurant in `DATA_SOURCES.md`. While verifying, also found and fixed that Poke Chop's own bowls didn't say "poke" anywhere, so a literal "poke" search returned zero results despite the restaurant existing — relabeled its 4 poke-bowl items' `category` field from generic `"bowl"` to `"poke bowl"` (a factually accurate categorization, not a change to the sourced menu description text).

**My contribution:** [Fill in as you review — e.g. whether the multiplicative formula is the right long-term fix, or a different rebalancing.]

**Tested:** `npm test` (96/96 passing, unaffected — algorithm change has no dedicated unit test yet), `npm run lint` clean. Verified via scratch vitest scripts (not committed) that "spicy fried rice," "ramen," "poke," and "gyro" all now surface relevant dishes at or near the top for a sample allergy profile, both before/after comparisons for the ranking fix and a final check against the full 27-restaurant dataset. Not yet re-seeded to Supabase or pushed — the user explicitly asked to review the data changes first before they go live.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained, pending user review.

---

## 2026-08-03 — One more Thai restaurant

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Follow-up to the ranking/dataset session above — the user asked for one more restaurant, specifically Thai.

**Assistance provided:** Researched Spices Thai Kitchen (3810 Valley Centre Dr, Carmel Valley) — operating since 1994, 652 Yelp reviews as of July 2026 confirming it's still open, ~3.9 mi from the reference point. Found its full official PDF menu on its own site (`spicesthaikitchendelmar.com`) and added 4 items with real prices and descriptions: Pad Thai Noodles (Chicken), Thai Fried Rice (Tofu), Green Curry (Chicken), and Thai Spring Rolls. For the Green Curry's coconut-based sauce, checked how the existing dataset handled the same situation (Spoon Thai Kitchen's Panang Curry, also coconut-based) before writing anything — that item correctly leaves both `milk` and `tree_nuts` as `unknown`/`insufficient` rather than treating coconut milk as a dairy allergen, since coconut isn't dairy and isn't reliably a tree-nut cross-reactor either; matched that same convention here instead of inventing a new one. Coordinates came from OpenStreetMap Nominatim geocoding the exact street address (building-level match), the same method used earlier in this session for Spiro's Mediterranean Cuisine, with a `location_note` disclosing it.

**My contribution:** [Fill in as you review.]

**Tested:** `npm test` (96/96), `npm run lint` clean, referential integrity confirmed (every menu item's `restaurant_id` resolves to a real restaurant). Not yet re-seeded to Supabase or pushed.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained, pending user review.

---

## 2026-08-04 — Top up every restaurant's menu depth

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** The user asked to add 5 more menu items for every restaurant currently in the dataset (28 restaurants), not just the newest additions.

**Assistance provided:** Split the 28 restaurants into 4 groups of 7 and ran 4 research agents in parallel in the background, each with the same honesty rules used throughout this dataset: real sources only (official menu first, a named real third-party aggregator as fallback), never mark an allergen "absent" unless the source explicitly says so, conservative `possible_based_on_description`/low-medium confidence for anything inferred from typical recipe/preparation rather than stated outright, and explicit instruction to report a shortfall honestly rather than invent filler items for small menus. One agent (bucket 2) hit the platform's 600-second stall watchdog right at its final self-check step, but had already written its complete, valid output file before stalling, so no work was lost or needed to be redone — confirmed by validating the file directly rather than assuming. Before merging all 140 new items into `data/seed/menu-items.json`, ran a validation pass against the actual Postgres CHECK-constraint vocabulary (not just eyeballing it) and caught 15 values that didn't match the schema's exact enum spelling — a stray `"compatible"` dietary status (from 3 of the 4 agents, independently) and `"gluten-free"` instead of `gluten_free` from P.F. Chang's items — normalized both before merge rather than letting them into the dataset or failing silently at seed time.

**My contribution:** [Fill in as you review.]

**Tested:** `npm test` (96/96), `npm run lint` and `npm run build` clean. Verified referential integrity (every new item's `restaurant_id` resolves to a real restaurant, no duplicate ids) and re-checked every allergen/dietary-attribute enum value against `supabase/schema.sql`'s CHECK constraints directly, not just visually. Not yet re-seeded to Supabase or pushed — pending review, same as the rest of this session's work.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained, pending user review.

---

## 2026-08-29 — Generalize Explore Nearby's location search beyond San Diego

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** The user wanted "Explore Nearby" to work for any area within a radius, not hardcoded to San Diego, and not artificially limited to a small hand-picked restaurant set. Flagged upfront that this pulled in two different directions — a live restaurant-discovery API (Google Places/Yelp/OSM) can return a restaurant name/address anywhere, but none of those APIs carry the kind of per-dish allergen evidence this app scores on, which is the entire point of `DATA_SOURCES.md`'s manual-curation model and the explicit "not a nationwide product" line in `LIMITATIONS.md`. Asked two clarifying questions via AskUserQuestion before touching anything: (1) whether an API-discovered restaurant with no curated data should show up labeled "unscored" or be filtered out entirely — user chose filtered out, keeping every visible result backed by real curated evidence; (2) whether to replace the hardcoded San-Diego neighborhood dropdown with free-text geocoding or drop it in favor of device geolocation only — user chose geolocation-only. Also asked whether to add tooling to speed up finding restaurants to curate in new areas; the user asked for a recommendation, so proposed and built a script using the free, keyless OpenStreetMap Overpass API (matching the app's existing "no paid map API" pattern) rather than Google Places, since it needs no billing account or key.

**Assistance provided:** In `src/app/map/MapPageClient.js`, removed the hardcoded `NEIGHBORHOODS` fallback (deleted `src/lib/neighborhoods.js` entirely) and the "or pick a neighborhood" dropdown; location now comes solely from `navigator.geolocation`, with both data-fetching effects gated on a location actually being present (no more auto-fetching centered on Torrey Highlands by default) and a new "share your location to get started" empty state in its place. `/api/rank` and `/api/search` needed no changes — their radius/haversine filtering (`src/lib/geo.js`) was already generic, never San-Diego-specific. Added `scripts/find-restaurant-candidates.js`, a dev-only tool that queries Overpass for restaurants/cafes/fast-food near a given point and prints a plain candidate list — explicitly not wired into the seed pipeline or Supabase, so it doesn't touch the manual sourcing/evidence model at all. Hit and fixed a real bug getting it working: Overpass's public instance returns `406 Not Acceptable` for POST requests with no `User-Agent` header (confirmed via a raw `curl`/`node -e` comparison before guessing), fixed by sending an explicit one; verified end-to-end against a non-San-Diego point (downtown Chicago) returning 671 real restaurants with zero API keys configured. Updated `ARCHITECTURE.md`, `LIMITATIONS.md`, and `DATA_SOURCES.md` so the docs describe the new mechanism (search works anywhere) versus the still-true fact (actual restaurant coverage remains San-Diego-only until more is curated) rather than leaving stale text implying a hardcoded technical restriction.

**My contribution:** [Fill in as you review.]

**Tested:** `npm test` (96/96), `npm run lint` and `npm run build` clean. Live-verified `find-restaurant-candidates.js` against downtown Chicago. Could not click-through `/map` in an actual browser — no Claude-in-Chrome extension connected in this environment — so the new empty state / geolocation-permission flow is verified by code logic and a `curl` 200 on `/map`, not an in-browser check.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained, pending user review.

---

## 2026-08-29 — Live, unscored restaurant discovery + on-demand AI website read

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Follow-up to the Explore Nearby generalization above. The user wanted to actually see restaurants and get allergen information for areas with no curated data — "connect Anthropic AI... so it scrapes when necessary." Before building, asked what trust level an AI-read result should get; the user confirmed the recommended boundary: AI-read results never get a Choice Availability Score/badge, always render as a labeled, quoted, unverified summary, completely separate from the curated/scored path (see the new "Two trust tiers" section in `LIMITATIONS.md`).

**Assistance provided:** Turned the existing dev-only `scripts/find-restaurant-candidates.js` Overpass logic into a live capability by extracting its query-building/parsing into `src/lib/overpass.js` (unit-tested) and adding `POST /api/nearby-live`, which `/map` now calls alongside (never blocking) the curated `/api/rank` results, rendering unscored candidates via a new `UnscoredRestaurantCard` (no score, no `/restaurant/[id]` link, reuses the existing "unknown" badge tone). Added `POST /api/website-lookup`: on one user click per restaurant, fetches that restaurant's real website server-side and asks Claude to quote — never infer — any allergen/dietary text present, rendered via a new `LiveWebsiteLookup` component with a persistent "AI-read, not reviewed by ClearPlate" label. Added a reasonable-effort SSRF guard (`src/lib/website-extraction.js`'s `isPrivateOrLoopbackIp` + DNS-resolution check in the route) since a restaurant's `website` tag is untrusted, community-sourced OpenStreetMap data, not something safe to fetch blindly server-side.

Getting the live Anthropic call working surfaced several real, worth-recording problems, each diagnosed by testing directly rather than guessing: (1) the user's first API key was a "Personal/all-workspaces" identity-linked key, which Anthropic's API rejects with a 400 asking for an `anthropic-workspace-id` header — resolved by creating a workspace-scoped key instead (simpler than sourcing the workspace ID) after walking the user through the Console UI live; (2) once auth worked, real testing against actual restaurant sites hit real-world obstacles that are worth documenting as expected, not bugs — In-N-Out's site is behind Incapsula (bot-protection WAF) and returned a challenge page instead of content, and Node's `fetch` got a 403 from another site that `curl` reached fine (TLS-fingerprint-based blocking) — in both cases the route correctly surfaced an honest error/not-found instead of fabricating anything; (3) a real correctness bug: Claude sometimes wraps its JSON reply in a ` ```json ` code fence despite the system prompt saying "ONLY a JSON object," which silently made `parseExtractionResponse` discard genuine, correctly-extracted results as false "not found" — caught by running the same prompt repeatedly and comparing raw model output, fixed by stripping code fences before parsing, with regression tests added; (4) the extraction prompt was initially too narrow ("allergen and menu information" only), so Claude correctly-by-its-own-logic ignored genuine restaurant-level dietary claims like "100% plant-based fast food" as unrelated marketing copy — broadened the prompt to explicitly include restaurant-level dietary claims (mirroring how `DATA_SOURCES.md` itself treats claims like Plant Power's), verified fixed against the real Plant Power Fast Food site end-to-end afterward.

**My contribution:** [Fill in as you review.]

**Tested:** `npm test` (119/119, 23 new: `overpass.test.js`, `website-extraction.test.js` including SSRF-guard and code-fence-stripping regression cases). `npm run lint`/`npm run build` clean. Live-verified end-to-end with a real `ANTHROPIC_API_KEY`: `/api/nearby-live` against Chicago (30 real results, sorted by distance); `/api/website-lookup` against In-N-Out (correctly blocked by their WAF, honest error, not fabricated), a TLS-fingerprint-blocked site (correctly honest error), and Plant Power Fast Food's real site (correctly found and quoted "100% plant-based fast food"); the SSRF guard confirmed blocking a `127.0.0.1` URL with a clean 400. Not yet click-tested in an actual browser — no Claude-in-Chrome extension connected in this environment.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained, pending user review.

---

## 2026-08-29 (later) — Top 3 curated picks, hide the raw score, and AI-ranked recommendations

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Three follow-up requests in one session. (1) Hide the raw "43/100" Choice Availability Score number from the restaurant detail page — keep the underlying ranking and qualitative tier badge, just stop displaying the number (confirmed scope via AskUserQuestion: number only, not the whole scoring system). (2) Show only the top 3 curated Explore Nearby results, labeled "Choice #1/#2/#3", instead of the full ranked list. (3) A real widening of the AI safety boundary: instead of the AI only quoting one restaurant's site on click, the user wanted AI to actively pick and rank the "3 best" nearby restaurants from the live (unscored) OpenStreetMap candidates. Flagged this explicitly as different from quote-only extraction and asked directly whether it should stay "auto-run the same quote-only read on 3 candidates" vs. "let AI actually rank/recommend" — user chose the latter, so this needed real safety-language guardrails, not just a feature flag.

**Assistance provided:** `ScoreSummary.js`'s raw-number block removed (the `score` prop still drives `scoreTierLabel`/`scoreTierTone` internally — only the display changed). `RestaurantResultCard.js`'s `highlight` boolean became a `rank` number, rendering "Choice #N" on all three cards (not just a single "Top pick"); `MapPageClient.js` now slices `restaurantResults` to `TOP_RESULTS_COUNT = 3` for both the list and the map markers, so the two stay consistent. For AI ranking: added `POST /api/ai-recommend`, which finds the closest 8 nearby-live candidates with a website, fetches all 8 in parallel, and sends them in ONE combined Anthropic call (not 8 separate calls, to bound cost) asking Claude to pick up to 3 based only on what the text says — every pick is required to carry a real supporting quote (`src/lib/ai-recommendation.js`'s parser drops any pick with no quote), and the system prompt explicitly bans "safe"/"guaranteed"/"compatible"/"recommended for your allergy" language, with a second defensive filter dropping any pick whose rationale contains banned language even if the model ignores the instruction. Rendered via a new `AiRecommendedPicks` component, deliberately using a dashed-border + Sparkles-icon "AI Pick #N" treatment (never "Choice #N" — that stays reserved for real curated data) so it can't be visually mistaken for trusted results, manually triggered by a button (never automatic — the Anthropic key had ~$5 in credits, and this feature does 8 fetches + 1 large Claude call per press). Factored the SSRF-guarded fetch logic and the Anthropic call itself out of `/api/website-lookup` into shared `_lib/safe-fetch.js`/`_lib/anthropic.js` so both routes share one implementation.

Live testing surfaced two real, serious bugs, neither of which would have been caught without actually running it end-to-end: (1) `assertSafeToFetch`'s DNS lookup had no timeout at all — only the subsequent `fetch()` call did — so one slow-resolving candidate among the 8 parallel fetches made the *entire* `/api/ai-recommend` request take **4.2 minutes** (confirmed via the dev server log, not guessed), which would just fail outright on Vercel's function timeout in production; fixed by wrapping the DNS lookup in its own timeout and adding a hard per-candidate cap in the route, bringing real requests down to ~10s. (2) A silent, systematic bug (not a rare fluke, as first assumed) in `callAnthropic`: it read `content[0].text` unconditionally, but Claude sometimes emits a `"thinking"` content block before the `"text"` block (extended thinking), making `content[0].text` `undefined` and silently degrading a real, correct answer into "nothing found" — this had already been happening intermittently in `/api/website-lookup` from the prior session without being caught. Fixed by finding the actual `type: "text"` block explicitly instead of assuming index 0, with the fix pulled into its own pure `extractTextBlock()` function specifically so this exact bug shape is regression-tested going forward.

**My contribution:** [Fill in as you review.]

**Tested:** `npm test` (134/134, 4 new in `tests/anthropic-lib.test.js` covering the thinking-block-first regression case). `npm run lint`/`npm run build` clean. Live-verified end-to-end with the real `ANTHROPIC_API_KEY` against San Diego (32.9670, -117.1717, 3mi, peanut allergy + vegetarian): `/api/ai-recommend` correctly checked 7 real restaurant sites and returned 2 grounded picks (JoYee's Dumpling House, Pita 22), each with a real quote and no banned safety-verdict language, completing in ~10.5s after the timeout fix (vs. 4.2 minutes before it, and an outright empty/broken result before the thinking-block fix). Not yet click-tested in an actual browser — no Claude-in-Chrome extension connected in this environment.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained, pending user review.

---

## 2026-08-30 — Site-wide nav header, AI-powered Find a Dish, catchier AI buttons

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Three follow-up requests. (1) Bring Find a Dish up to the same level as Explore Nearby — let AI search areas outside the curated dataset for a specific craving, not just "3 best overall." (2) The app had no persistent navigation at all outside `/home`'s own hero — every other page (`/map`, `/favorites`, `/restaurant/[id]`, `/dish/[id]`, `/profile`) only had a local "Back" link, so the user asked for a header/toolbar to navigate anywhere. (3) The AI trigger buttons were a subtle dashed outline, easy to miss, and buried below the curated results — asked for a solid, catchy, more prominent treatment so people actually notice and use the feature.

**Assistance provided:** For (1), rather than building a parallel dish-search feature, extended the existing `/api/ai-recommend` pipeline (`src/lib/ai-recommendation.js`'s `buildRecommendationMessages`) with an optional `craving` argument that folds a specific dish craving into the same ranking prompt — same candidate-gathering, same parallel-fetch timeouts, same quote-grounding and banned-safety-language rules, zero new route or guardrail code. `AiRecommendedPicks` got a matching optional `craving` prop, changing its button label and request body accordingly; in `MapPageClient.js`, find-dish mode only shows/enables the button once the user has actually typed something. For (2), added `SiteHeader` (`src/components/SiteHeader.js`), rendered once in `RootLayout` so every page gets it for free — reuses the same `NAV_LINKS` list `/home`'s hero already had (extracted to `src/lib/nav-links.js` as a shared source of truth, home's own render unchanged) plus a Profile link, and hides itself on `/`, `/home` (avoids duplicating the hero's existing nav), and the auth pages. For (3), the idle-state "Ask AI..." and "Check website with AI" buttons switched from a dashed outline to a solid `bg-primary` fill with the `Sparkles` icon — deliberately only the *entry-point buttons*, not the results themselves, which still keep their distinct dashed-border/"AI Pick #N"/unverified-disclaimer treatment from earlier this session, so a catchier call-to-action doesn't blur into a catchier (and misleadingly confident-looking) verdict. Also repositioned the main "Ask AI" trigger to render directly under the location/radius controls in both modes, instead of being buried inside the "more restaurants nearby" section below the curated results.

**My contribution:** [Fill in as you review.]

**Tested:** `npm test` (136/136, 2 new covering the craving argument in `ai-recommendation.test.js`). `npm run lint`/`npm run build` clean. Live-verified: confirmed via `curl` that the `ClearPlate` header wordmark appears exactly once on `/map`, `/favorites`, `/profile`, and a real `/restaurant/[id]` page (i.e. `SiteHeader` renders there and nowhere is it duplicated), zero times on `/auth/signin`, and still exactly once on `/home` (confirming no duplicate nav was introduced there). Live-tested the craving-aware `/api/ai-recommend` with a real `ANTHROPIC_API_KEY` against San Diego with `query: "vegan"` — correctly returned 2 quote-grounded picks (JoYee's Dumpling House, Pita 22) reframed around the vegan craving specifically, in ~14s. Not yet click-tested in an actual browser (mobile menu toggle, active-link styling) — no Claude-in-Chrome extension connected in this environment.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained, pending user review.

---

## 2026-09-11 — Google Places key wired in; removed AI restaurant-ranking, kept only per-restaurant AI dish lookup

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Two things. (1) Walk the user through creating and restricting a real `GOOGLE_PLACES_API_KEY` in Google Cloud Console (project already existed with billing enabled) so `/api/nearby-live`/`/api/website-lookup` would actually work instead of returning the "not configured" 503. (2) Explicit product feedback after live-testing: the user does not want AI (`/api/ai-recommend`) choosing/ranking *which* restaurants to show at all — "it would just hallucinate" — only the curated dataset and the deterministic, distance-sorted Google Places list should ever decide which restaurants appear. AI's only remaining job should be reading a dish/craving out of a restaurant a human already selected.

**Assistance provided:** Walked the user live through Cloud Console (they initially landed on an unrelated "Agent Platform" API-key page, then on the wrong "Managed Workload Identities" page, then found an existing browser-only `HTTP referrers`-restricted key that wouldn't work server-side) to enabling "Places API (New)" and creating a second key restricted to just that one API with no application restriction (appropriate since Vercel serverless has no stable outbound IP). Verified live via curl against `/api/nearby-live` (real San Diego restaurants returned) and `/api/ai-recommend` (still present at that point) before removing it.

For the redesign: deleted `/api/ai-recommend`, `src/lib/ai-recommendation.js`, `AiRecommendedPicks.js`, and `tests/ai-recommendation.test.js` entirely — restaurant selection is now 100% deterministic everywhere in the app (curated dataset scoring, or Google Places distance-sort), never an AI judgment call. Extended the existing single-restaurant `buildExtractionMessages` (`website-extraction.js`) with an optional `craving` argument folded into the system prompt ("also look for any mention of a dish... matching '{craving}'"), threaded through `/api/website-lookup` → `LiveWebsiteLookup` (button label becomes `Check for "{craving}" with AI`) → `UnscoredRestaurantCard`. In `MapPageClient.js`, the "more restaurants nearby" Google Places list (previously Explore-Nearby-only) now also renders in Find a Dish mode once a craving is typed, with `craving` passed to each card. (This entry originally reasoned the restaurant list itself never depends on the craving text — corrected minutes later the same session once the Places *query* itself was also made craving-aware; see the next entry.) Updated `LIMITATIONS.md`'s "Two trust tiers" and AI-limitations sections, `ARCHITECTURE.md`'s data-flow docs, and `DATA_SOURCES.md` to remove every description of AI ranking/selecting restaurants, replacing it with "AI only ever reads the one restaurant a human already clicked into."

Also diagnosed, live, a real and unrelated bug the user hit while testing: `/api/rank` (the curated dataset) was throwing `TypeError: fetch failed`, traced via `curl`/`nslookup` to the Supabase project host (`qrwneggohhnxdwjwhqul.supabase.co`) returning NXDOMAIN while general internet access from the same machine worked fine — meaning the Supabase project itself was unreachable (likely auto-paused/deleted from inactivity since it was last touched 2026-07-28), not a code bug. Flagged to the user to check the Supabase dashboard; not yet resolved as of this entry.

**My contribution:** [Fill in as you review.]

**Tested:** `npm test` (127/127, 2 new craving-argument cases in `website-extraction.test.js`, 13 fewer from the deleted `ai-recommendation.test.js`). `npm run lint`/`npm run build` clean — `/api/ai-recommend` confirmed gone from the build's route list. Live-verified with the real `GOOGLE_PLACES_API_KEY` before removal: `/api/nearby-live` returned real downtown San Diego restaurants; `/api/ai-recommend` with `query: "tacos"` correctly grounded two picks in real site quotes, and correctly returned zero picks for a peanut-allergy query where no candidate site mentioned peanuts (the fail-safe working as designed). Not yet re-verified in an actual browser after the redesign (Find a Dish's new nearby-live section, the "Check for craving" button) — blocked on the separate Supabase outage above making the dev server's `/map` page show an error banner regardless of this feature.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** `/api/ai-recommend` and everything only it used (`ai-recommendation.js`, `AiRecommendedPicks.js`) discarded per explicit user feedback. Everything else retained, pending user review.

---

## 2026-09-11 (later) — Craving-aware Places search; stopped hiding undocumented dishes/restaurants

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** After the Supabase outage resolved and live-testing resumed, direct product feedback: "when I type in pizza to this nothing shows up... I feel this is not general and not working suited for all restaurants, very basic." Also explicit direction on the matching threshold: "instead of looking for 100% matches... restaurants can accommodate for your needs... lessen the cutoff... don't worry about safety too much as the people are warned."

**Assistance provided:** Root-caused the "pizza shows nothing relevant" complaint: `/api/nearby-live` always ran a Google Places *Nearby Search* with a fixed category list (`restaurant`/`cafe`/`fast_food_restaurant`), completely ignoring the craving text — confirmed by curl, "pizza" and no craving returned the identical restaurant list (Din Tai Fung, a seafood spot, etc., zero pizza places). Added `buildTextSearchBody` (`google-places.js`) using the Places API (New) `searchText` endpoint with the craving folded into `textQuery` and `locationBias` (a soft preference, unlike Nearby Search's hard `locationRestriction`, so a craving with few close matches still returns the nearest reasonable ones instead of nothing); `/api/nearby-live` now branches on whether a `query` is present. Re-tested: "pizza" near the same coordinates now returns Knockout Pizzeria, Pauly's Pizza Joint, Crust & Brew, The Pizza Joint, Criscito Pizza, etc. `MapPageClient.js`'s nearby-live fetch effect now sends `query: craving` in Find a Dish mode and is properly debounced (previously fetched once per craving-started transition since the query didn't matter yet; now genuinely depends on the craving text, so it needed the same debounce as the curated dish search to avoid hitting this paid API every keystroke).

For the "lessen the cutoff" direction: reviewed `RECOMMENDATION_RANK` (`result-summary.js`) and found it was already including `CONFIRM_BEFORE_ORDERING`, not just a "100% strong match" — the real gaps were (1) `INSUFFICIENT_INFORMATION` (no documented evidence either way) was excluded from Find a Dish/restaurant-detail's "recommended" list entirely, and (2) Explore Nearby's `hasAnyRealMatch` gate hid the whole top-3 list behind "No options in the dataset match your profile" unless at least one dish had positive documented evidence. Extended `RECOMMENDATION_RANK` to include `INSUFFICIENT_INFORMATION` ranked last (after strong match/modification/confirm), and extended `hasAnyRealMatch` to also count it — deliberately kept `ALLERGEN_IDENTIFIED` (a real, official, documented conflict) as the one classification that's never recommended, since that's a known problem, not just missing paperwork, and showing it anyway wouldn't be "restaurants can accommodate," it would be recommending something the restaurant's own source says contains the allergen. Every dish/restaurant still shows its true evidence tier and "confirm before ordering" language regardless — nothing here changes what's *labeled*, only whether an undocumented dish is shown at all instead of being silently dropped.

**My contribution:** [Fill in as you review.]

**Tested:** `npm test` (132/132, 5 new: 2 for `buildTextSearchBody` in `google-places.test.js`, 3 for `getRecommendedDishes`'s new ranking/inclusion behavior in `result-summary.test.js`, confirming `ALLERGEN_IDENTIFIED` is still always excluded even when it's the only classification present). `npm run lint`/`npm run build` clean. Live-verified via curl: `/api/nearby-live` with `query: "pizza"` returns real pizza restaurants (previously identical to the no-craving generic list); `/api/search` with `query: "pizza"` still correctly returns True Food Kitchen's GF Margherita Pizza as `confirm_before_ordering` for a peanuts-only profile (unaffected — that tier was already recommended) and `allergen_identified` for a peanuts+eggs profile (still correctly excluded — a real documented conflict, not touched by this change). Not yet click-tested in an actual browser (no Claude-in-Chrome extension connected in this environment) — the user is verifying directly.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** All retained, pending user review — this loosens a real safety-adjacent threshold (showing undocumented dishes as recommended) at the user's explicit, repeated direction, not a unilateral decision; `LIMITATIONS.md` gained a new section ("Recommended' includes undocumented dishes, by design") documenting the policy and its one hard exception (known allergen conflicts) so this is disclosed the same way every other trust boundary in this app is.

---

## 2026-09-11 (later still) — Minimalism text pass (Home, restaurant detail, profile)

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Direct visual feedback across two rounds: "there are tiny words and sentences making the website look cluttered and weird... I am going for minimalistic" (Home page's hero subtitle/card descriptions, restaurant detail's score-tier badge), then "also clean up the allergy profile page" (no specifics given, so the same subtitle-removal pattern already established was applied there too) — plus a standing complaint that the "Insufficient information" dish badge showed on nearly every dish and should be dropped app-wide.

**Assistance provided:** `HomePageClient.js`: removed both lines under "What are you looking for today?" and the description line under the Explore Nearby/Find a Dish cards (`ActionCard`'s `description` prop made optional rather than required). `ScoreSummary.js`: removed the qualitative tier badge ("Limited/Moderate/Good choice availability") that headed the restaurant detail score box — factors list and "Why this score?" untouched. `StatusBadge.js`: returns `null` for `CLASSIFICATIONS.INSUFFICIENT_INFORMATION` instead of rendering a badge (per explicit "remove that text entirely throughout all pages" — this is the single shared component behind the dish badge on Find a Dish, restaurant menus, and the dish detail page, so one change covered all of them); `DishResultCard.js`'s layout adjusted (`ml-auto` on "View details" instead of `justify-between`) so the row still right-aligns correctly when the badge renders nothing. Profile page (`(onboarding)/profile/page.js`): removed the "Saved on this device only" subtitle, the redundant "Avoiding eggs. Also following vegetarian." summary banner (`ProfileSummary` component, now fully unused and deleted), and the "Select the ingredients/preferences..." subtitles under Allergies/Dietary restrictions — kept the safety disclaimer box at the bottom untouched (a substantive safety notice, not filler description text, and not something asked about).

**My contribution:** [Fill in as you review.]

**Tested:** `npm test` (132/132 — no behavior changed, just presentation). `npm run lint`/`npm run build` clean.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** `ProfileSummary.js` deleted (orphaned after removing its one call site). Everything else retained.

---

## 2026-09-11 (final) — Removed accounts entirely; verified/fixed general-location support

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Two requests. (1) "let's just remove the account feature entirely, everyone that uses this website is a guest and will select their food profile from the beginning" — a full removal of Supabase Auth (sign up/in/out, account deletion, signed-in profile/favorites persistence), not just de-emphasizing it. (2) "can you make sure this works for not just san diego but also other places, since I wanted this to be general to locations" — verify/fix the app's behavior outside the curated dataset's coverage area.

**Assistance provided:** For (1): deleted `src/app/auth/` (signin/signup/signout/callback), `src/app/api/account/route.js`, `src/app/api/favorites/route.js`, `src/proxy.js` (existed solely to refresh the Supabase auth session cookie), `src/lib/supabase/client.js` (the browser auth client, now unused), and `src/app/api/_lib/favorite-targets.js` (only used by the deleted favorites route). Simplified every "load the guest-or-signed-in profile" effect (`MapPageClient.js`, `RestaurantDetailClient.js`, `DishDetailClient.js`, `ProfileShortcut.js`, the profile page) down to a plain `loadGuestProfile()` call — five call sites, all previously identical `supabase.auth.getUser()` + `loadUserProfile`/fallback boilerplate. `FavoriteButton.js` and `FavoritesPageClient.js` lost their `isGuest` branching entirely (always the localStorage path now). Removed `saveUserProfile`/`loadUserProfile` from `lib/profile.js` and `mergeFavoritesWithTargets` from `lib/favorites.js` (and its 5 tests) since nothing calls them anymore. `WelcomeModal.js` went from three exits (signup/guest/signin) to one ("Get started" → `/profile`) and its footer dropped a stale "San Diego-area prototype" claim that also contradicted request (2). `HomePageClient.js` lost its "Signed in as X / Sign out" vs "Browsing as a guest / Sign in" footer entirely. Deliberately left the actual Supabase `profiles`/`favorites` tables, their RLS policies, and `supabase/schema.sql` untouched — dropping live database tables is a separate, more destructive action than removing the app code that used them, and wasn't asked for; flagged this distinction to the user rather than assuming license to also alter the database schema. Hit a real lint failure along the way: the project's `react-hooks/set-state-in-effect` rule flagged every one of the simplified `useEffect(() => { setX(...) }, [])` blocks (calling setState directly and synchronously in an effect body) — fixed by wrapping each in a named `function load() { ... }; load();`, matching the pattern the pre-existing (now-removed) async version used, verified against one file via `npx eslint` before applying it everywhere.

For (2): confirmed via curl from real non-SD coordinates (NYC, 40.7580/-73.9855) that `/api/nearby-live` already returns real, relevant restaurants generally (including craving-filtered results, e.g. "pizza" correctly surfaced Joe's Pizza Broadway, Carnegie Pizza, etc. — this was the Text Search fix from earlier this session) and that `/api/rank` correctly returns an honest empty array (not an error) outside the curated dataset's coverage. Found and fixed a real, related UX bug this exposed: the empty-state copy for zero curated results ("No restaurants found nearby... Try a larger radius") was actively misleading outside San Diego, since no radius will ever surface curated data there, and it never pointed to the "more restaurants nearby" section that actually has results — reworded to "No curated matches this close yet... see live results from Google below, or try a larger radius" (and the analogous Find a Dish empty state), in both `MapPageClient.js`. Also removed the last hardcoded "San Diego-area prototype" UI string (`WelcomeModal.js`, see above) — confirmed via grep that no other user-facing string in `src/` claims a SD-only scope. Updated `ARCHITECTURE.md` (Authentication section rewritten, Database/Favorites/External APIs sections updated), `README.md` (target audience, features, deployment, tech stack), and `LIMITATIONS.md`'s Geographic coverage section accordingly.

**My contribution:** [Fill in as you review.]

**Tested:** `npm test` (127/127 — 5 fewer than before, from removing `mergeFavoritesWithTargets`'s tests). `npm run lint`/`npm run build` clean — build's route list confirms `/auth/*`, `/api/account`, `/api/favorites` are gone and no Proxy/Middleware line remains. Live-verified via curl: `/api/nearby-live` and `/api/nearby-live?query=pizza` both return real, relevant results from New York City coordinates; `/api/rank` from the same coordinates returns `{"restaurants":[]}` with a `200`, not an error. Not yet click-tested in an actual browser (no Claude-in-Chrome extension connected in this environment) — the user is verifying directly, as with every change this session.

**What I learned:** [Fill in.]

**Retained/modified/discarded:** Accounts (Supabase Auth, sign up/in/out, account deletion, signed-in profile/favorites) discarded entirely per explicit user direction — this is a real reversal of previously-built, previously-committed functionality (see the 2026-07-21 "Account deletion" entry above), not a small tweak; noted here plainly rather than glossed over. The live Supabase `profiles`/`favorites` tables/RLS themselves were deliberately NOT touched — ask the user before any actual database schema change. Everything else retained.
