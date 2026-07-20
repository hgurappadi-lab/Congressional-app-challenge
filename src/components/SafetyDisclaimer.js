// Short-form safety disclaimer (build plan §18), reused verbatim on every
// restaurant/dish detail page.
export default function SafetyDisclaimer() {
  return (
    <p className="text-xs text-zinc-500 dark:text-zinc-500">
      Restaurant ingredients, recipes, preparation procedures, and equipment may
      change. Results are based on available public information and do not
      guarantee that a dish is free from allergens or cross-contact. Always
      confirm ingredients and preparation procedures directly with the
      restaurant before ordering.
    </p>
  );
}
