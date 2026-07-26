import { CircleCheck } from "lucide-react";
import ExpandableExplanation from "./ExpandableExplanation";
import {
  summarizeScoreFactors,
  scoreTierLabel,
  scoreTierTone,
  badgeToneClasses,
} from "@/lib/result-summary";

// Restaurant detail's score box: qualitative tier + up to 4 major factors
// visible by default, full explanation[] from scoreRestaurant() (unchanged)
// behind "Why this score?".
export default function ScoreSummary({
  score,
  menuCoveragePercent,
  crossContactTransparencyPercent,
  freshnessDays,
  evidenceHighlight,
  explanation,
}) {
  const tier = scoreTierLabel(score);
  const tone = scoreTierTone(score);
  const factors = summarizeScoreFactors({
    menuCoveragePercent,
    crossContactTransparencyPercent,
    freshnessDays,
    evidenceHighlight,
  });

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:gap-0 sm:divide-x sm:divide-border">
      <div className="flex flex-1 flex-col gap-3 sm:pr-5">
        <span
          className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-medium ${badgeToneClasses(tone)}`}
        >
          {tier}
        </span>

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

      <div className="flex shrink-0 items-center gap-1 text-sm text-text-muted sm:w-52 sm:flex-col sm:items-start sm:justify-center sm:pl-5">
        <span>Choice Availability Score:</span>
        <span className="text-lg font-semibold text-text">{score}/100</span>
      </div>
    </div>
  );
}
