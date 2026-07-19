# Limitations

This is a Congressional App Challenge competition prototype, not a production or commercial application. Its limitations are disclosed here deliberately, and repeated in the app UI, the demo video, and the written submission.

## Geographic coverage

Covers one San Diego area / a small group of neighborhoods only — roughly 15–30 restaurants. It is not a nationwide product and does not claim to be.

## Menu and allergen data completeness

Menu items (~100–300) and their allergen/ingredient/cross-contact data are manually curated from each restaurant's own public materials, not comprehensive or automatically kept in sync with the restaurant's actual current menu. See `DATA_SOURCES.md` for exactly what was collected and when.

## Data can go stale

Restaurant recipes, ingredients, suppliers, and kitchen procedures can change at any time without this dataset being updated. Every record shows its last-checked date so users can judge freshness themselves, but the app cannot detect changes automatically in this version.

## Cross-contact information is often unavailable

Shared-equipment and cross-contact information is only shown when a restaurant source directly documents it. Its absence is displayed as "unknown," never as evidence of safety.

## AI limitations

Deterministic, rule-based logic (not live AI inference) drives allergen classification, scoring, and question generation in this version — this is a deliberate design choice, not an oversight, so results stay explainable and testable (see `ARCHITECTURE.md`). Any AI-assisted natural-language craving interpretation (a stretch feature) would only ever suggest which dishes to look at — it does not and will not determine the structured allergen classification itself.

## No medical guarantee

This app is a decision-support and discovery tool, not a medical device and not a guarantee of allergen safety. It never uses language like "safe," "allergy-proof," or "guaranteed allergen-free." Users are always directed to confirm directly with restaurant staff before ordering. See the disclaimer in `README.md` and `SECURITY_AND_PRIVACY.md`.

## Need to confirm directly with the restaurant

Every recommendation in this app is a starting point for a conversation with restaurant staff, not a replacement for it — especially for users with severe or cross-contact-sensitive allergies.

## Other known prototype-stage limitations

- Restaurant participation/claiming, community reporting, restaurant-owner accounts, and multilingual question translation are stretch features, not in the MVP.
- No mobile app store distribution — this is a responsive web app.
- No automated/scheduled data refresh; updates are manual.

_This list is updated as development continues._
