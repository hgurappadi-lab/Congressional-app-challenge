import { Info, ShieldCheck, Leaf } from "lucide-react";

// Full-length safety disclaimer (build plan §18), reused verbatim on
// Profile onboarding and restaurant/dish detail pages. Compact cards use
// the shorter SafetyReminder instead — see design-system/MASTER.md.
export default function SafetyDisclaimer() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-status-match-border bg-status-match-bg px-4 py-4 sm:px-5">
      <div className="flex flex-1 items-start gap-3">
        <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-status-match-text" />
        <p className="text-xs text-status-match-text sm:text-sm">
          Restaurant ingredients, recipes, preparation procedures, and equipment may
          change. Results are based on available public information and do not
          guarantee that a dish is free from allergens or cross-contact. Always
          confirm ingredients and preparation procedures directly with the
          restaurant before ordering.
        </p>
      </div>

      <span
        aria-hidden="true"
        className="relative hidden h-16 w-16 shrink-0 items-center justify-center rounded-full bg-soft-green text-primary sm:flex"
      >
        <ShieldCheck className="h-8 w-8" />
        <Leaf className="absolute -left-2 top-1 h-4 w-4 -rotate-12 opacity-70" />
        <Leaf className="absolute -right-2 bottom-1 h-4 w-4 rotate-45 opacity-70" />
      </span>
    </div>
  );
}
