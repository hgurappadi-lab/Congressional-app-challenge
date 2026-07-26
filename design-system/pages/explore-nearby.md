# Explore Nearby (and Favorites' restaurant cards) — page-specific override

Deviations from `design-system/MASTER.md`'s original card-hierarchy rule,
requested directly by the user (2026-07-24) after seeing the compact
restaurant cards as too text-heavy for a results list meant to be scanned
quickly. Scoped to `RestaurantResultCard.js` (used on Explore Nearby and
Favorites). `DishResultCard.js` (Find a Dish, restaurant-detail menus) was
later simplified to the same minimal shape — name, meta line, one status
badge, "View details" — during the broader "cut unnecessary text
everywhere" pass (2026-07-24, see `dish-and-restaurant-detail.md`); both
compact-card components now match.

- **Card content, in full:** name, distance, cuisine, one status-tier
  badge, "View restaurant." That's it.
- **Removed from the compact card:** the 1–2 sentence explanation, the up-
  to-4 count/evidence badges, and the inline "Why this score?" expansion.
  None of this is deleted data — the restaurant detail page's
  `ScoreSummary` still shows the full major-factors list and "Why this
  score?" still expands the complete `explanation[]`. This is purely
  "click through to see everything," per the user's own framing.
- **Why:** the user's exact words: "once people click on it then they can
  see all the things they need" — the list is for scanning many
  restaurants at a glance, not for evaluating one in place.
