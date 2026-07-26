// Restaurant-staff question generator (build plan §15).
//
// Template-based and deterministic: given a user's profile and a menu
// item's evidence rows, returns plain-language questions that close the
// specific gaps in the documented evidence. Reuses classification.js's
// modification-matching heuristic (isAddressedByModification) and id->label
// helper (label) so that logic can't diverge between the classification
// and the question generator.
//
// Templates are generic ("this dish") rather than parameterized by dish
// name, so the page decides how to phrase things around the returned list.

import { isAddressedByModification, label, findDietaryEvidence } from "./classification";

const CONTAINS_ASSESSMENTS = new Set([
  "restaurant_disclosed_contains",
  "official_guide_contains",
  "ingredient_explicitly_listed",
]);

const UNRESOLVED_ALLERGEN_ASSESSMENTS = new Set([
  "not_identified_in_available_source",
  "unknown",
]);

// generateQuestions({ allergies, dietaryRestrictions, itemAllergens,
//   itemDietaryAttributes, modifications, crossContactNotes }) -> string[]
export function generateQuestions({
  allergies = [],
  dietaryRestrictions = [],
  itemAllergens = [],
  itemDietaryAttributes = [],
  modifications = [],
  crossContactNotes = [],
}) {
  const questions = [];

  for (const entry of allergies) {
    const allergenId = entry.allergen;
    const name = label(allergenId);
    const evidence = itemAllergens.find((row) => row.allergen === allergenId);

    if (!evidence || UNRESOLVED_ALLERGEN_ASSESSMENTS.has(evidence.assessment)) {
      questions.push(
        `Does this dish contain ${name}, or is there a risk of cross-contact with it?`,
      );
      continue;
    }

    if (evidence.assessment === "possible_based_on_description") {
      questions.push(
        `The description suggests this dish may contain ${name} — can you confirm whether it does?`,
      );
      continue;
    }

    if (
      CONTAINS_ASSESSMENTS.has(evidence.assessment) &&
      isAddressedByModification(allergenId, modifications)
    ) {
      questions.push(
        `This dish is documented as containing ${name}, and a modification may address this — is that modification actually available?`,
      );
    }
    // restaurant_disclosed_absent, or contains-with-no-modification: no
    // question — either resolved, or nothing more to ask.
  }

  for (const restrictionId of dietaryRestrictions) {
    const name = label(restrictionId);
    const evidence = findDietaryEvidence(restrictionId, itemDietaryAttributes);

    if (!evidence || evidence.status === "unknown") {
      questions.push(`Is this dish ${name}?`);
      continue;
    }

    if (evidence.status === "possible" || evidence.status === "supported_by_ingredients") {
      questions.push(`Can you confirm whether this dish is ${name}?`);
      continue;
    }

    if (
      evidence.status === "not_compatible" &&
      isAddressedByModification(restrictionId, modifications)
    ) {
      questions.push(
        `This dish is documented as not compatible with ${name} as served, but a modification may address this — is that modification actually available?`,
      );
    }
    // restaurant_confirmed/certified, or not_compatible-with-no-modification:
    // no question.
  }

  if (allergies.length > 0 && crossContactNotes.length === 0) {
    questions.push(
      "How is this dish prepared with respect to shared equipment, surfaces, and fryers that may also handle my allergens?",
    );
  }

  return questions;
}
