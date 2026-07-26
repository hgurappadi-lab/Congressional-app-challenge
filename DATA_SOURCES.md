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

Leaflet + OpenStreetMap is used only for live, client-side map rendering (tiles, markers) — it is not used to bulk-populate the restaurant database. Restaurant location data (address, latitude/longitude) is instead documented from each restaurant's own official listing, same as every other field in the dataset. A restaurant's Google Maps link (shown on its detail page) is built directly from its stored address at render time, not from a live Places/Geocoding lookup.

## Collection dates and freshness

Every `restaurants` and `menu_items` row carries `data_collected_at` (when first entered) and `last_checked_at` (most recent verification). The Choice Availability Score (see `ARCHITECTURE.md`) factors in how stale this data is, and the UI surfaces the last-checked date on every restaurant and dish page.

## Reliability

Reliability is not a single per-restaurant label — it's tracked per allergen assessment via the `confidence` field (`high` / `medium` / `low` / `insufficient`), derived from the `evidence_source` as described above.

## Usage rights

Only publicly available information intended for public consumption (restaurant websites, published menus) is used. No content is copied verbatim beyond short factual descriptions (dish names, prices, brief menu text) needed to identify and describe items; no restaurant logos, photography, or other copyrighted creative assets are reproduced.

## Dataset scope (as of this writing)

**Collected 2026-07-20, updated 2026-07-23** — 21 restaurants, 79 menu items, within a 15-mile radius of a North San Diego County reference point (32.9670, -117.1717 — Torrey Highlands/Rancho del Sol), spanning Rancho Bernardo, Carmel Mountain Ranch, Poway, Mira Mesa, La Jolla, Carmel Valley, Del Mar, Solana Beach, Encinitas, and University Heights. This meets the plan's 15–30 restaurant MVP target.

**Dietary-attribute completeness pass (2026-07-23):** Many items had no `vegetarian`/`vegan`/`gluten_free` row at all even when their own name or description made the answer obvious (e.g. "Salt & Pepper Chicken Wings" had no vegetarian assessment, so it read as merely "insufficient information" instead of a clear conflict). Applied a conservative, word-boundary keyword pass across every item's name + description: unambiguous meat/poultry/seafood terms (chicken, beef, pork, shrimp, fish, etc.) → `vegetarian`/`vegan`: `not_compatible`; dairy/egg terms with no meat present → `vegan`: `not_compatible` only; explicit "vegan"/"vegetarian"/"veggie" wording → the corresponding positive attribute; a "GF " name prefix or explicit "gluten-free" wording → `gluten_free`: `restaurant_confirmed` (this caught 3 P.F. Chang's items and a True Food Kitchen pizza that were missing the gluten-free tag despite it being in the item's own name). All additions use `evidence_source: official_menu_description` at `high` confidence, since the dish's own published name/description is the evidence. The pass deliberately left alone anything not obvious from the name/description alone — e.g. Caesar dressings' common (but unstated) anchovy content, or dishes where a protein is described as "optional"/an add-on — rather than assume either way. Two false positives from an early, cruder version of this pass were caught and corrected before seeding: "mock chicken" (a plant-based protein) and "chicken optional" both briefly triggered the meat-keyword rule; both were fixed to not assert a meat-based conflict.

| Restaurant | Cuisine | Evidence quality |
|---|---|---|
| Chipotle Mexican Grill | Mexican | Official allergen/ingredient statement — added a "Sofritas Vegan Bowl" (2026-07-23), Chipotle's own well-documented no-cheese/no-sour-cream vegan build, sourced from the same official allergen page as its other items. Its blanket "we do not use eggs, mustard, peanuts, tree nuts, sesame, shellfish, or fish" statement was curated at `medium` confidence (2026-07-24 fix: raised to `high`) — an explicit, company-wide published exclusion list is as clear as evidence gets, and the `medium` value had been an unnecessarily cautious holdover from initial curation |
| CAVA | Mediterranean | Official per-item allergen guide (PDF) — Harissa Avocado Bowl and Falafel Crunch Bowl got added vegan assessments (2026-07-23), cross-referenced against third-party vegan-ordering guides (godairyfree.org, PETA) that map CAVA's own published ingredients/dressings to vegan status, since CAVA's own site doesn't label specific bowl combinations vegan itself — recorded as `student_analysis_of_public_description`, not `official_allergen_guide`, to reflect that distinction honestly |
| In-N-Out Burger | Burgers | Official allergen chart (PDF) |
| True Food Kitchen | Health-focused American | Official seasonal nutritional/allergen guide (PDF) |
| P.F. Chang's | Chinese/Asian Fusion | Official gluten-free menu page |
| Panera Bread | Bakery-Cafe | Official allergen page exists; item-level PDF was inaccessible during collection, so items are conservatively sourced from public descriptions |
| Plant Power Fast Food | Vegan Fast Food | Restaurant-confirmed 100% plant-based; named ingredients per item |
| Nectarine Grove | American (Gluten-Free) | Restaurant-confirmed 100% gluten-free; named ingredients per item |
| Sweetgreen | Salads | Public menu description only — low confidence throughout |
| Casa Lahori | Pakistani (halal) | Restaurant-stated halal; no published ingredient list — mostly `unknown`/low-confidence allergens |
| Spoon Thai Kitchen | Thai | Dish names only — low-confidence allergens based on typical preparation |
| Burma Place | Burmese | Restaurant's own menu descriptions; allergens beyond that are low-confidence |
| The Shop: Pizza + Cocktails | Pizza | Restaurant's own menu descriptions; offers a gluten-free crust option |
| Carmel Sushi | Japanese | Third-party aggregator only — low-confidence allergens |
| Pho Ca Dao & Grill | Vietnamese | Real menu/prices; low-confidence allergens based on typical preparation |
| Indian Tandoor | Indian | Real menu/prices; named ingredients per item |
| Aqua Mare Cucina Italiana | Italian | Real menu/prices; named ingredients per item |
| Manna Heaven BBQ | Korean BBQ | Real menu/prices; low-confidence allergens based on typical preparation |
| Szechuan House | Chinese (Szechuan) | Real dish names; low-confidence allergens based on typical preparation |
| The Fish Market - Del Mar | Seafood | Named ingredients per item; preparation-based allergens for items like batter |
| Plumeria Vegetarian Restaurant | Thai (Vegetarian) | Real menu/prices from the restaurant's own posted menu (via a third-party aggregator reproducing it, since the restaurant's own menu page 404'd during collection); ~14.2 mi from the reference point, near the outer edge of the dataset radius |

This mix is intentional: the chains with official per-item allergen guides (CAVA, In-N-Out, True Food Kitchen, Chipotle, P.F. Chang's) demonstrate the app's high-confidence `official_allergen_guide` path end-to-end. Plant Power and Nectarine Grove demonstrate strong restaurant-level dietary claims (100% vegan / 100% gluten-free). The remaining independents demonstrate the low-confidence / `unknown` path that is just as central to the product's honesty model — most have no published ingredient list at all, so assessments are conservatively based on typical preparation for that dish, not assumed. Plumeria is also the first restaurant with a *restaurant-level* cross-contact note (its own site states the kitchen isn't gluten-free) rather than only per-dish notes — `scripts/seed-restaurants.js` was extended to seed `cross_contact_notes.restaurant_id`, a capability the schema already had but no prior seed data exercised.

One candidate restaurant (2Good2B Bakery & Cafe) was dropped after research showed both of its San Diego-area locations are permanently closed — the dataset only includes restaurants confirmed operating as of collection date.
