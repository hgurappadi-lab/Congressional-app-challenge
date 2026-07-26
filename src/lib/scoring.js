// Choice Availability Score (build plan §9, §15).
//
// A comparative ranking tool, not a medical probability or safety
// guarantee. Considers: count of dishes in each classification (weighted
// so evidence quality matters as much as raw match count — a restaurant
// with fewer, better-documented matches can outrank one with more,
// weaker-documented matches), % of the curated menu with any documented
// allergen evidence, cross-contact transparency, and data freshness.
// Distance is deliberately not a scoring input — the plan treats it as a
// secondary sort, not something that should make a farther restaurant look
// like a worse match.

import { confidenceRank } from "./evidence";
import { CLASSIFICATIONS } from "./classification";

// INSUFFICIENT_INFORMATION carries a small positive weight, distinct from
// ALLERGEN_IDENTIFIED's true floor of 0 — a dish nobody has documented yet
// is a genuinely different (and better) prospect than one confirmed to
// contain a selected allergen, and previously both scored identically,
// which let restaurants with a confirmed allergen hit rank exactly even
// with restaurants that simply lack data.
const CLASSIFICATION_POINTS = {
  [CLASSIFICATIONS.STRONG_MATCH]: 3,
  [CLASSIFICATIONS.MODIFICATION_NEEDED]: 2,
  [CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING]: 1,
  [CLASSIFICATIONS.INSUFFICIENT_INFORMATION]: 0.5,
  [CLASSIFICATIONS.ALLERGEN_IDENTIFIED]: 0,
};

const MAX_POINTS_PER_DISH = 3;

function countByClassification(dishEvaluations) {
  const counts = {
    [CLASSIFICATIONS.STRONG_MATCH]: 0,
    [CLASSIFICATIONS.MODIFICATION_NEEDED]: 0,
    [CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING]: 0,
    [CLASSIFICATIONS.ALLERGEN_IDENTIFIED]: 0,
    [CLASSIFICATIONS.INSUFFICIENT_INFORMATION]: 0,
  };
  for (const dish of dishEvaluations) {
    counts[dish.classification] = (counts[dish.classification] ?? 0) + 1;
  }
  return counts;
}

function daysBetween(from, to) {
  const ms = to.getTime() - new Date(from).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

// Freshness decays gently after 6 months and floors out at half weight —
// stale data shouldn't zero out an otherwise well-documented restaurant,
// but should visibly pull its score down.
function freshnessFactor(daysSinceChecked) {
  if (daysSinceChecked <= 180) return 1;
  const decay = (daysSinceChecked - 180) / 365;
  return Math.max(0.5, 1 - decay);
}

function freshnessSentence(daysSinceChecked) {
  if (daysSinceChecked <= 30) return "Data was verified within the last month.";
  if (daysSinceChecked <= 180) return "Data was verified within the last 6 months.";
  return `Data was last verified ${daysSinceChecked} days ago and may be stale.`;
}

function pluralDish(count) {
  return count === 1 ? "dish" : "dishes";
}

// scoreRestaurant({ dishEvaluations, lastCheckedAt, matchingStrictness, now })
//
// `dishEvaluations` — one entry per menu item that was run through
// classifyDish() for this user, shaped as:
//   {
//     classification,      // a CLASSIFICATIONS value
//     confidence,           // "high"|"medium"|"low"|"insufficient" — the
//                            // dish's weakest-link evidence confidence
//                            // among the criteria that were assessed
//     hasCrossContactInfo,  // boolean
//     hasAnyEvidence,       // boolean — does this item have any curated
//                            // allergen evidence at all (independent of
//                            // this specific user's profile)
//   }
// `lastCheckedAt` — the restaurant's `last_checked_at` date.
// `matchingStrictness` — the user's setting; cross-contact-sensitive users
//   weight missing cross-contact documentation more heavily.
// `now` — injectable for tests; defaults to the current date.
//
// Returns { score, menuCoveragePercent, classificationCounts,
//   crossContactTransparencyPercent, freshnessDays, explanation }.
export function scoreRestaurant({
  dishEvaluations = [],
  lastCheckedAt,
  matchingStrictness = "standard",
  now = new Date(),
}) {
  const totalDishes = dishEvaluations.length;

  if (totalDishes === 0) {
    return {
      score: 0,
      menuCoveragePercent: 0,
      classificationCounts: countByClassification([]),
      crossContactTransparencyPercent: 0,
      freshnessDays: lastCheckedAt ? daysBetween(lastCheckedAt, now) : null,
      explanation: [
        "No menu items have been evaluated against this profile yet.",
      ],
    };
  }

  const weightedPoints = dishEvaluations.reduce((sum, dish) => {
    const basePoints = CLASSIFICATION_POINTS[dish.classification] ?? 0;
    // INSUFFICIENT_INFORMATION's dish-level confidence is itself always
    // "insufficient" (that's what makes it that classification) — scaling
    // its already-small base points by that same confidence would zero
    // them out a second time, silently erasing the distinction from
    // ALLERGEN_IDENTIFIED this tier exists to make. Its points count
    // directly instead.
    if (dish.classification === CLASSIFICATIONS.INSUFFICIENT_INFORMATION) {
      return sum + basePoints;
    }
    const qualityFactor = confidenceRank(dish.confidence) / 3;
    return sum + basePoints * qualityFactor;
  }, 0);
  const matchScore = (weightedPoints / (MAX_POINTS_PER_DISH * totalDishes)) * 100;

  const evidenceCoveredCount = dishEvaluations.filter((d) => d.hasAnyEvidence).length;
  const menuCoveragePercent = Math.round((evidenceCoveredCount / totalDishes) * 100);

  const crossContactCount = dishEvaluations.filter((d) => d.hasCrossContactInfo).length;
  const crossContactTransparencyPercent = Math.round(
    (crossContactCount / totalDishes) * 100,
  );
  const transparencyWeight = matchingStrictness === "cross_contact_sensitive" ? 0.35 : 0.1;
  const transparencyFactor =
    1 - transparencyWeight + transparencyWeight * (crossContactTransparencyPercent / 100);

  const freshnessDays = lastCheckedAt ? daysBetween(lastCheckedAt, now) : null;
  const freshness = freshnessDays === null ? 1 : freshnessFactor(freshnessDays);

  const score = Math.max(
    0,
    Math.min(100, Math.round(matchScore * transparencyFactor * freshness)),
  );

  const classificationCounts = countByClassification(dishEvaluations);

  const explanation = [];
  if (classificationCounts[CLASSIFICATIONS.STRONG_MATCH] > 0) {
    const n = classificationCounts[CLASSIFICATIONS.STRONG_MATCH];
    explanation.push(`${n} strong documented potential ${pluralDish(n)}.`);
  }
  if (classificationCounts[CLASSIFICATIONS.MODIFICATION_NEEDED] > 0) {
    const n = classificationCounts[CLASSIFICATIONS.MODIFICATION_NEEDED];
    explanation.push(`${n} ${pluralDish(n)} may match with a documented modification.`);
  }
  if (classificationCounts[CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING] > 0) {
    const n = classificationCounts[CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING];
    explanation.push(`${n} ${pluralDish(n)} require confirmation before ordering.`);
  }
  if (classificationCounts[CLASSIFICATIONS.INSUFFICIENT_INFORMATION] > 0) {
    const n = classificationCounts[CLASSIFICATIONS.INSUFFICIENT_INFORMATION];
    explanation.push(`${n} ${pluralDish(n)} have insufficient information to evaluate.`);
  }
  if (classificationCounts[CLASSIFICATIONS.ALLERGEN_IDENTIFIED] > 0) {
    const n = classificationCounts[CLASSIFICATIONS.ALLERGEN_IDENTIFIED];
    explanation.push(
      `${n} ${pluralDish(n)} were identified as containing a selected allergen or being dietarily incompatible.`,
    );
  }
  explanation.push(
    `${menuCoveragePercent}% of this restaurant's curated menu has documented allergen information.`,
  );
  explanation.push(
    crossContactTransparencyPercent === 0
      ? "Cross-contact information is unknown for all evaluated dishes."
      : crossContactTransparencyPercent === 100
        ? "Cross-contact information is documented for all evaluated dishes."
        : `Cross-contact information is documented for ${crossContactTransparencyPercent}% of evaluated dishes.`,
  );
  if (freshnessDays !== null) {
    explanation.push(freshnessSentence(freshnessDays));
  }
  explanation.push(
    "This score compares the availability and documentation of potential choices. It is not a safety probability.",
  );

  return {
    score,
    menuCoveragePercent,
    classificationCounts,
    crossContactTransparencyPercent,
    freshnessDays,
    explanation,
  };
}
