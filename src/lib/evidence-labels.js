// Plain-language display labels for the raw evidence enum values stored in
// item_allergens.assessment, item_dietary_attributes.status, and the
// evidence_source column shared across item_allergens /
// item_dietary_attributes / modifications / cross_contact_notes (see the
// CHECK constraints in supabase/schema.sql). Parallel to
// classification-labels.js — one labels file per concern.
//
// CRITICAL (build plan §5): absence of evidence is never proof of absence.
// Nothing here may read as "safe," "free from X," or "guaranteed" — same
// constraint classification.js's evaluateAllergen/evaluateDietaryRestriction
// already respect for the derived reasons.

// Mirrors item_allergens.assessment's CHECK constraint.
export const ASSESSMENT_VALUES = [
  "restaurant_disclosed_contains",
  "official_guide_contains",
  "ingredient_explicitly_listed",
  "possible_based_on_description",
  "not_identified_in_available_source",
  "restaurant_disclosed_absent",
  "unknown",
];

export const ASSESSMENT_LABELS = {
  restaurant_disclosed_contains: "Restaurant states this dish contains this ingredient.",
  official_guide_contains:
    "Documented as containing this ingredient in an official allergen guide.",
  ingredient_explicitly_listed: "This ingredient is explicitly listed for this dish.",
  possible_based_on_description:
    "May be present, based on an incomplete description — not confirmed either way.",
  not_identified_in_available_source:
    "Not identified in the available source, which may be incomplete.",
  restaurant_disclosed_absent:
    "Restaurant states this is not an ingredient (this does not guarantee no cross-contact).",
  unknown: "No assessment is available for this dish.",
};

// Mirrors item_dietary_attributes.status's CHECK constraint.
export const DIETARY_STATUS_VALUES = [
  "restaurant_confirmed",
  "certified",
  "supported_by_ingredients",
  "possible",
  "not_compatible",
  "unknown",
];

export const DIETARY_STATUS_LABELS = {
  restaurant_confirmed: "Restaurant confirms this dish meets this dietary requirement.",
  certified: "Certified as meeting this dietary requirement.",
  supported_by_ingredients:
    "Appears compatible based on the listed ingredients — not independently confirmed.",
  possible: "Possibly compatible, based on incomplete information.",
  not_compatible: "Documented as not compatible with this dietary requirement.",
  unknown: "Compatibility with this dietary requirement is unknown.",
};

// evidence_source is shared by 4 tables — reuse the canonical list already
// exported by evidence.js rather than redeclaring it here.
export const EVIDENCE_SOURCE_LABELS = {
  official_allergen_guide: "Official allergen guide",
  official_ingredient_list: "Official ingredient list",
  official_menu_description: "Official menu description",
  restaurant_written_confirmation: "Restaurant's written confirmation",
  student_analysis_of_public_description: "Student analysis of a public description",
  community_report: "Community report",
  unknown: "Source unknown",
};
