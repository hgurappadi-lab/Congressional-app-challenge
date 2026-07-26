import { describe, expect, it } from "vitest";
import {
  ASSESSMENT_LABELS,
  ASSESSMENT_VALUES,
  DIETARY_STATUS_LABELS,
  DIETARY_STATUS_VALUES,
  EVIDENCE_SOURCE_LABELS,
} from "../src/lib/evidence-labels";
import { EVIDENCE_SOURCES } from "../src/lib/evidence";

describe("evidence-labels completeness", () => {
  it("has an assessment label for every known assessment value", () => {
    expect(Object.keys(ASSESSMENT_LABELS).sort()).toEqual([...ASSESSMENT_VALUES].sort());
  });

  it("has a dietary status label for every known status value", () => {
    expect(Object.keys(DIETARY_STATUS_LABELS).sort()).toEqual([...DIETARY_STATUS_VALUES].sort());
  });

  it("has an evidence source label for every known evidence source", () => {
    expect(Object.keys(EVIDENCE_SOURCE_LABELS).sort()).toEqual([...EVIDENCE_SOURCES].sort());
  });
});

describe("evidence-labels safety language", () => {
  it("never claims something is safe or allergen-free", () => {
    const allLabels = [
      ...Object.values(ASSESSMENT_LABELS),
      ...Object.values(DIETARY_STATUS_LABELS),
      ...Object.values(EVIDENCE_SOURCE_LABELS),
    ];
    for (const text of allLabels) {
      expect(text.toLowerCase()).not.toMatch(/\bsafe\b|\ballergen-free\b/);
    }
  });

  it("frames restaurant_disclosed_absent as not a cross-contact guarantee", () => {
    expect(ASSESSMENT_LABELS.restaurant_disclosed_absent).toMatch(/does not guarantee/i);
  });

  it("frames not_identified_in_available_source as possibly incomplete, not confirmed absence", () => {
    expect(ASSESSMENT_LABELS.not_identified_in_available_source).toMatch(/may be incomplete/i);
  });
});
