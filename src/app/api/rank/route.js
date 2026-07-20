import { createClient } from "@/lib/supabase/server";
import { classifyDish } from "@/lib/classification";
import { scoreRestaurant } from "@/lib/scoring";
import { weakestConfidence } from "@/lib/evidence";
import { haversineDistanceMiles } from "@/lib/geo";
import { fetchRestaurantsWithEvidence } from "../_lib/restaurants";

// POST /api/rank
// Body: { lat, lng, radiusMiles, allergies, dietaryRestrictions,
//   matchingStrictness }
//
// Implements the Explore Nearby data flow from ARCHITECTURE.md: query the
// curated dataset, filter to the search radius, run every menu item
// through classifyDish() against the caller's profile, aggregate each
// restaurant's classified menu with scoreRestaurant(), and return results
// ranked by score (distance is a secondary sort only, per plan §9 — it
// never inflates the score itself).
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    lat,
    lng,
    radiusMiles,
    allergies = [],
    dietaryRestrictions = [],
    matchingStrictness = "standard",
  } = body ?? {};

  if (typeof lat !== "number" || typeof lng !== "number" || typeof radiusMiles !== "number") {
    return Response.json(
      { error: "lat, lng, and radiusMiles are required numbers." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  let restaurants;
  try {
    restaurants = await fetchRestaurantsWithEvidence(supabase);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }

  const origin = { lat, lng };

  const ranked = restaurants
    .map((restaurant) => {
      const distanceMiles = haversineDistanceMiles(origin, {
        lat: restaurant.latitude,
        lng: restaurant.longitude,
      });
      return { restaurant, distanceMiles };
    })
    .filter(({ distanceMiles }) => distanceMiles <= radiusMiles)
    .map(({ restaurant, distanceMiles }) => {
      const restaurantCrossContact = restaurant.cross_contact_notes ?? [];

      const dishes = (restaurant.menu_items ?? []).map((item) => {
        const result = classifyDish({
          allergies,
          dietaryRestrictions,
          matchingStrictness,
          itemAllergens: item.item_allergens ?? [],
          itemDietaryAttributes: item.item_dietary_attributes ?? [],
          modifications: item.modifications ?? [],
          crossContactNotes: [
            ...(item.cross_contact_notes ?? []),
            ...restaurantCrossContact,
          ],
        });

        return {
          id: item.id,
          name: item.name,
          category: item.category,
          classification: result.classification,
          reasons: result.reasons,
          evaluation: {
            classification: result.classification,
            confidence: weakestConfidence(result.confidences),
            hasCrossContactInfo:
              (item.cross_contact_notes ?? []).length > 0 || restaurantCrossContact.length > 0,
            hasAnyEvidence: (item.item_allergens ?? []).length > 0,
          },
        };
      });

      const scoreResult = scoreRestaurant({
        dishEvaluations: dishes.map((d) => d.evaluation),
        lastCheckedAt: restaurant.last_checked_at,
        matchingStrictness,
      });

      return {
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        cuisine: restaurant.cuisine,
        priceLevel: restaurant.price_level,
        website: restaurant.website,
        distanceMiles: Math.round(distanceMiles * 10) / 10,
        score: scoreResult.score,
        menuCoveragePercent: scoreResult.menuCoveragePercent,
        classificationCounts: scoreResult.classificationCounts,
        crossContactTransparencyPercent: scoreResult.crossContactTransparencyPercent,
        freshnessDays: scoreResult.freshnessDays,
        explanation: scoreResult.explanation,
        dishes: dishes.map(({ id, name, category, classification }) => ({
          id,
          name,
          category,
          classification,
        })),
      };
    })
    .sort((a, b) => b.score - a.score || a.distanceMiles - b.distanceMiles);

  return Response.json({ restaurants: ranked });
}
