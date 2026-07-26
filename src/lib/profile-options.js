import { Milk, Egg, Fish, Shell, Nut, Bean, Wheat, Sprout, Flower2, Leaf, WheatOff } from "lucide-react";

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
  { id: "milk", label: "Milk", icon: Milk },
  { id: "eggs", label: "Eggs", icon: Egg },
  { id: "fish", label: "Fish", icon: Fish },
  { id: "shellfish", label: "Shellfish", icon: Shell },
  { id: "tree_nuts", label: "Tree nuts", icon: Nut },
  { id: "peanuts", label: "Peanuts", icon: Bean },
  { id: "wheat", label: "Wheat", icon: Wheat },
  { id: "soy", label: "Soy", icon: Sprout },
  { id: "sesame", label: "Sesame", icon: Flower2 },
];

// Kept only as the storage default when an allergy is toggled on — the
// redesign drops the per-allergen severity picker from the Profile UI
// (classification.js documents severity as accepted but never used in
// scoring, and it read as confusing medical wording). Not rendered
// anywhere; kept so the stored profile shape doesn't change.
export const DEFAULT_ALLERGY_SEVERITY = "moderate";

// The ids below are a subset of the `attribute` CHECK constraint on
// item_dietary_attributes in supabase/schema.sql (which still allows
// lactose_free/halal/kosher/pescatarian too) — this is deliberately just
// the 3 options offered as a user-selectable profile restriction. Menu
// items documented against the other attributes are unaffected; they
// still show up in a dish's full "Dietary fit" evidence, just aren't
// offerable as something to filter your own profile by.
export const DIETARY_RESTRICTIONS = [
  { id: "vegetarian", label: "Vegetarian", icon: Leaf },
  { id: "vegan", label: "Vegan", icon: Sprout },
  { id: "gluten_free", label: "Gluten-free", icon: WheatOff },
];
