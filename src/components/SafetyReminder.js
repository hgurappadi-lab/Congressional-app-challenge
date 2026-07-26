import { Info } from "lucide-react";

// Short reminder shown on every compact card. The full legal disclaimer
// (SafetyDisclaimer.js) is reserved for onboarding + detail pages, per the
// redesign's text-simplification rules — this is intentionally brief.
export default function SafetyReminder() {
  return (
    <p className="flex items-start gap-1.5 text-xs text-text-muted">
      <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      Always confirm ingredients and preparation with the restaurant.
    </p>
  );
}
