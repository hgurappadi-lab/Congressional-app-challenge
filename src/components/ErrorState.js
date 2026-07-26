import { TriangleAlert } from "lucide-react";

export default function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-status-allergen-border bg-status-allergen-bg px-6 py-8 text-center">
      <TriangleAlert aria-hidden="true" className="h-6 w-6 text-status-allergen-text" />
      <p className="text-sm font-medium text-status-allergen-text">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 min-h-11 rounded-xl border border-status-allergen-border px-4 text-sm font-medium text-status-allergen-text"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
