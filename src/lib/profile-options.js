// Display metadata for the onboarding/profile UI. Kept separate from
// lib/profile.js (which only handles storage) so the vocabulary used here —
// especially DIETARY_RESTRICTIONS — can be reused by the classification
// logic in a later phase without pulling in storage code.
//
// Allergen ids match the FDA's major food allergens plus sesame, and are
// the same strings used in the `item_allergens.allergen` column of the
// curated dataset (see data/seed/menu-items.json), so a user's selected
// allergies can be compared directly against menu item evidence rows.
export const ALLERGENS = [
  { id: "milk", label: "Milk" },
  { id: "eggs", label: "Eggs" },
  { id: "fish", label: "Fish" },
  { id: "shellfish", label: "Shellfish" },
  { id: "tree_nuts", label: "Tree nuts" },
  { id: "peanuts", label: "Peanuts" },
  { id: "wheat", label: "Wheat" },
  { id: "soy", label: "Soy" },
  { id: "sesame", label: "Sesame" },
];

export const SEVERITY_LEVELS = [
  { id: "mild", label: "Mild" },
  { id: "moderate", label: "Moderate" },
  { id: "severe", label: "Severe" },
];

// Matches the `attribute` CHECK constraint on item_dietary_attributes in
// supabase/schema.sql, so a user's dietary_restrictions can be compared
// directly against menu item dietary_attributes rows.
export const DIETARY_RESTRICTIONS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten_free", label: "Gluten-free" },
  { id: "lactose_free", label: "Lactose-free" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
  { id: "pescatarian", label: "Pescatarian" },
];

export const MATCHING_STRICTNESS_OPTIONS = [
  {
    id: "standard",
    label: "Standard",
    description:
      "Show the full range of results, from strong documented matches to items that need confirmation.",
  },
  {
    id: "cautious",
    label: "Cautious",
    description:
      "Move dishes with incomplete allergen information into “Confirm before ordering” instead of treating them as likely matches.",
  },
  {
    id: "cross_contact_sensitive",
    label: "Cross-contact sensitive",
    description:
      "Also deprioritize restaurants that don’t document their cross-contact / shared-equipment practices.",
  },
];
