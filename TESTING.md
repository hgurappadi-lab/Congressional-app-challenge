# Testing

## Unit tests

Pure logic in `/src/lib/` is unit-tested with Vitest (`npm test`), independent of the database/network:

- `tests/classification.test.js` — dish compatibility classification (`/lib/classification.js`): each of the 5 categories, plus edge cases (no allergens selected, all allergens unknown, conflicting evidence, matching-strictness effects).
- `tests/scoring.test.js` — Choice Availability Score (`/lib/scoring.js`): score ordering behaves as documented (e.g. Restaurant B from the original concept — fewer matches but better evidence — outranks Restaurant A).
- `tests/evidence.test.js` — evidence-source → confidence-tier mapping (`/lib/evidence.js`).
- `tests/questions.test.js` — question generator (`/lib/questions.js`): questions generated match the specific allergens/unknowns/modifications passed in.
- `tests/search.test.js` — craving search expansion (`/lib/search.js`): synonym/keyword matching produces expected related dishes.

## Integration tests

_To be added once API route handlers exist: exercising `/api/rank` and `/api/search` against a test Supabase instance or seeded fixture data._

## User-flow testing (manual)

The full journey in plan §3 is walked through manually in the browser at the end of each build phase (see plan §21 "Verification process") — not just after code is generated, but actually run:

- Guest mode: complete profile → search → view results → view detail pages → generate questions, with no account.
- Registered account: sign up → profile persists across sessions → sign out → sign in → profile still there.

## Mobile testing

_To be recorded here: devices/viewport widths tested, and any responsive-layout issues found and fixed._

## Accessibility checks

_To be recorded here: keyboard navigation through the primary journey, screen-reader label checks on map markers/status badges (status is always paired with text + icon, not color alone), color-contrast spot checks._

## Browser testing

_To be recorded here: which browsers were tested (e.g. Chrome, Safari, Firefox) and any issues found._

## Failure scenarios tested

- Location permission denied → manual entry still works, app does not block.
- No results found for a search → clear empty state, not a blank/broken screen.
- Restaurant/dish with incomplete allergen data → "Insufficient information" displays correctly, never defaults to implying safety.
- Stale data (old `last_checked_at`) → freshness is visibly reflected in the score explanation.
- Supabase/network error → user-facing error state, not a crash.
- Conflicting evidence (e.g. a modification exists but the base dish has an identified allergen) → classification logic resolves this predictably and the reasoning is shown.

## Known issues

_Updated as they're found. An issue found and fixed during development is still worth recording briefly, for the "what technical challenge did you solve" submission question._
