// Evidence source -> confidence tier mapping (build plan §15).
//
// Every allergen/dietary-attribute/cross-contact row already carries its
// own `confidence` value, set at curation time (see data/seed/*.json) —
// that stored value is always what classification.js and scoring.js use.
// This module exists as the canonical reference mapping (for validating
// curated data, filling in a default when one is missing, and for
// comparing confidence tiers against each other).

export const EVIDENCE_SOURCES = [
  "official_allergen_guide",
  "official_ingredient_list",
  "official_menu_description",
  "restaurant_written_confirmation",
  "student_analysis_of_public_description",
  "community_report",
  "unknown",
];

export const CONFIDENCE_TIERS = ["high", "medium", "low", "insufficient"];

const EVIDENCE_SOURCE_CONFIDENCE = {
  official_allergen_guide: "high",
  official_ingredient_list: "high",
  restaurant_written_confirmation: "high",
  official_menu_description: "medium",
  // The plan describes community_report as "low/medium depending on
  // verification," but the schema doesn't track a per-report verification
  // flag, so this defaults to the conservative tier.
  community_report: "low",
  student_analysis_of_public_description: "low",
  unknown: "insufficient",
};

const CONFIDENCE_RANK = { high: 3, medium: 2, low: 1, insufficient: 0 };

// Default confidence tier for a given evidence source, per the plan's
// mapping. Falls back to "insufficient" for an unrecognized source rather
// than guessing upward.
export function confidenceForEvidenceSource(evidenceSource) {
  return EVIDENCE_SOURCE_CONFIDENCE[evidenceSource] ?? "insufficient";
}

// Numeric rank for comparing confidence tiers; higher is more trustworthy.
export function confidenceRank(confidence) {
  return CONFIDENCE_RANK[confidence] ?? 0;
}

export function compareConfidence(a, b) {
  return confidenceRank(a) - confidenceRank(b);
}

// True if `confidence` meets or exceeds `threshold` (e.g.
// isAtLeast("medium", "low") === true).
export function isAtLeast(confidence, threshold) {
  return confidenceRank(confidence) >= confidenceRank(threshold);
}

// The lowest (weakest) confidence tier among a list — used to represent a
// dish's overall evidence quality as the weakest link across every
// allergen/dietary-attribute row that was actually assessed for it.
export function weakestConfidence(confidences) {
  if (confidences.length === 0) return "insufficient";
  return confidences.reduce((weakest, current) =>
    confidenceRank(current) < confidenceRank(weakest) ? current : weakest,
  );
}

// A single presentation hint for the one evidence-quality badge shown on
// compact result cards (design-system/MASTER.md). Reads evidence_source
// values already present on rows the routes fetch from Supabase — adds no
// new query. Returns null when nothing noteworthy is present, letting the
// UI fall back to a coverage-percent-based label instead.
export function evidenceHighlight(itemAllergens = []) {
  if (itemAllergens.some((row) => row.evidence_source === "official_allergen_guide")) {
    return "official_allergen_guide";
  }
  return null;
}
