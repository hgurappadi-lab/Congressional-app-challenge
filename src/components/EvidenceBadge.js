import { ShieldCheck, FileText } from "lucide-react";

// One compact "how good is the evidence here" badge, per the redesign's
// card-limit rule (at most 4 badges total per card, this is usually one of
// them). Prefers a concrete highlight (e.g. "an official allergen guide
// exists") over a generic coverage tier when both are available.
export default function EvidenceBadge({ evidenceHighlight, menuCoveragePercent }) {
  if (evidenceHighlight === "official_allergen_guide") {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-medium text-text-secondary">
        <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
        Official allergen guide
      </span>
    );
  }

  if (typeof menuCoveragePercent !== "number") return null;

  const label =
    menuCoveragePercent >= 60
      ? "Well-documented menu"
      : menuCoveragePercent >= 30
        ? "Some documentation"
        : "Limited documentation";

  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-medium text-text-secondary">
      <FileText aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
