// Dish compatibility classification (build plan §8, §15).
//
// Given a user's profile and a menu item's evidence rows, returns exactly
// one of the 5 documented classifications plus plain-language reasons.
// Never returns or implies "guaranteed safe" — the strongest category is
// "strong documented potential match," explicitly not a safety guarantee.

import { isAtLeast } from "./evidence";

export const CLASSIFICATIONS = {
  STRONG_MATCH: "strong_documented_potential_match",
  MODIFICATION_NEEDED: "modification_needed",
  CONFIRM_BEFORE_ORDERING: "confirm_before_ordering",
  ALLERGEN_IDENTIFIED: "allergen_identified",
  INSUFFICIENT_INFORMATION: "insufficient_information",
};

// Per-criterion severity, worst to best. The dish's overall classification
// is driven by the single worst severity among every allergen/dietary
// restriction the user selected — one bad allergen is enough to flag the
// whole dish, even if everything else about it looks fine.
const SEVERITY = {
  BLOCKING: 4, // explicitly contains the allergen / incompatible, no fix
  UNRESOLVED: 3, // no usable evidence either way
  NEEDS_CONFIRMATION: 2, // possible, or only weak-confidence favorable evidence
  MODIFIABLE: 1, // a documented modification addresses the concern
  CLEAR: 0, // confirmed absent/compatible with strong evidence
};

// Plain-language status per severity tier — used only to label the
// `criteria` entries returned below for UI grouping (e.g. "4 unknown"
// badges). Purely descriptive; does not affect the severity/classification
// logic above in any way.
const SEVERITY_STATUS = {
  [SEVERITY.BLOCKING]: "identified",
  [SEVERITY.UNRESOLVED]: "unknown",
  [SEVERITY.NEEDS_CONFIRMATION]: "needs_confirmation",
  [SEVERITY.MODIFIABLE]: "modifiable",
  [SEVERITY.CLEAR]: "clear",
};

const CONTAINS_ASSESSMENTS = new Set([
  "restaurant_disclosed_contains",
  "official_guide_contains",
  "ingredient_explicitly_listed",
]);

const DIETARY_COMPATIBLE_STATUSES = new Set([
  "restaurant_confirmed",
  "certified",
]);
const DIETARY_POSSIBLE_STATUSES = new Set([
  "possible",
  "supported_by_ingredients",
]);

// Lets a modification's free-text description (e.g. "ask for the
// gluten-free crust", "can be made without cheese") be matched to the
// allergen/dietary restriction it addresses. The modifications table has
// no structured link to a specific allergen, so this is a deliberately
// simple, explainable heuristic rather than a hard guarantee.
const CRITERION_SYNONYMS = {
  wheat: ["wheat", "gluten"],
  milk: ["milk", "dairy", "cheese"],
  tree_nuts: ["tree nut", "nuts", "almond", "cashew", "walnut", "pistachio"],
  peanuts: ["peanut"],
  eggs: ["egg"],
  soy: ["soy"],
  sesame: ["sesame"],
  fish: ["fish", "anchovy", "salmon", "tuna"],
  shellfish: ["shellfish", "shrimp", "crab", "clam", "mussel", "lobster"],
  gluten_free: ["gluten-free", "gluten free", "gluten"],
  vegan: ["vegan"],
  vegetarian: ["vegetarian"],
  lactose_free: ["lactose-free", "lactose free", "dairy-free", "dairy free"],
  halal: ["halal"],
  kosher: ["kosher"],
  pescatarian: ["pescatarian"],
};

export function label(id) {
  return id.replace(/_/g, " ");
}

export function isAddressedByModification(id, modifications) {
  const synonyms = CRITERION_SYNONYMS[id] || [id];
  return modifications.some((mod) =>
    synonyms.some((word) => mod.description.toLowerCase().includes(word)),
  );
}

function evaluateAllergen(allergenId, itemAllergens, modifications, matchingStrictness) {
  const evidence = itemAllergens.find((row) => row.allergen === allergenId);
  const name = label(allergenId);

  if (!evidence) {
    const cautious = matchingStrictness === "cautious";
    return {
      severity: cautious ? SEVERITY.NEEDS_CONFIRMATION : SEVERITY.UNRESOLVED,
      confidence: "insufficient",
      reason: `${name}: no information available for this dish.`,
    };
  }

  const { assessment, evidence_note: note, confidence } = evidence;

  if (CONTAINS_ASSESSMENTS.has(assessment)) {
    if (isAddressedByModification(allergenId, modifications)) {
      return {
        severity: SEVERITY.MODIFIABLE,
        confidence,
        reason: `${name}: ${note || "identified in this dish"}, but a documented modification may address this.`,
      };
    }
    return {
      severity: SEVERITY.BLOCKING,
      confidence,
      reason: note ? `${name}: ${note}` : `${name} was identified in this dish.`,
    };
  }

  if (assessment === "restaurant_disclosed_absent") {
    const strong = isAtLeast(confidence, "high");
    return {
      severity: strong ? SEVERITY.CLEAR : SEVERITY.NEEDS_CONFIRMATION,
      confidence,
      reason: note
        ? `${name}: ${note}`
        : `${name} was not identified as an ingredient, per the restaurant.`,
    };
  }

  if (assessment === "possible_based_on_description") {
    if (isAddressedByModification(allergenId, modifications)) {
      return {
        severity: SEVERITY.MODIFIABLE,
        confidence,
        reason: `${name}: ${note || "may be present based on an incomplete description"}, but a documented modification may address this.`,
      };
    }
    return {
      severity: SEVERITY.NEEDS_CONFIRMATION,
      confidence,
      reason: note
        ? `${name}: ${note}`
        : `${name} may be present, based on an incomplete description.`,
    };
  }

  // "not_identified_in_available_source" or "unknown".
  const cautious = matchingStrictness === "cautious";
  return {
    severity: cautious ? SEVERITY.NEEDS_CONFIRMATION : SEVERITY.UNRESOLVED,
    confidence,
    reason: note
      ? `${name}: ${note}`
      : `${name} was not identified in the available source, which may be incomplete.`,
  };
}

// Vegan implies vegetarian — never the reverse (a vegetarian dish may still
// contain dairy/eggs, which disqualify vegan). So when checking
// "vegetarian" and the dish has no vegetarian row of its own, a documented
// vegan row is still valid evidence for it. Checking "vegan" never falls
// back to a vegetarian row. Shared with questions.js so a user-facing
// classification and the generated staff questions can't disagree about
// what's already known for a dish.
export function findDietaryEvidence(restrictionId, itemDietaryAttributes) {
  const direct = itemDietaryAttributes.find((row) => row.attribute === restrictionId);
  if (direct) return direct;

  if (restrictionId === "vegetarian") {
    const veganEvidence = itemDietaryAttributes.find((row) => row.attribute === "vegan");
    // Only borrow it when the dish is (possibly) vegan — a vegan
    // disqualifier (dairy, egg) says nothing about whether the dish
    // separately contains meat, so a "not_compatible"/"unknown" vegan row
    // must NOT be read as evidence against vegetarian too.
    const isPositiveVeganEvidence =
      veganEvidence && veganEvidence.status !== "not_compatible" && veganEvidence.status !== "unknown";
    if (isPositiveVeganEvidence) return veganEvidence;
  }

  return undefined;
}

function evaluateDietaryRestriction(
  restrictionId,
  itemDietaryAttributes,
  modifications,
  matchingStrictness,
) {
  const evidence = findDietaryEvidence(restrictionId, itemDietaryAttributes);
  const name = label(restrictionId);

  if (!evidence) {
    const cautious = matchingStrictness === "cautious";
    return {
      severity: cautious ? SEVERITY.NEEDS_CONFIRMATION : SEVERITY.UNRESOLVED,
      confidence: "insufficient",
      reason: `${name}: no information available for this dish.`,
    };
  }

  const { status, confidence } = evidence;

  if (status === "not_compatible") {
    if (isAddressedByModification(restrictionId, modifications)) {
      return {
        severity: SEVERITY.MODIFIABLE,
        confidence,
        reason: `${name}: not compatible as served, but a documented modification may address this.`,
      };
    }
    return {
      severity: SEVERITY.BLOCKING,
      confidence,
      reason: `${name}: this dish is not compatible.`,
    };
  }

  if (DIETARY_COMPATIBLE_STATUSES.has(status)) {
    const strong = isAtLeast(confidence, "high");
    return {
      severity: strong ? SEVERITY.CLEAR : SEVERITY.NEEDS_CONFIRMATION,
      confidence,
      reason: `${name}: ${status === "certified" ? "certified" : "confirmed by the restaurant"}.`,
    };
  }

  if (DIETARY_POSSIBLE_STATUSES.has(status)) {
    if (isAddressedByModification(restrictionId, modifications)) {
      return {
        severity: SEVERITY.MODIFIABLE,
        confidence,
        reason: `${name}: possibly compatible, and a documented modification may help confirm this.`,
      };
    }
    return {
      severity: SEVERITY.NEEDS_CONFIRMATION,
      confidence,
      reason: `${name}: possibly compatible, based on ${
        status === "supported_by_ingredients" ? "ingredients" : "incomplete information"
      }.`,
    };
  }

  // status === "unknown"
  const cautious = matchingStrictness === "cautious";
  return {
    severity: cautious ? SEVERITY.NEEDS_CONFIRMATION : SEVERITY.UNRESOLVED,
    confidence,
    reason: `${name}: compatibility is unknown.`,
  };
}

// classifyDish({ allergies, dietaryRestrictions, matchingStrictness,
//   itemAllergens, itemDietaryAttributes, modifications, crossContactNotes })
//
// `allergies` is the user's profile shape: [{ allergen, severity }, ...].
// Severity is accepted but intentionally not used to change the category —
// the plan ties escalation to matching_strictness (a user-controlled
// setting), not per-allergen severity.
//
// Returns { classification, reasons, confidences, criteria }. `confidences`
// is the confidence tier behind each assessed criterion (see evidence.js's
// weakestConfidence) — intended for scoring.js to represent a dish's
// overall evidence quality as the weakest link among what was actually
// checked, not every confidence value in the dataset. `criteria` is a
// presentation-facing array (one entry per selected allergen/dietary
// restriction, in the same order as `reasons`/`confidences`) exposing the
// per-criterion status the UI needs for compact badges (e.g. "identified",
// "unknown") without re-parsing `reasons` strings. It is purely additive —
// does not affect `classification` and mirrors data already computed above.
export function classifyDish({
  allergies = [],
  dietaryRestrictions = [],
  matchingStrictness = "standard",
  itemAllergens = [],
  itemDietaryAttributes = [],
  modifications = [],
  crossContactNotes = [],
}) {
  const allergenResults = allergies.map((entry) => ({
    id: entry.allergen,
    kind: "allergen",
    label: label(entry.allergen),
    ...evaluateAllergen(entry.allergen, itemAllergens, modifications, matchingStrictness),
  }));
  const dietaryResults = dietaryRestrictions.map((restrictionId) => ({
    id: restrictionId,
    kind: "dietary",
    label: label(restrictionId),
    ...evaluateDietaryRestriction(
      restrictionId,
      itemDietaryAttributes,
      modifications,
      matchingStrictness,
    ),
  }));
  const results = [...allergenResults, ...dietaryResults];
  const reasons = results.map((r) => r.reason);
  const confidences = results.map((r) => r.confidence);
  // Additive, presentation-facing detail per selected criterion — the same
  // data already computed above, just not discarded. Does not affect
  // `classification`/`reasons`/`confidences` below in any way.
  const criteria = results.map((r) => ({
    id: r.id,
    kind: r.kind,
    label: r.label,
    status: SEVERITY_STATUS[r.severity],
    confidence: r.confidence,
    reason: r.reason,
  }));

  if (results.length === 0) {
    return {
      classification: CLASSIFICATIONS.STRONG_MATCH,
      reasons: [
        "No allergies or dietary restrictions were selected, so no concerns were evaluated for this dish.",
      ],
      // Nothing to be uncertain about when nothing was selected.
      confidences: ["high"],
      criteria: [],
    };
  }

  const worst = Math.max(...results.map((r) => r.severity));

  if (worst === SEVERITY.BLOCKING) {
    return { classification: CLASSIFICATIONS.ALLERGEN_IDENTIFIED, reasons, confidences, criteria };
  }
  if (worst === SEVERITY.UNRESOLVED) {
    return {
      classification: CLASSIFICATIONS.INSUFFICIENT_INFORMATION,
      reasons,
      confidences,
      criteria,
    };
  }
  if (worst === SEVERITY.NEEDS_CONFIRMATION) {
    return {
      classification: CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING,
      reasons,
      confidences,
      criteria,
    };
  }
  if (worst === SEVERITY.MODIFIABLE) {
    return { classification: CLASSIFICATIONS.MODIFICATION_NEEDED, reasons, confidences, criteria };
  }

  // worst === SEVERITY.CLEAR: every selected allergen/restriction is
  // confirmed absent or compatible with strong evidence. Under
  // cross-contact-sensitive strictness, that still isn't enough if the
  // dish has no documented cross-contact information at all.
  if (matchingStrictness === "cross_contact_sensitive" && crossContactNotes.length === 0) {
    return {
      classification: CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING,
      reasons: [
        ...reasons,
        "Cross-contact information is unknown for this dish. Confirm directly with the restaurant.",
      ],
      confidences,
      criteria,
    };
  }

  return { classification: CLASSIFICATIONS.STRONG_MATCH, reasons, confidences, criteria };
}
