import { describe, expect, it } from "vitest";
import {
  confidenceForEvidenceSource,
  confidenceRank,
  compareConfidence,
  isAtLeast,
  weakestConfidence,
} from "../src/lib/evidence";

describe("confidenceForEvidenceSource", () => {
  it("maps official sources to high confidence", () => {
    expect(confidenceForEvidenceSource("official_allergen_guide")).toBe("high");
    expect(confidenceForEvidenceSource("official_ingredient_list")).toBe("high");
    expect(confidenceForEvidenceSource("restaurant_written_confirmation")).toBe("high");
  });

  it("maps a menu description to medium confidence", () => {
    expect(confidenceForEvidenceSource("official_menu_description")).toBe("medium");
  });

  it("maps student analysis and community reports to low confidence", () => {
    expect(confidenceForEvidenceSource("student_analysis_of_public_description")).toBe(
      "low",
    );
    expect(confidenceForEvidenceSource("community_report")).toBe("low");
  });

  it("maps unknown sources to insufficient, including unrecognized values", () => {
    expect(confidenceForEvidenceSource("unknown")).toBe("insufficient");
    expect(confidenceForEvidenceSource("something_not_in_the_vocabulary")).toBe(
      "insufficient",
    );
  });
});

describe("confidenceRank / compareConfidence / isAtLeast", () => {
  it("ranks high above medium above low above insufficient", () => {
    expect(confidenceRank("high")).toBeGreaterThan(confidenceRank("medium"));
    expect(confidenceRank("medium")).toBeGreaterThan(confidenceRank("low"));
    expect(confidenceRank("low")).toBeGreaterThan(confidenceRank("insufficient"));
  });

  it("compareConfidence sorts ascending by trustworthiness", () => {
    const sorted = ["medium", "insufficient", "high", "low"].sort(compareConfidence);
    expect(sorted).toEqual(["insufficient", "low", "medium", "high"]);
  });

  it("isAtLeast is true when equal or above the threshold", () => {
    expect(isAtLeast("high", "medium")).toBe(true);
    expect(isAtLeast("medium", "medium")).toBe(true);
    expect(isAtLeast("low", "medium")).toBe(false);
  });
});

describe("weakestConfidence", () => {
  it("returns the lowest-ranked confidence in the list", () => {
    expect(weakestConfidence(["high", "low", "medium"])).toBe("low");
  });

  it("returns insufficient for an empty list rather than throwing", () => {
    expect(weakestConfidence([])).toBe("insufficient");
  });
});
