# Limitations

This is a Congressional App Challenge competition prototype, not a production or commercial application. Its limitations are disclosed here deliberately, and repeated in the app UI, the demo video, and the written submission.

## Geographic coverage

Location search itself works anywhere — Explore Nearby and Find a Dish both center on the device's own geolocation, with no hardcoded region, and Find a Dish's craving is passed through to Google Places as a real text search (not just the curated dataset), so e.g. searching "pizza" from any city surfaces actual pizza restaurants there. The curated, *scored* restaurant data is still limited to what has been manually curated: currently one San Diego area, roughly 15–30 restaurants; searching from another city correctly returns no curated results, not fabricated ones — the UI says so explicitly and points to the live Google results instead of implying nothing was found. A separate "more restaurants nearby" section (see "Two trust tiers" below) can surface real restaurants anywhere via the Google Places API, but never with a score.

## Two trust tiers: curated/scored vs. AI-read/unverified

This app shows two fundamentally different kinds of information, kept deliberately separate everywhere in the UI:

1. **Curated, scored data** — every restaurant/dish shown with a Choice Availability Score comes from this app's manually curated dataset (see `DATA_SOURCES.md`): a real person read a real, dated, public source for every allergen claim.
2. **AI-read, unverified data** — the "more restaurants nearby" section (unscored, from the Google Places API) can, on request, have its website read live by Claude (Anthropic API), which quotes what it finds. This is never reviewed by a person, never persisted, and never produces a score, badge, or "compatible"/"not compatible" verdict — only quoted text plus an explicit "not reviewed, confirm before ordering" label. Treat it as a starting point for your own reading, not a verified answer. This is always a single-restaurant read, one click at a time ("Check website with AI" / "Check for '[craving]' with AI") — Claude only ever reads the one restaurant a human already chose to look at; it never selects, ranks, or recommends across restaurants. *Which* restaurants appear in this section at all is decided entirely by Google Places — nearest by distance, or (when a Find a Dish craving is typed) Google's own text-relevance ranking for that search term — never by AI.

Never assume tier 2 carries the same confidence as tier 1 — that distinction is the whole point of keeping them visually and functionally separate. "Choice #N" (tier 1) is never applied to anything in tier 2.

## Menu and allergen data completeness

Menu items (~100–300) and their allergen/ingredient/cross-contact data are manually curated from each restaurant's own public materials, not comprehensive or automatically kept in sync with the restaurant's actual current menu. See `DATA_SOURCES.md` for exactly what was collected and when.

## "Recommended" includes undocumented dishes, by design

A dish or restaurant can appear as a recommended result even when this app has *no* documentation either way for one of your allergies/dietary restrictions ("insufficient information" — see `ARCHITECTURE.md`'s classification tiers). This is a deliberate choice, not a gap: a real restaurant can very often accommodate a request even when nothing about it happens to be written down anywhere this app could find. The one thing that's never shown as recommended is a dish with a documented, known conflict (an allergen an official source explicitly lists as present) — that's the one tier this app treats as a real problem, not just missing paperwork. Every dish still shows its actual evidence level and a "confirm before ordering" reminder; use that detail, not the fact that something was listed at all, to judge how much to trust it.

## Data can go stale

Restaurant recipes, ingredients, suppliers, and kitchen procedures can change at any time without this dataset being updated. Every record shows its last-checked date so users can judge freshness themselves, but the app cannot detect changes automatically in this version.

## Cross-contact information is often unavailable

Shared-equipment and cross-contact information is only shown when a restaurant source directly documents it. Its absence is displayed as "unknown," never as evidence of safety.

## AI limitations

Deterministic, rule-based logic (not live AI inference) drives allergen *classification, scoring, and question generation* in this version — this is a deliberate design choice, not an oversight, so those results stay explainable and testable (see `ARCHITECTURE.md`). This app uses live AI in exactly one on-demand place, restricted to unscored, Google Places-sourced restaurants: "check website with AI" (`/api/website-lookup`), where Claude reads one restaurant's own site and quotes what it finds — optionally also checking for one specific craving/dish the user typed into Find a Dish. It's instructed to quote, never infer or fabricate — but it's still an unreviewed AI read of a live webpage, so it can miss or misread something a human curator would have caught. It's always labeled unverified, always shown separately from the scored dataset, never produces a classification/score/"compatible" verdict, and never picks or ranks *which* restaurants to show — that choice is made entirely by Google Places (nearest by distance), never by AI (see "Two trust tiers" above).

## No medical guarantee

This app is a decision-support and discovery tool, not a medical device and not a guarantee of allergen safety. It never uses language like "safe," "allergy-proof," or "guaranteed allergen-free." Users are always directed to confirm directly with restaurant staff before ordering. See the disclaimer in `README.md` and `SECURITY_AND_PRIVACY.md`.

## Need to confirm directly with the restaurant

Every recommendation in this app is a starting point for a conversation with restaurant staff, not a replacement for it — especially for users with severe or cross-contact-sensitive allergies.

## Other known prototype-stage limitations

- Restaurant participation/claiming, community reporting, restaurant-owner accounts, and multilingual question translation are stretch features, not in the MVP.
- No mobile app store distribution — this is a responsive web app.
- No automated/scheduled data refresh; updates are manual.

_This list is updated as development continues._
