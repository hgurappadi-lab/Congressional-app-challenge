# Testing

## Unit tests

Pure logic in `/src/lib/` is unit-tested with Vitest (`npm test`), independent of the database/network:

- `tests/classification.test.js` — dish compatibility classification (`/lib/classification.js`): each of the 5 categories, plus edge cases (no allergens selected, all allergens unknown, conflicting evidence, matching-strictness effects).
- `tests/scoring.test.js` — Choice Availability Score (`/lib/scoring.js`): score ordering behaves as documented (e.g. Restaurant B from the original concept — fewer matches but better evidence — outranks Restaurant A).
- `tests/evidence.test.js` — evidence-source → confidence-tier mapping (`/lib/evidence.js`).
- `tests/questions.test.js` — question generator (`/lib/questions.js`): questions generated match the specific allergens/unknowns/modifications passed in.
- `tests/search.test.js` — craving search expansion (`/lib/search.js`): synonym/keyword matching produces expected related dishes.
- `tests/group-dishes.test.js` — category grouping (`/lib/group-dishes.js`): order preservation, "Other" bucketing for missing/blank categories.
- `tests/classification-labels.test.js` — display labels stay in sync with the 5 classification values.
- `tests/evidence-labels.test.js` — display labels stay in sync with the assessment/dietary-status/evidence-source enums, plus explicit assertions that no label implies "safe" or a guarantee of absence (build plan §5).
- `tests/favorites.test.js` — guest favorite add/remove/toggle logic (idempotent, list-name-scoped) and the signed-in favorites merge logic (`mergeFavoritesWithTargets`): resolved names, both shapes of the embedded restaurant relation, and dangling target ids.

## Integration tests

No dedicated automated integration-test suite against a test Supabase instance exists — an accepted scope decision for a prototype of this size. In its place, every route handler (`/api/rank`, `/api/search`, `/api/restaurant/[id]`, `/api/dish/[id]`, `/api/favorites`) has been repeatedly exercised against the live curated dataset during development, both directly via `curl` (e.g. confirming `/api/rank` ranks restaurants correctly for isolated allergen/dietary searches) and end-to-end via Playwright-driven browser sessions that click through the real UI and inspect the real network responses (see "User-flow testing" and "Browser testing" below).

## User-flow testing (manual)

The full journey in plan §3 is walked through manually in the browser at the end of each build phase (see plan §21 "Verification process") — not just after code is generated, but actually run:

- Guest mode: complete profile → search → view results → view detail pages → generate questions, with no account.
- Registered account: sign up → profile persists across sessions → sign out → sign in → profile still there.

## Mobile testing

Automated pass at a 390×844 viewport (iPhone-sized) via Playwright/Chromium's mobile emulation, walking the full primary journey (welcome → guest → profile → Explore Nearby → restaurant detail → dish detail). No layout breakage, horizontal overflow, or cut-off content found; cards stack correctly and text wraps cleanly. One minor cosmetic issue noted but intentionally not fixed yet: the "or pick a neighborhood" label wraps awkwardly next to its `<select>` at narrow widths — still fully usable, deferred to the project's single end-of-build design pass rather than fixed piecemeal now. Real-device testing (an actual phone, not just emulation) is still outstanding — recommended before the Oct 15 testing/docs deadline.

## Accessibility checks

Automated `axe-core` (WCAG 2 A/AA ruleset) scan across all 7 primary-journey pages (`/welcome`, `/profile`, `/map`, `/restaurant/[id]`, `/dish/[id]`, `/favorites`, `/home`). Found and fixed one real violation: the per-allergen severity `<select>` on `/profile` had no accessible name (`select-name`, critical impact) — fixed with an `aria-label` describing which allergen's severity it controls. Zero violations remain after the fix. Keyboard `Tab` order on `/map` was also spot-checked and follows a sane reading order (back link → mode toggle → location controls → radius → result cards), with no keyboard traps found. Status/classification badges are always paired with text, never color alone. Not yet done: a full screen-reader pass with an actual screen reader (VoiceOver/NVDA) and a dedicated color-contrast audit — axe's AA ruleset includes contrast checks and found none, but a manual spot-check is still worth doing before submission.

## Browser testing

Automated pass of the same primary journey across all three browser engines Playwright supports (Chromium, Firefox, WebKit — the closest automatable proxy for Chrome, Firefox, and Safari respectively) at a 1280×1000 viewport. All three complete the full journey (welcome → guest → profile → Explore Nearby → restaurant detail → dish detail) with zero unexpected console errors. Real Safari/Chrome/Firefox testing on their actual production builds (not WebKit/Chromium/Firefox's engines in isolation) is still worth a manual spot-check before submission, since engine-level parity doesn't catch every browser-specific quirk.

## Failure scenarios tested

- Location permission denied → manual entry still works, app does not block.
- No results found for a search → clear empty state, not a blank/broken screen.
- Restaurant/dish with incomplete allergen data → "Insufficient information" displays correctly, never defaults to implying safety.
- Stale data (old `last_checked_at`) → freshness is visibly reflected in the score explanation.
- Supabase/network error → user-facing error state, not a crash.
- Conflicting evidence (e.g. a modification exists but the base dish has an identified allergen) → classification logic resolves this predictably and the reasoning is shown.

## Known issues

_Updated as they're found. An issue found and fixed during development is still worth recording briefly, for the "what technical challenge did you solve" submission question._

- **Fixed (2026-07-21):** the per-allergen severity `<select>` on `/profile` had no accessible name (caught by an automated `axe-core` scan, not manual testing) — fixed with an `aria-label`.
