// Presentation-only helpers that turn the data already returned by
// classifyDish()/scoreRestaurant() (reasons, criteria, classificationCounts,
// menuCoveragePercent, etc.) into the short, plain-language explanation and
// up-to-4 badges the compact card system needs. Nothing here recomputes a
// classification, score, or confidence — it only summarizes text/counts
// that already exist, per design-system/MASTER.md's card hierarchy rule.
import { CLASSIFICATIONS } from "./classification";

export function formatList(items) {
  if (items.length === 0) return "";
  if (typeof Intl !== "undefined" && Intl.ListFormat) {
    return new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(items);
  }
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

// Compact qualitative label for a restaurant's Choice Availability Score —
// compact cards show this instead of the raw number (the number itself
// stays available on the restaurant detail page).
export function scoreTierLabel(score) {
  if (score >= 60) return "Good choice availability";
  if (score >= 30) return "Moderate choice availability";
  return "Limited choice availability";
}

export function scoreTierTone(score) {
  if (score >= 60) return "match";
  if (score >= 30) return "modification";
  return "unknown";
}

// Shared badge color classes for the 5 status tones used across
// StatusBadge, RestaurantResultCard, and DishResultCard badges — one place
// so every badge/tone pairing in the app stays visually consistent.
export function badgeToneClasses(tone) {
  switch (tone) {
    case "match":
      return "text-status-match-text bg-status-match-bg border-status-match-border";
    case "modification":
      return "text-status-modification-text bg-status-modification-bg border-status-modification-border";
    case "confirm":
      return "text-status-confirm-text bg-status-confirm-bg border-status-confirm-border";
    case "allergen":
      return "text-status-allergen-text bg-status-allergen-bg border-status-allergen-border";
    case "unknown":
    default:
      return "text-status-unknown-text bg-status-unknown-bg border-status-unknown-border";
  }
}

// Restaurant card: 1–2 sentence explanation + up to 4 count badges, built
// from scoreRestaurant()'s classificationCounts (unchanged, just read).
export function summarizeRestaurantResult({ classificationCounts = {} }) {
  const strong = classificationCounts[CLASSIFICATIONS.STRONG_MATCH] ?? 0;
  const modification = classificationCounts[CLASSIFICATIONS.MODIFICATION_NEEDED] ?? 0;
  const confirm = classificationCounts[CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING] ?? 0;
  const allergen = classificationCounts[CLASSIFICATIONS.ALLERGEN_IDENTIFIED] ?? 0;
  const insufficient = classificationCounts[CLASSIFICATIONS.INSUFFICIENT_INFORMATION] ?? 0;

  let explanation;
  if (strong > 0 && modification > 0) {
    explanation = `${strong} documented potential ${strong === 1 ? "match" : "matches"}. ${modification} more may work with modifications.`;
  } else if (strong > 0) {
    explanation = `${strong} documented potential ${strong === 1 ? "match" : "matches"} on the menu.`;
  } else if (modification > 0) {
    explanation = `${modification} ${modification === 1 ? "dish" : "dishes"} may work with a modification.`;
  } else if (confirm > 0) {
    explanation = `${confirm} ${confirm === 1 ? "dish needs" : "dishes need"} confirmation before ordering.`;
  } else if (allergen > 0) {
    explanation = "Selected allergens were identified across this menu.";
  } else {
    explanation = "Not enough information is available for this menu yet.";
  }

  const badges = [];
  if (strong > 0) badges.push({ label: `${strong} potential ${strong === 1 ? "match" : "matches"}`, tone: "match" });
  if (modification > 0) badges.push({ label: `${modification} modification${modification === 1 ? "" : "s"}`, tone: "modification" });
  if (confirm > 0) badges.push({ label: `${confirm} to confirm`, tone: "confirm" });
  if (allergen > 0) badges.push({ label: `${allergen} allergen${allergen === 1 ? "" : "s"} identified`, tone: "allergen" });
  if (insufficient > 0) badges.push({ label: `${insufficient} unknown`, tone: "unknown" });

  return { explanation, badges: badges.slice(0, 4) };
}

// Dish card: prioritizes the user's selected allergens/dietary restrictions
// (criteria, from classifyDish()'s additive `criteria` field) over generic
// text, per the spec's "prioritize information related to the user's
// selected allergies" requirement.
export function summarizeDishResult({ criteria = [] }) {
  const identified = criteria.filter((c) => c.status === "identified");
  const modifiable = criteria.filter((c) => c.status === "modifiable");
  const needsConfirmation = criteria.filter((c) => c.status === "needs_confirmation");
  const unknown = criteria.filter((c) => c.status === "unknown");

  let explanation;
  if (identified.length > 0) {
    explanation = identified[0].reason;
    if (unknown.length > 0) {
      explanation += ` Information about ${formatList(unknown.map((c) => c.label))} is unavailable.`;
    }
  } else if (modifiable.length > 0) {
    explanation = modifiable[0].reason;
  } else if (needsConfirmation.length > 0) {
    explanation = needsConfirmation[0].reason;
  } else if (unknown.length > 0) {
    explanation = `Information about ${formatList(unknown.map((c) => c.label))} is unavailable.`;
  } else if (criteria.length === 0) {
    explanation = "No allergies or dietary restrictions were selected to check.";
  } else {
    explanation = "No concerns were identified for your selected allergies and dietary restrictions.";
  }

  const badges = [];
  for (const c of identified) badges.push({ label: `${c.label} identified`, tone: "allergen" });
  for (const c of modifiable) badges.push({ label: `${c.label} needs a modification`, tone: "modification" });
  for (const c of needsConfirmation) badges.push({ label: `${c.label} to confirm`, tone: "confirm" });
  if (unknown.length > 0) badges.push({ label: `${unknown.length} unknown`, tone: "unknown" });

  return { explanation, badges: badges.slice(0, 4) };
}

// Which dishes count as "worth recommending" — a real documented match
// candidate, as opposed to insufficient information or a confirmed
// allergen. Shared by the restaurant detail menu and Find a Dish so both
// surface a short "Recommended for you" list instead of dumping every
// matched dish, undocumented ones included, into the primary view.
const RECOMMENDATION_RANK = {
  [CLASSIFICATIONS.STRONG_MATCH]: 0,
  [CLASSIFICATIONS.MODIFICATION_NEEDED]: 1,
  [CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING]: 2,
};

export function getRecommendedDishes(dishes, maxCount = 3) {
  return dishes
    .filter((dish) => dish.classification in RECOMMENDATION_RANK)
    .sort((a, b) => RECOMMENDATION_RANK[a.classification] - RECOMMENDATION_RANK[b.classification])
    .slice(0, maxCount);
}

// Restaurant detail "Why this score?" default view — only the major
// factors, per the spec's example. Full explanation[] from scoreRestaurant
// stays available, unmodified, behind the same expansion.
export function summarizeScoreFactors({
  menuCoveragePercent,
  crossContactTransparencyPercent,
  freshnessDays,
  evidenceHighlight,
}) {
  const factors = [`${menuCoveragePercent}% of the curated menu was evaluated.`];

  if (evidenceHighlight === "official_allergen_guide") {
    factors.push("An official allergen guide was available.");
  }

  if (typeof crossContactTransparencyPercent === "number") {
    if (crossContactTransparencyPercent === 100) {
      factors.push("Cross-contact information is documented for every evaluated dish.");
    } else if (crossContactTransparencyPercent === 0) {
      factors.push("Cross-contact information is unavailable.");
    } else {
      factors.push("Cross-contact information is incomplete.");
    }
  }

  if (freshnessDays !== null && freshnessDays !== undefined) {
    factors.push(
      freshnessDays <= 30
        ? "Data was checked recently."
        : freshnessDays <= 180
          ? "Data was checked within the last 6 months."
          : "Data may be stale — it was last checked a while ago.",
    );
  }

  return factors.slice(0, 4);
}
