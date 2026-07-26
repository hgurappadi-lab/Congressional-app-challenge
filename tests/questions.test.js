import { describe, expect, it } from "vitest";
import { generateQuestions } from "../src/lib/questions";

describe("generateQuestions — allergens", () => {
  it("asks a general question when there is no evidence row for a selected allergy", () => {
    const questions = generateQuestions({
      allergies: [{ allergen: "peanuts", severity: "severe" }],
      itemAllergens: [],
      crossContactNotes: [{ note: "Shared fryer." }],
    });
    expect(questions).toEqual([
      "Does this dish contain peanuts, or is there a risk of cross-contact with it?",
    ]);
  });

  it("asks the same general question when the assessment is not_identified_in_available_source or unknown", () => {
    for (const assessment of ["not_identified_in_available_source", "unknown"]) {
      const questions = generateQuestions({
        allergies: [{ allergen: "peanuts" }],
        itemAllergens: [{ allergen: "peanuts", assessment }],
        crossContactNotes: [{ note: "Shared fryer." }],
      });
      expect(questions).toEqual([
        "Does this dish contain peanuts, or is there a risk of cross-contact with it?",
      ]);
    }
  });

  it("asks a confirmation question when the assessment is possible_based_on_description", () => {
    const questions = generateQuestions({
      allergies: [{ allergen: "sesame" }],
      itemAllergens: [{ allergen: "sesame", assessment: "possible_based_on_description" }],
      crossContactNotes: [{ note: "Shared fryer." }],
    });
    expect(questions).toEqual([
      "The description suggests this dish may contain sesame — can you confirm whether it does?",
    ]);
  });

  it("asks whether a documented modification is available when the allergen is confirmed present", () => {
    const questions = generateQuestions({
      allergies: [{ allergen: "milk" }],
      itemAllergens: [{ allergen: "milk", assessment: "restaurant_disclosed_contains" }],
      modifications: [{ description: "Can be made without cheese" }],
      crossContactNotes: [{ note: "Shared surfaces with dairy." }],
    });
    expect(questions).toEqual([
      "This dish is documented as containing milk, and a modification may address this — is that modification actually available?",
    ]);
  });

  it("asks nothing when the allergen is confirmed present with no matching modification", () => {
    const questions = generateQuestions({
      allergies: [{ allergen: "milk" }],
      itemAllergens: [{ allergen: "milk", assessment: "restaurant_disclosed_contains" }],
      modifications: [],
      crossContactNotes: [{ note: "Shared surfaces with dairy." }],
    });
    expect(questions).toEqual([]);
  });

  it("asks nothing when the restaurant discloses the allergen as absent", () => {
    const questions = generateQuestions({
      allergies: [{ allergen: "eggs" }],
      itemAllergens: [{ allergen: "eggs", assessment: "restaurant_disclosed_absent" }],
      crossContactNotes: [{ note: "No shared equipment with egg-containing dishes." }],
    });
    expect(questions).toEqual([]);
  });
});

describe("generateQuestions — dietary restrictions", () => {
  it("asks a general question when there is no evidence row or status is unknown", () => {
    for (const itemDietaryAttributes of [[], [{ attribute: "vegan", status: "unknown" }]]) {
      const questions = generateQuestions({
        dietaryRestrictions: ["vegan"],
        itemDietaryAttributes,
      });
      expect(questions).toEqual(["Is this dish vegan?"]);
    }
  });

  it("asks a confirmation question for possible or supported_by_ingredients", () => {
    for (const status of ["possible", "supported_by_ingredients"]) {
      const questions = generateQuestions({
        dietaryRestrictions: ["halal"],
        itemDietaryAttributes: [{ attribute: "halal", status }],
      });
      expect(questions).toEqual(["Can you confirm whether this dish is halal?"]);
    }
  });

  it("asks whether a documented modification is available when not_compatible with a matching modification", () => {
    const questions = generateQuestions({
      dietaryRestrictions: ["gluten_free"],
      itemDietaryAttributes: [{ attribute: "gluten_free", status: "not_compatible" }],
      modifications: [{ description: "Ask for the gluten-free crust" }],
    });
    expect(questions).toEqual([
      "This dish is documented as not compatible with gluten free as served, but a modification may address this — is that modification actually available?",
    ]);
  });

  it("asks nothing when not_compatible with no matching modification", () => {
    const questions = generateQuestions({
      dietaryRestrictions: ["gluten_free"],
      itemDietaryAttributes: [{ attribute: "gluten_free", status: "not_compatible" }],
      modifications: [],
    });
    expect(questions).toEqual([]);
  });

  it("asks nothing when restaurant_confirmed or certified", () => {
    for (const status of ["restaurant_confirmed", "certified"]) {
      const questions = generateQuestions({
        dietaryRestrictions: ["vegan"],
        itemDietaryAttributes: [{ attribute: "vegan", status }],
      });
      expect(questions).toEqual([]);
    }
  });
});

describe("generateQuestions — cross-contact", () => {
  it("asks a general cross-contact question when allergies are selected but no notes exist", () => {
    const questions = generateQuestions({
      allergies: [{ allergen: "peanuts" }],
      itemAllergens: [{ allergen: "peanuts", assessment: "restaurant_disclosed_absent" }],
      crossContactNotes: [],
    });
    expect(questions).toContain(
      "How is this dish prepared with respect to shared equipment, surfaces, and fryers that may also handle my allergens?",
    );
  });

  it("does not ask the cross-contact question when notes already exist", () => {
    const questions = generateQuestions({
      allergies: [{ allergen: "peanuts" }],
      itemAllergens: [{ allergen: "peanuts", assessment: "restaurant_disclosed_absent" }],
      crossContactNotes: [{ note: "Shared fryer with tree nuts." }],
    });
    expect(questions).toEqual([]);
  });

  it("does not ask the cross-contact question when no allergies are selected, regardless of dietary selections", () => {
    const questions = generateQuestions({
      dietaryRestrictions: ["vegan"],
      itemDietaryAttributes: [{ attribute: "vegan", status: "restaurant_confirmed" }],
      crossContactNotes: [],
    });
    expect(questions).toEqual([]);
  });
});

describe("generateQuestions — edge cases", () => {
  it("returns an empty array when nothing is selected", () => {
    expect(generateQuestions({})).toEqual([]);
  });
});
