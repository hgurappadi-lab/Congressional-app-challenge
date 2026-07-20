// Plain-language display labels for each of the 5 classification values
// from classification.js. Shared by every page that renders a
// classification badge (Explore Nearby, Find a Dish, restaurant detail,
// and eventually dish detail / favorites) so the wording can't drift
// between pages.
import { CLASSIFICATIONS } from "./classification";

export const CLASSIFICATION_LABELS = {
  [CLASSIFICATIONS.STRONG_MATCH]: "Strong documented potential match",
  [CLASSIFICATIONS.MODIFICATION_NEEDED]: "May match with a modification",
  [CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING]: "Confirm before ordering",
  [CLASSIFICATIONS.ALLERGEN_IDENTIFIED]: "Allergen identified",
  [CLASSIFICATIONS.INSUFFICIENT_INFORMATION]: "Insufficient information",
};
