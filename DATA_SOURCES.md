# Data Sources

This app's restaurant and menu dataset is manually curated, not scraped or bulk-imported, and every record traces back to a specific public source. This file explains the sourcing methodology; the per-item source URLs and dates live alongside the data itself in `data/seed/*.json` and in the `source_url` / `source_type` / `data_collected_at` / `last_checked_at` columns on the `restaurants` and `menu_items` tables (see `ARCHITECTURE.md`).

## Restaurant sources

Restaurant name, address, coordinates, hours, cuisine, and website are collected from each restaurant's own official website, or from another appropriately-licensed/verified public source, and recorded with a collection date. Coordinates are documented from a source rather than bulk-pulled and stored from a third-party Places API — see the "Why not Google Places for storage" note below.

## Menu sources

Menu item names, descriptions, and prices are collected from each restaurant's own publicly published menu (their website or official digital menu), with the source URL and collection date recorded per item.

## Allergen and ingredient sources

Each allergen assessment on a dish is tagged with exactly one `evidence_source` value:

- `official_allergen_guide` — the restaurant publishes a dedicated allergen chart/guide
- `official_ingredient_list` — the restaurant publishes a full ingredient list
- `official_menu_description` — inferred only from the restaurant's own menu description text
- `restaurant_written_confirmation` — a restaurant representative confirmed something in writing (e.g. email)
- `student_analysis_of_public_description` — the student's own reading of an incomplete public description; explicitly labeled as interpretation, not restaurant verification
- `community_report` — a user-submitted report (stretch feature, not in MVP)
- `unknown` — no source available

The absence of an allergen from a source is never recorded or displayed as proof the allergen is absent — see `assessment: not_identified_in_available_source` in the schema, and the classification rules in `ARCHITECTURE.md`.

## Cross-contact sources

Cross-contact information (shared fryers, grills, woks, prep surfaces) is recorded only when directly supported by a restaurant source. Where unavailable, the app displays "Cross-contact information is unknown. Confirm directly with the restaurant." rather than omitting the topic or implying safety.

## Location-data sources

Google Maps JavaScript API is used only for live, client-side map rendering (tiles, markers, user location) — it is not used to bulk-populate the restaurant database. This is a deliberate choice: permanently storing certain Google Places API fields in a separate database may not be permitted under Google's terms of service, so restaurant location data is instead documented from each restaurant's own official listing.

## Collection dates and freshness

Every `restaurants` and `menu_items` row carries `data_collected_at` (when first entered) and `last_checked_at` (most recent verification). The Choice Availability Score (see `ARCHITECTURE.md`) factors in how stale this data is, and the UI surfaces the last-checked date on every restaurant and dish page.

## Reliability

Reliability is not a single per-restaurant label — it's tracked per allergen assessment via the `confidence` field (`high` / `medium` / `low` / `insufficient`), derived from the `evidence_source` as described above.

## Usage rights

Only publicly available information intended for public consumption (restaurant websites, published menus) is used. No content is copied verbatim beyond short factual descriptions (dish names, prices, brief menu text) needed to identify and describe items; no restaurant logos, photography, or other copyrighted creative assets are reproduced.

## Dataset scope (as of this writing)

_To be filled in once the curated dataset (Phase 3) is complete: exact restaurant count, menu item count, and the specific San Diego neighborhood(s) covered._
