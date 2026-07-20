import { describe, expect, it } from "vitest";
import { classifyDish, CLASSIFICATIONS } from "../src/lib/classification";

describe("classifyDish — edge cases", () => {
  it("returns a strong match when no allergies or dietary restrictions are selected", () => {
    const result = classifyDish({
      allergies: [],
      dietaryRestrictions: [],
      itemAllergens: [
        { allergen: "peanuts", assessment: "official_guide_contains", confidence: "high" },
      ],
    });
    expect(result.classification).toBe(CLASSIFICATIONS.STRONG_MATCH);
    expect(result.reasons).toHaveLength(1);
  });

  it("treats every selected allergen with no evidence row as insufficient information", () => {
    const result = classifyDish({
      allergies: [{ allergen: "sesame", severity: "moderate" }],
      itemAllergens: [], // dish has no allergen data at all
    });
    expect(result.classification).toBe(CLASSIFICATIONS.INSUFFICIENT_INFORMATION);
  });

  it("treats not_identified_in_available_source as insufficient under standard strictness", () => {
    const result = classifyDish({
      allergies: [{ allergen: "fish", severity: "mild" }],
      matchingStrictness: "standard",
      itemAllergens: [
        { allergen: "fish", assessment: "not_identified_in_available_source", confidence: "low" },
      ],
    });
    expect(result.classification).toBe(CLASSIFICATIONS.INSUFFICIENT_INFORMATION);
  });
});

describe("classifyDish — the 5 categories", () => {
  it("ALLERGEN_IDENTIFIED when an allergen is explicitly disclosed and no modification addresses it", () => {
    const result = classifyDish({
      allergies: [{ allergen: "peanuts", severity: "severe" }],
      itemAllergens: [
        {
          allergen: "peanuts",
          assessment: "official_guide_contains",
          evidence_source: "official_allergen_guide",
          confidence: "high",
          evidence_note: "Contains peanuts.",
        },
      ],
    });
    expect(result.classification).toBe(CLASSIFICATIONS.ALLERGEN_IDENTIFIED);
    expect(result.reasons[0]).toContain("Contains peanuts");
  });

  it("MODIFICATION_NEEDED when a disclosed allergen has a documented modification that removes it (conflicting evidence resolves predictably)", () => {
    const result = classifyDish({
      allergies: [{ allergen: "milk", severity: "moderate" }],
      itemAllergens: [
        {
          allergen: "milk",
          assessment: "ingredient_explicitly_listed",
          confidence: "medium",
          evidence_note: "Cheese is named directly in the dish.",
        },
      ],
      modifications: [
        { description: "Can be made without cheese upon request." },
      ],
    });
    expect(result.classification).toBe(CLASSIFICATIONS.MODIFICATION_NEEDED);
  });

  it("CONFIRM_BEFORE_ORDERING when an allergen is only possibly present with no modification", () => {
    const result = classifyDish({
      allergies: [{ allergen: "shellfish", severity: "moderate" }],
      itemAllergens: [
        {
          allergen: "shellfish",
          assessment: "possible_based_on_description",
          confidence: "low",
          evidence_note: "Fish sauce is a common base ingredient.",
        },
      ],
    });
    expect(result.classification).toBe(CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING);
  });

  it("CONFIRM_BEFORE_ORDERING when the only evidence of absence is weak confidence, not strong", () => {
    const result = classifyDish({
      allergies: [{ allergen: "wheat", severity: "mild" }],
      itemAllergens: [
        { allergen: "wheat", assessment: "restaurant_disclosed_absent", confidence: "medium" },
      ],
    });
    expect(result.classification).toBe(CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING);
  });

  it("INSUFFICIENT_INFORMATION when the allergen isn't identified in the available source", () => {
    const result = classifyDish({
      allergies: [{ allergen: "tree_nuts", severity: "moderate" }],
      itemAllergens: [
        {
          allergen: "tree_nuts",
          assessment: "not_identified_in_available_source",
          confidence: "low",
        },
      ],
    });
    expect(result.classification).toBe(CLASSIFICATIONS.INSUFFICIENT_INFORMATION);
  });

  it("STRONG_MATCH when every selected allergen is confirmed absent with high-confidence evidence", () => {
    const result = classifyDish({
      allergies: [{ allergen: "eggs", severity: "severe" }],
      itemAllergens: [
        {
          allergen: "eggs",
          assessment: "restaurant_disclosed_absent",
          evidence_source: "official_allergen_guide",
          confidence: "high",
        },
      ],
      crossContactNotes: [{ note: "Produced in a shared facility." }],
    });
    expect(result.classification).toBe(CLASSIFICATIONS.STRONG_MATCH);
  });
});

describe("classifyDish — dietary restrictions", () => {
  it("ALLERGEN_IDENTIFIED when a dietary restriction is not compatible and unaddressed", () => {
    const result = classifyDish({
      dietaryRestrictions: ["halal"],
      itemDietaryAttributes: [{ attribute: "halal", status: "not_compatible" }],
    });
    expect(result.classification).toBe(CLASSIFICATIONS.ALLERGEN_IDENTIFIED);
  });

  it("STRONG_MATCH when a dietary restriction is restaurant-confirmed with strong evidence", () => {
    const result = classifyDish({
      dietaryRestrictions: ["halal"],
      itemDietaryAttributes: [
        { attribute: "halal", status: "restaurant_confirmed", confidence: "high" },
      ],
    });
    expect(result.classification).toBe(CLASSIFICATIONS.STRONG_MATCH);
  });

  it("the single worst criterion determines the outcome across mixed allergens and restrictions", () => {
    const result = classifyDish({
      allergies: [{ allergen: "milk", severity: "mild" }],
      dietaryRestrictions: ["halal"],
      itemAllergens: [
        { allergen: "milk", assessment: "restaurant_disclosed_absent", confidence: "high" },
      ],
      itemDietaryAttributes: [{ attribute: "halal", status: "not_compatible" }],
    });
    expect(result.classification).toBe(CLASSIFICATIONS.ALLERGEN_IDENTIFIED);
    expect(result.reasons).toHaveLength(2);
  });
});

describe("classifyDish — matching strictness effects", () => {
  it("cautious moves an unresolved allergen into confirm-before-ordering instead of insufficient information", () => {
    const base = {
      allergies: [{ allergen: "sesame", severity: "moderate" }],
      itemAllergens: [
        { allergen: "sesame", assessment: "unknown", confidence: "insufficient" },
      ],
    };
    expect(classifyDish({ ...base, matchingStrictness: "standard" }).classification).toBe(
      CLASSIFICATIONS.INSUFFICIENT_INFORMATION,
    );
    expect(classifyDish({ ...base, matchingStrictness: "cautious" }).classification).toBe(
      CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING,
    );
  });

  it("cross_contact_sensitive downgrades an otherwise-strong match when no cross-contact info is documented", () => {
    const base = {
      allergies: [{ allergen: "peanuts", severity: "severe" }],
      itemAllergens: [
        {
          allergen: "peanuts",
          assessment: "restaurant_disclosed_absent",
          confidence: "high",
        },
      ],
      crossContactNotes: [],
    };
    expect(classifyDish({ ...base, matchingStrictness: "standard" }).classification).toBe(
      CLASSIFICATIONS.STRONG_MATCH,
    );
    const strict = classifyDish({ ...base, matchingStrictness: "cross_contact_sensitive" });
    expect(strict.classification).toBe(CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING);
    expect(strict.reasons.at(-1)).toContain("Cross-contact information is unknown");
  });

  it("cross_contact_sensitive does not downgrade a match when cross-contact info is documented", () => {
    const result = classifyDish({
      allergies: [{ allergen: "peanuts", severity: "severe" }],
      matchingStrictness: "cross_contact_sensitive",
      itemAllergens: [
        {
          allergen: "peanuts",
          assessment: "restaurant_disclosed_absent",
          confidence: "high",
        },
      ],
      crossContactNotes: [{ note: "Fried in a peanut-free fryer." }],
    });
    expect(result.classification).toBe(CLASSIFICATIONS.STRONG_MATCH);
  });
});
