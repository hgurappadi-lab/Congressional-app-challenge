"use client";

import { Check } from "lucide-react";

// Selectable chip for the Profile page's allergen grid. Selected state uses
// the soft-green background + checkmark called for in the redesign spec,
// never color alone (the check icon + "selected" semantics carry the
// meaning too).
export default function AllergenChip({ label, icon: Icon, selected, onToggle }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={`flex min-h-11 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors ${
        selected
          ? "border-accent bg-soft-green text-primary"
          : "border-border bg-card text-text hover:border-accent"
      }`}
    >
      {selected ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white">
          <Check aria-hidden="true" className="h-3.5 w-3.5" />
        </span>
      ) : null}
      {Icon ? (
        <Icon
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 ${selected ? "text-primary" : "text-text-muted"}`}
        />
      ) : null}
      {label}
    </button>
  );
}
