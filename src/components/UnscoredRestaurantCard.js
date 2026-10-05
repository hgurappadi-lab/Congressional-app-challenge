import { badgeToneClasses } from "@/lib/result-summary";
import LiveWebsiteLookup from "./LiveWebsiteLookup";

// A restaurant found live via the Google Places API (/api/nearby-live),
// not from the curated Supabase dataset — deliberately distinct from
// RestaurantResultCard: no score, no "compatible" badge, no link to
// /restaurant/[id] (it isn't a row in Supabase). The "unknown" tone is the
// same one already used elsewhere for insufficient-evidence states, reused
// here so an unscored restaurant reads as "not yet verified," not "safe."
export default function UnscoredRestaurantCard({ restaurant, craving }) {
  return (
    <li className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-lg font-semibold text-text">{restaurant.name}</span>
        {restaurant.distanceMiles != null ? (
          <span className="text-sm text-text-muted">{restaurant.distanceMiles} mi</span>
        ) : null}
      </div>
      {restaurant.cuisine ? (
        <p className="text-sm text-text-secondary">{restaurant.cuisine}</p>
      ) : null}
      {restaurant.address ? (
        <p className="text-xs text-text-muted">{restaurant.address}</p>
      ) : null}

      <span
        className={`mt-2 inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-medium ${badgeToneClasses("unknown")}`}
      >
        Not yet verified
      </span>

      <div className="mt-3">
        <LiveWebsiteLookup
          restaurantName={restaurant.name}
          website={restaurant.website}
          craving={craving}
        />
      </div>
    </li>
  );
}
