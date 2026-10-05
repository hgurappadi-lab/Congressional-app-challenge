"use client";

import { useState } from "react";
import { Sparkles, ExternalLink, Loader2 } from "lucide-react";

// On-demand AI read of one restaurant's own website (POST
// /api/website-lookup), only ever triggered by this button — never run
// automatically for a list. Deliberately visually distinct from the
// scored-restaurant components: no badge, no score, quoted excerpts only,
// and a persistent "unverified" label. See LIMITATIONS.md.
//
// `craving` is optional (Find a Dish passes the current search term
// through) — it folds a specific dish into this same one-restaurant read
// rather than a separate AI pipeline that would pick/rank across
// restaurants. Restaurant selection is never done by AI in this app; this
// button only ever reads the one restaurant a human already chose to
// check.
export default function LiveWebsiteLookup({ restaurantName, website, craving }) {
  const [state, setState] = useState("idle"); // "idle" | "loading" | "done" | "error"
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function runLookup() {
    setState("loading");
    setError("");
    try {
      const response = await fetch("/api/website-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: website, restaurantName, craving }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || "Couldn't check that website.");
      }
      setResult(body);
      setState("done");
    } catch (err) {
      setError(err.message);
      setState("error");
    }
  }

  if (!website) {
    return <p className="text-xs text-text-muted">No website on file for AI lookup.</p>;
  }

  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={runLookup}
        className="flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover"
      >
        <Sparkles aria-hidden="true" className="h-4 w-4" />
        {craving ? `Check for "${craving}" with AI` : "Check website with AI"}
      </button>
    );
  }

  if (state === "loading") {
    return (
      <p className="flex items-center gap-1.5 text-sm text-text-secondary">
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        Reading {restaurantName}&rsquo;s website&hellip;
      </p>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-status-allergen-text">{error}</p>
        <button
          type="button"
          onClick={runLookup}
          className="w-fit text-sm font-medium text-primary underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-status-unknown-border bg-status-unknown-bg p-3">
      <p className="text-xs font-medium text-status-unknown-text">
        AI-read from {restaurantName}&rsquo;s own website. Not reviewed by ClearPlate. Always
        confirm directly before ordering.
      </p>

      {result.found ? (
        <ul className="flex flex-col gap-2">
          {result.excerpts.map((excerpt, index) => (
            <li key={index} className="text-sm text-text">
              <span className="block italic">&ldquo;{excerpt.quote}&rdquo;</span>
              {excerpt.note ? (
                <span className="block text-xs text-text-secondary">{excerpt.note}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-secondary">
          No allergen or menu information was found on this page.
        </p>
      )}

      <a
        href={result.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-fit items-center gap-1 text-xs font-medium text-primary"
      >
        View source page
        <ExternalLink aria-hidden="true" className="h-3 w-3" />
      </a>
    </div>
  );
}
