# Dish detail, restaurant detail, and Find a Dish — page-specific overrides

Deviations from `design-system/MASTER.md`, requested directly by the user
(2026-07-24) after seeing the dish detail page as too wordy and the
restaurant detail menu as a wall of "insufficient information" dishes. The
user's framing: "if there is no information on something... I don't even
want to see it," and "just recommend the best dish, highlight it, and make
clear this is not 100%." The instruction to cut unnecessary/repetitive text
was general ("for the entire website"), but explicitly carved out one
exception: the safety/warning disclaimer text stays repeated everywhere it
already appears — nothing here reduces warning visibility.

## Dish detail (`DishDetailClient.js`)

- Allergen and dietary-restriction rows are hidden entirely when there is no
  evidence either way (`assessment`/`status` of `unknown`) — no more "no
  assessment available" placeholder rows. A row only renders when there is
  something documented to show.
- The user's selected allergens/dietary restrictions and everything else are
  merged into one "Your allergy checks" + collapsed "Other allergen
  information" pair, replacing the previous separate always-rendered
  Allergens / Dietary fit sections.
- "Available modifications" and "Cross-contact" sections only render at all
  when there is at least one real entry — no more "no modifications
  documented" placeholders.
- Sources and dates, and the full `SafetyDisclaimer`, are unconditional and
  unchanged — evidence provenance and the safety warning are never hidden.

## Restaurant detail menu (`RestaurantDetailClient.js`) and Find a Dish (`MapPageClient.js`)

Both pages matched dishes into one flat list before, "insufficient
information" and "allergen identified" dishes included. Both now share the
same "recommended vs. rest" split, via `getRecommendedDishes()` in
`src/lib/result-summary.js`:

- **Recommended for you** — up to 3 (restaurant menu) or 5 (Find a Dish,
  since it spans many restaurants) dishes classified as strong match,
  modification needed, or confirm-before-ordering, best-first. The top one
  gets `DishResultCard`'s `highlight` treatment ("Best match here" badge).
  A `SafetyReminder` line sits directly above the list as the "not 100%"
  caveat the user asked for.
- **Everything else** — collapsed by default ("See full menu (N items)" /
  "See more results (N)"), grouped by category on the restaurant page,
  flat on Find a Dish. Nothing is deleted; a dish that's undocumented for
  this profile is still reachable, just not shown by default.
- If nothing qualifies as recommended, an `EmptyState` says so plainly
  instead of silently showing zero results — the full/rest list still
  renders below it so real menu data is never hidden entirely.
