import Link from "next/link";
import { ChevronRight, Award } from "lucide-react";
import { scoreTierLabel, scoreTierTone, badgeToneClasses } from "@/lib/result-summary";

// Compact restaurant card for Explore Nearby / Favorites — deliberately
// short: name, meta line, one status badge, one action. The full score
// breakdown, evidence badges, and per-dish detail all still live on the
// restaurant detail page (ScoreSummary's "Why this score?"), one tap away
// via "View restaurant" — nothing here is lost, just moved behind the
// click-through per the user's "click it to see everything" direction
// (design-system/pages/explore-nearby.md).
// `highlight` marks the top-ranked card in an already-sorted list (the
// list itself is sorted by scoreRestaurant()'s score server-side; this is
// purely the visual treatment for whichever card ends up first).
export default function RestaurantResultCard({ restaurant, highlight = false }) {
  const tier = scoreTierLabel(restaurant.score);
  const tierTone = scoreTierTone(restaurant.score);

  return (
    <li
      className={`rounded-2xl p-4 ${
        highlight
          ? "border-2 border-accent bg-gradient-to-br from-pale-green to-card shadow-md"
          : "border border-border bg-card shadow-sm"
      }`}
    >
      {highlight ? (
        <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-white">
          <Award aria-hidden="true" className="h-3.5 w-3.5" />
          Top pick nearby
        </span>
      ) : null}
      <Link href={`/restaurant/${restaurant.id}`} className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-lg font-semibold text-text">{restaurant.name}</span>
          <span className="text-sm text-text-muted">{restaurant.distanceMiles} mi</span>
        </div>
        <p className="text-sm text-text-secondary">{restaurant.cuisine}</p>

        <div className="mt-1 flex items-center justify-between gap-3">
          <span
            className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-medium ${badgeToneClasses(tierTone)}`}
          >
            {tier}
          </span>
          <span className="flex min-h-11 items-center gap-1 text-sm font-medium text-primary">
            View restaurant
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </li>
  );
}
