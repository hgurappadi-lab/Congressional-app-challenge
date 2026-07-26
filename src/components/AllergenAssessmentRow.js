"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

// One collapsed-by-default row in the dish detail "Your allergy checks" /
// "Other allergen information" sections. Collapsed: name + one-line plain
// explanation. Expanded: evidence source, confidence, note, last-checked
// date — the full technical record, on request only.
export default function AllergenAssessmentRow({
  label,
  brief,
  evidenceSourceLabel,
  confidence,
  evidenceNote,
  lastVerifiedAt,
}) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full min-h-11 items-start justify-between gap-3 text-left"
      >
        <span className="flex flex-col gap-0.5">
          <span className="font-medium text-text">{label}</span>
          <span className="text-sm text-text-secondary">{brief}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`mt-1 h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div id={contentId} className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-xs text-text-muted">
          {evidenceSourceLabel ? <p>Source: {evidenceSourceLabel}</p> : null}
          {confidence ? <p>Confidence: {confidence}</p> : null}
          {evidenceNote ? <p>{evidenceNote}</p> : null}
          {lastVerifiedAt ? <p>Last checked: {lastVerifiedAt}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
