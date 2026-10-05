import Link from "next/link";
import { ChevronRight, Award } from "lucide-react";
import { scoreTierLabel, scoreTierTone, badgeToneClasses } from "@/lib/result-summary";

// Compact restaurant card for Explore Nearby / Favorites — deliberately
// short: name, meta line, one status badge, one action. Menu recommendations
// and per-dish details are available through "View restaurant".
// `rank` (1, 2, 3, ...) labels the card's position in an already-sorted
// list (sorted by scoreRestaurant()'s score server-side) as "Choice #N" —
// rank 1 gets the highlighted treatment, the rest a plain numbered badge.
export default function RestaurantResultCard({ restaurant, rank }) {
  const tier = scoreTierLabel(restaurant.score);
  const tierTone = scoreTierTone(restaurant.score);
  const highlight = rank === 1;

  return (
    <li
      className={`rounded-2xl p-4 ${
        highlight
          ? "border-2 border-accent bg-gradient-to-br from-pale-green to-card shadow-md"
          : "border border-border bg-card shadow-sm"
      }`}
    >
      {rank ? (
        <span
          className={`mb-2 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            highlight ? "bg-primary text-white" : "bg-surface text-text-secondary"
          }`}
        >
          {highlight ? <Award aria-hidden="true" className="h-3.5 w-3.5" /> : null}
          Choice #{rank}
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
