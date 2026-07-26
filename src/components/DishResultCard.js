import Link from "next/link";
import { ChevronRight, Award } from "lucide-react";
import StatusBadge from "./StatusBadge";

// Compact dish card for Find a Dish / restaurant-detail menus / Favorites —
// deliberately short: name, meta line, one status badge, one action. Full
// evidence (why this result, per-allergen detail, sources) lives on the
// dish detail page, one tap away via "View details" — nothing here is
// lost, just moved behind the click-through (design-system/pages/
// explore-nearby.md documents the same pattern for restaurant cards).
// `highlight` marks a dish called out as recommended (see
// RestaurantDetailClient's "Recommended for you" section).
export default function DishResultCard({ dish, highlight = false }) {
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
          Best match here
        </span>
      ) : null}
      <Link href={`/dish/${dish.id}`} className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-lg font-semibold text-text">{dish.name}</span>
          {dish.distanceMiles != null ? (
            <span className="text-sm text-text-muted">{dish.distanceMiles} mi</span>
          ) : null}
        </div>
        {dish.restaurantName ? (
          <p className="text-sm text-text-secondary">
            {dish.restaurantName}
            {dish.price ? ` · $${dish.price}` : ""}
          </p>
        ) : null}

        <div className="mt-1 flex items-center justify-between gap-3">
          <StatusBadge classification={dish.classification} />
          <span className="flex min-h-11 items-center gap-1 text-sm font-medium text-primary">
            View details
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </li>
  );
}
