"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

// Accessible disclosure powering every "Why this result?" / "Why this
// score?" trigger in the app. Content is only mounted once expanded so
// detail-heavy children (evidence lists, breakdowns) don't cost anything
// on the collapsed compact-card view.
export default function ExpandableExplanation({ label = "Why this result?", children }) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div id={contentId} className="mt-2 rounded-xl border border-border bg-surface p-3 text-sm text-text-secondary">
          {children}
        </div>
      ) : null}
    </div>
  );
}
