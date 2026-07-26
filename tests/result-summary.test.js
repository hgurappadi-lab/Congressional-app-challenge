import { describe, expect, it } from "vitest";
import { classifyDish, CLASSIFICATIONS } from "../src/lib/classification";
import {
  formatList,
  scoreTierLabel,
  summarizeRestaurantResult,
  summarizeDishResult,
  summarizeScoreFactors,
} from "../src/lib/result-summary";

describe("formatList", () => {
  it("joins with a conjunction", () => {
    expect(formatList(["milk"])).toBe("milk");
    expect(formatList(["milk", "eggs"])).toBe("milk and eggs");
    expect(formatList(["milk", "eggs", "soy"])).toBe("milk, eggs, and soy");
  });
});

describe("scoreTierLabel", () => {
  it("buckets the numeric score into a qualitative label", () => {
    expect(scoreTierLabel(80)).toBe("Good choice availability");
    expect(scoreTierLabel(45)).toBe("Moderate choice availability");
    expect(scoreTierLabel(10)).toBe("Limited choice availability");
  });
});

describe("summarizeRestaurantResult", () => {
  it("leads with strong matches and caps badges at 4", () => {
    const { explanation, badges } = summarizeRestaurantResult({
      classificationCounts: {
        [CLASSIFICATIONS.STRONG_MATCH]: 5,
        [CLASSIFICATIONS.MODIFICATION_NEEDED]: 2,
        [CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING]: 1,
        [CLASSIFICATIONS.ALLERGEN_IDENTIFIED]: 1,
        [CLASSIFICATIONS.INSUFFICIENT_INFORMATION]: 1,
      },
    });
    expect(explanation).toContain("5 documented potential matches");
    expect(badges.length).toBeLessThanOrEqual(4);
  });

  it("falls back to a neutral explanation when nothing is documented", () => {
    const { explanation } = summarizeRestaurantResult({ classificationCounts: {} });
    expect(explanation).toBe("Not enough information is available for this menu yet.");
  });
});

describe("summarizeDishResult", () => {
  it("prioritizes an identified allergen and mentions unknowns second", () => {
    const result = classifyDish({
      allergies: [
        { allergen: "milk" },
        { allergen: "eggs" },
        { allergen: "soy" },
        { allergen: "peanuts" },
        { allergen: "sesame" },
      ],
      itemAllergens: [
        { allergen: "milk", assessment: "ingredient_explicitly_listed", confidence: "high", evidence_note: "ricotta is listed" },
      ],
    });
    const { explanation, badges } = summarizeDishResult({ criteria: result.criteria });
    expect(explanation).toContain("ricotta is listed");
    expect(explanation).toContain("unavailable");
    expect(badges.some((b) => b.label.includes("identified"))).toBe(true);
    expect(badges.some((b) => b.label.includes("unknown"))).toBe(true);
  });

  it("handles no selected criteria", () => {
    const { explanation, badges } = summarizeDishResult({ criteria: [] });
    expect(explanation).toBe("No allergies or dietary restrictions were selected to check.");
    expect(badges).toHaveLength(0);
  });
});

describe("summarizeScoreFactors", () => {
  it("returns at most 4 short factor sentences", () => {
    const factors = summarizeScoreFactors({
      menuCoveragePercent: 75,
      crossContactTransparencyPercent: 40,
      freshnessDays: 10,
      evidenceHighlight: "official_allergen_guide",
    });
    expect(factors.length).toBeLessThanOrEqual(4);
    expect(factors[0]).toContain("75%");
    expect(factors).toContain("An official allergen guide was available.");
  });
});
