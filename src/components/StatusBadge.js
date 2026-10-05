import { CheckCircle2, Wrench, MessageCircleQuestion, TriangleAlert, CircleHelp } from "lucide-react";
import { CLASSIFICATIONS } from "@/lib/classification";
import { CLASSIFICATION_LABELS } from "@/lib/classification-labels";

// Single source for the 5-way status color/icon mapping (design-system/MASTER.md).
// Color is never the only signal — every badge pairs an icon with text.
const STATUS_STYLES = {
  [CLASSIFICATIONS.STRONG_MATCH]: {
    icon: CheckCircle2,
    text: "text-status-match-text",
    bg: "bg-status-match-bg",
    border: "border-status-match-border",
  },
  [CLASSIFICATIONS.MODIFICATION_NEEDED]: {
    icon: Wrench,
    text: "text-status-modification-text",
    bg: "bg-status-modification-bg",
    border: "border-status-modification-border",
  },
  [CLASSIFICATIONS.CONFIRM_BEFORE_ORDERING]: {
    icon: MessageCircleQuestion,
    text: "text-status-confirm-text",
    bg: "bg-status-confirm-bg",
    border: "border-status-confirm-border",
  },
  [CLASSIFICATIONS.ALLERGEN_IDENTIFIED]: {
    icon: TriangleAlert,
    text: "text-status-allergen-text",
    bg: "bg-status-allergen-bg",
    border: "border-status-allergen-border",
  },
  [CLASSIFICATIONS.INSUFFICIENT_INFORMATION]: {
    icon: CircleHelp,
    text: "text-status-unknown-text",
    bg: "bg-status-unknown-bg",
    border: "border-status-unknown-border",
  },
};

export default function StatusBadge({ classification, size = "md" }) {
  // "Insufficient information" showed on nearly every dish given the
  // dataset's size and read as repetitive clutter rather than useful
  // signal — removed per user request (2026-09-11, minimalism pass); the
  // app's disclaimers already cover "confirm before ordering" everywhere.
  if (classification === CLASSIFICATIONS.INSUFFICIENT_INFORMATION) return null;

  const style = STATUS_STYLES[classification];
  if (!style) return null;
  const Icon = style.icon;
  const label = CLASSIFICATION_LABELS[classification];
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs gap-1" : "px-3 py-1 text-sm gap-1.5";

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border font-medium ${sizeClasses} ${style.text} ${style.bg} ${style.border}`}
    >
      <Icon aria-hidden="true" className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {label}
    </span>
  );
}
