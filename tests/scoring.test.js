import { describe, expect, it } from "vitest";
import { scoreRestaurant } from "../src/lib/scoring";
import { CLASSIFICATIONS } from "../src/lib/classification";

const NOW = new Date("2026-07-20T00:00:00Z");

function dish(classification, confidence, overrides = {}) {
  return {
    classification,
    confidence,
    hasCrossContactInfo: false,
    hasAnyEvidence: true,
    ...overrides,
  };
}

describe("scoreRestaurant — edge cases", () => {
  it("returns a zero score with an explanatory message when no dishes were evaluated", () => {
    const result = scoreRestaurant({ dishEvaluations: [], lastCheckedAt: "2026-07-01" });
    expect(result.score).toBe(0);
    expect(result.menuCoveragePercent).toBe(0);
    expect(result.explanation).toEqual([
      "No menu items have been evaluated against this profile yet.",
    ]);
  });
});

describe("scoreRestaurant — evidence quality outranks raw match count", () => {
  it("a restaurant with fewer but high-confidence strong matches outranks one with more but low-confidence matches", () => {
    // Restaurant A: 6 dishes, all only "confirm before ordering" and
    // low-confidence evidence.
    const restaurantA = scoreRestaurant({
      lastCheckedAt: "2026-07-01",
      now: NOW,
      dishEvaluations: Array.from({ length: 6 }, () =>
        dish(CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING, "low"),
      ),
    });

    // Restaurant B: 2 dishes, both strong documented matches with
    // high-confidence evidence.
    const restaurantB = scoreRestaurant({
      lastCheckedAt: "2026-07-01",
      now: NOW,
      dishEvaluations: Array.from({ length: 2 }, () =>
        dish(CLASSIFICATIONS.STRONG_MATCH, "high"),
      ),
    });

    expect(restaurantB.score).toBeGreaterThan(restaurantA.score);
  });
});

describe("scoreRestaurant — counts and coverage", () => {
  it("counts dishes per classification correctly", () => {
    const result = scoreRestaurant({
      lastCheckedAt: "2026-07-01",
      now: NOW,
      dishEvaluations: [
        dish(CLASSIFICATIONS.STRONG_MATCH, "high"),
        dish(CLASSIFICATIONS.STRONG_MATCH, "high"),
        dish(CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING, "medium"),
        dish(CLASSIFICATIONS.ALLERGEN_IDENTIFIED, "high"),
      ],
    });
    expect(result.classificationCounts[CLASSIFICATIONS.STRONG_MATCH]).toBe(2);
    expect(result.classificationCounts[CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING]).toBe(1);
    expect(result.classificationCounts[CLASSIFICATIONS.ALLERGEN_IDENTIFIED]).toBe(1);
  });

  it("computes menu coverage as the share of dishes with any documented evidence", () => {
    const result = scoreRestaurant({
      lastCheckedAt: "2026-07-01",
      now: NOW,
      dishEvaluations: [
        dish(CLASSIFICATIONS.STRONG_MATCH, "high", { hasAnyEvidence: true }),
        dish(CLASSIFICATIONS.INSUFFICIENT_INFORMATION, "insufficient", { hasAnyEvidence: false }),
      ],
    });
    expect(result.menuCoveragePercent).toBe(50);
  });

  it("computes cross-contact transparency as the share of dishes with documented cross-contact info", () => {
    const result = scoreRestaurant({
      lastCheckedAt: "2026-07-01",
      now: NOW,
      dishEvaluations: [
        dish(CLASSIFICATIONS.STRONG_MATCH, "high", { hasCrossContactInfo: true }),
        dish(CLASSIFICATIONS.STRONG_MATCH, "high", { hasCrossContactInfo: true }),
        dish(CLASSIFICATIONS.STRONG_MATCH, "high", { hasCrossContactInfo: false }),
        dish(CLASSIFICATIONS.STRONG_MATCH, "high", { hasCrossContactInfo: false }),
      ],
    });
    expect(result.crossContactTransparencyPercent).toBe(50);
  });
});

describe("scoreRestaurant — matching strictness and freshness", () => {
  it("weighs missing cross-contact info more heavily under cross_contact_sensitive strictness", () => {
    const dishes = Array.from({ length: 4 }, () =>
      dish(CLASSIFICATIONS.STRONG_MATCH, "high", { hasCrossContactInfo: false }),
    );
    const standard = scoreRestaurant({
      dishEvaluations: dishes,
      lastCheckedAt: "2026-07-01",
      now: NOW,
      matchingStrictness: "standard",
    });
    const sensitive = scoreRestaurant({
      dishEvaluations: dishes,
      lastCheckedAt: "2026-07-01",
      now: NOW,
      matchingStrictness: "cross_contact_sensitive",
    });
    expect(sensitive.score).toBeLessThan(standard.score);
  });

  it("penalizes stale data relative to recently-checked data", () => {
    const dishes = [dish(CLASSIFICATIONS.STRONG_MATCH, "high")];
    const fresh = scoreRestaurant({
      dishEvaluations: dishes,
      lastCheckedAt: "2026-07-01",
      now: NOW,
    });
    const stale = scoreRestaurant({
      dishEvaluations: dishes,
      lastCheckedAt: "2024-01-01",
      now: NOW,
    });
    expect(stale.score).toBeLessThan(fresh.score);
  });
});
