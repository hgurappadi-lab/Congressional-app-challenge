import { ALLERGENS, DIETARY_RESTRICTIONS } from "@/lib/profile-options";
import { formatList } from "@/lib/result-summary";

const ALLERGEN_LABELS = Object.fromEntries(ALLERGENS.map((a) => [a.id, a.label.toLowerCase()]));
const DIETARY_LABELS = Object.fromEntries(
  DIETARY_RESTRICTIONS.map((d) => [d.id, d.label.toLowerCase()]),
);

// One-line profile summary shown on Home and Profile — e.g. "Avoiding
// eggs, peanuts, soy, and sesame." Never shows severity, evidence, or any
// per-dish data — just what the user is watching for.
export default function ProfileSummary({ allergies = [], dietaryRestrictions = [], className = "text-sm text-text-secondary" }) {
  const allergenNames = allergies.map((a) => ALLERGEN_LABELS[a.allergen] ?? a.allergen);
  const dietaryNames = dietaryRestrictions.map((id) => DIETARY_LABELS[id] ?? id);

  if (allergenNames.length === 0 && dietaryNames.length === 0) {
    return <p className={className}>No allergies or dietary restrictions set yet.</p>;
  }

  return (
    <p className={className}>
      {allergenNames.length > 0 ? <>Avoiding {formatList(allergenNames)}.</> : null}
      {dietaryNames.length > 0 ? (
        <> {allergenNames.length > 0 ? "Also following" : "Following"} {formatList(dietaryNames)}.</>
      ) : null}
    </p>
  );
}
