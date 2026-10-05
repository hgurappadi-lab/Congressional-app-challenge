import { CircleCheck } from "lucide-react";
import ExpandableExplanation from "./ExpandableExplanation";
import { summarizeScoreFactors } from "@/lib/result-summary";

// Restaurant detail's score box: up to 4 major factors visible by default,
// full explanation[] from scoreRestaurant() (unchanged) behind "Why this
// score?". The qualitative tier badge ("Limited/Moderate/Good choice
// availability") that used to head this box was removed per user request
// (2026-09-11, minimalism pass) — score/tier still drive sorting and the
// compact list-card badge (RestaurantResultCard), just not repeated here.
export default function ScoreSummary({
  menuCoveragePercent,
  crossContactTransparencyPercent,
  freshnessDays,
  evidenceHighlight,
  explanation,
}) {
  const factors = summarizeScoreFactors({
    menuCoveragePercent,
    crossContactTransparencyPercent,
    freshnessDays,
    evidenceHighlight,
  });

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <ul className="flex flex-col gap-1.5 text-sm text-text-secondary">
        {factors.map((factor, i) => (
          <li key={i} className="flex items-start gap-2">
            <CircleCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {factor}
          </li>
        ))}
      </ul>

      <ExpandableExplanation label="Why this score?">
        <ul className="flex list-inside list-disc flex-col gap-1">
          {explanation.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </ExpandableExplanation>
    </div>
  );
}
