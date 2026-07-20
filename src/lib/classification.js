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

function label(id) {
  return id.replace(/_/g, " ");
}

function isAddressedByModification(id, modifications) {
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

function evaluateDietaryRestriction(
  restrictionId,
  itemDietaryAttributes,
  modifications,
  matchingStrictness,
) {
  const evidence = itemDietaryAttributes.find(
    (row) => row.attribute === restrictionId,
  );
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
// Returns { classification, reasons, confidences }. `confidences` is the
// confidence tier behind each assessed criterion (see evidence.js's
// weakestConfidence) — intended for scoring.js to represent a dish's
// overall evidence quality as the weakest link among what was actually
// checked, not every confidence value in the dataset.
export function classifyDish({
  allergies = [],
  dietaryRestrictions = [],
  matchingStrictness = "standard",
  itemAllergens = [],
  itemDietaryAttributes = [],
  modifications = [],
  crossContactNotes = [],
}) {
  const allergenResults = allergies.map((entry) =>
    evaluateAllergen(entry.allergen, itemAllergens, modifications, matchingStrictness),
  );
  const dietaryResults = dietaryRestrictions.map((restrictionId) =>
    evaluateDietaryRestriction(
      restrictionId,
      itemDietaryAttributes,
      modifications,
      matchingStrictness,
    ),
  );
  const results = [...allergenResults, ...dietaryResults];
  const reasons = results.map((r) => r.reason);
  const confidences = results.map((r) => r.confidence);

  if (results.length === 0) {
    return {
      classification: CLASSIFICATIONS.STRONG_MATCH,
      reasons: [
        "No allergies or dietary restrictions were selected, so no concerns were evaluated for this dish.",
      ],
      // Nothing to be uncertain about when nothing was selected.
      confidences: ["high"],
    };
  }

  const worst = Math.max(...results.map((r) => r.severity));

  if (worst === SEVERITY.BLOCKING) {
    return { classification: CLASSIFICATIONS.ALLERGEN_IDENTIFIED, reasons, confidences };
  }
  if (worst === SEVERITY.UNRESOLVED) {
    return {
      classification: CLASSIFICATIONS.INSUFFICIENT_INFORMATION,
      reasons,
      confidences,
    };
  }
  if (worst === SEVERITY.NEEDS_CONFIRMATION) {
    return {
      classification: CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING,
      reasons,
      confidences,
    };
  }
  if (worst === SEVERITY.MODIFIABLE) {
    return { classification: CLASSIFICATIONS.MODIFICATION_NEEDED, reasons, confidences };
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
    };
  }

  return { classification: CLASSIFICATIONS.STRONG_MATCH, reasons, confidences };
}
