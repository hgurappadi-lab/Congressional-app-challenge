import { createClient } from "@/lib/supabase/server";
import { classifyDish } from "@/lib/classification";
import { weakestConfidence } from "@/lib/evidence";
import { haversineDistanceMiles } from "@/lib/geo";
import { searchMenuItems } from "@/lib/search";
import { fetchRestaurantsWithEvidence } from "../_lib/restaurants";

// A dish's overall ranking is a mix of how well it matches the craving and
// how compatible it looks for this profile (ARCHITECTURE.md's Find a Dish
// flow). Neither dominates: a great craving match that's flagged as
// containing an allergen should still rank below a good-but-imperfect
// match that's a strong documented compatibility fit.
const COMPATIBILITY_WEIGHT = {
  strong_documented_potential_match: 1,
  modification_needed: 0.7,
  confirm_before_ordering: 0.4,
  insufficient_information: 0.2,
  allergen_identified: 0,
};

// POST /api/search
// Body: { query, lat, lng, radiusMiles, allergies, dietaryRestrictions,
//   matchingStrictness }
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    query,
    lat,
    lng,
    radiusMiles,
    allergies = [],
    dietaryRestrictions = [],
    matchingStrictness = "standard",
  } = body ?? {};

  if (typeof query !== "string" || query.trim().length === 0) {
    return Response.json({ error: "query is required." }, { status: 400 });
  }
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

  // Flatten every menu item within the search radius into one list, each
  // carrying its parent restaurant's info, so searchMenuItems() can rank
  // across the whole nearby menu at once.
  const nearbyDishes = restaurants.flatMap((restaurant) => {
    const distanceMiles = haversineDistanceMiles(origin, {
      lat: restaurant.latitude,
      lng: restaurant.longitude,
    });
    if (distanceMiles > radiusMiles) return [];

    const restaurantCrossContact = restaurant.cross_contact_notes ?? [];

    return (restaurant.menu_items ?? []).map((item) => ({
      ...item,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      distanceMiles: Math.round(distanceMiles * 10) / 10,
      restaurantCrossContact,
    }));
  });

  const matches = searchMenuItems(query, nearbyDishes);

  const ranked = matches
    .map((item) => {
      const result = classifyDish({
        allergies,
        dietaryRestrictions,
        matchingStrictness,
        itemAllergens: item.item_allergens ?? [],
        itemDietaryAttributes: item.item_dietary_attributes ?? [],
        modifications: item.modifications ?? [],
        crossContactNotes: [
          ...(item.cross_contact_notes ?? []),
          ...item.restaurantCrossContact,
        ],
      });

      const compatibilityWeight = COMPATIBILITY_WEIGHT[result.classification] ?? 0;
      const combinedScore = item.relevance * 0.5 + compatibilityWeight * 0.5;

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        restaurantId: item.restaurantId,
        restaurantName: item.restaurantName,
        distanceMiles: item.distanceMiles,
        relevance: item.relevance,
        classification: result.classification,
        reasons: result.reasons,
        evidenceConfidence: weakestConfidence(result.confidences),
        combinedScore: Math.round(combinedScore * 100) / 100,
      };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore);

  return Response.json({ dishes: ranked });
}
