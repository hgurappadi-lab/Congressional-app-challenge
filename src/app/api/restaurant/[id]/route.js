import { createClient } from "@/lib/supabase/server";
import { classifyDish } from "@/lib/classification";
import { scoreRestaurant } from "@/lib/scoring";
import { weakestConfidence, evidenceHighlight } from "@/lib/evidence";
import { fetchRestaurantById } from "../../_lib/restaurants";

// POST /api/restaurant/[id]
// Body: { allergies, dietaryRestrictions, matchingStrictness }
//
// The restaurant-detail-page counterpart to /api/rank: classifies every
// menu item for this one restaurant against the caller's profile and
// returns the full per-dish detail (not the abbreviated list-view shape
// /api/rank returns), plus the same Choice Availability Score breakdown.
export async function POST(request, { params }) {
  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    allergies = [],
    dietaryRestrictions = [],
    matchingStrictness = "standard",
  } = body ?? {};

  const supabase = await createClient();
  let restaurant;
  try {
    restaurant = await fetchRestaurantById(supabase, id);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }

  if (!restaurant) {
    return Response.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const restaurantCrossContact = restaurant.cross_contact_notes ?? [];

  const dishes = (restaurant.menu_items ?? []).map((item) => {
    const result = classifyDish({
      allergies,
      dietaryRestrictions,
      matchingStrictness,
      itemAllergens: item.item_allergens ?? [],
      itemDietaryAttributes: item.item_dietary_attributes ?? [],
      modifications: item.modifications ?? [],
      crossContactNotes: [...(item.cross_contact_notes ?? []), ...restaurantCrossContact],
    });

    const evidenceConfidence = weakestConfidence(result.confidences);

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      classification: result.classification,
      reasons: result.reasons,
      criteria: result.criteria,
      evidenceConfidence,
      evidenceHighlight: evidenceHighlight(item.item_allergens ?? []),
      evaluation: {
        classification: result.classification,
        confidence: evidenceConfidence,
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

  return Response.json({
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      cuisine: restaurant.cuisine,
      priceLevel: restaurant.price_level,
      website: restaurant.website,
      lastCheckedAt: restaurant.last_checked_at,
    },
    score: scoreResult.score,
    menuCoveragePercent: scoreResult.menuCoveragePercent,
    classificationCounts: scoreResult.classificationCounts,
    crossContactTransparencyPercent: scoreResult.crossContactTransparencyPercent,
    freshnessDays: scoreResult.freshnessDays,
    explanation: scoreResult.explanation,
    evidenceHighlight: evidenceHighlight(
      (restaurant.menu_items ?? []).flatMap((item) => item.item_allergens ?? []),
    ),
    dishes: dishes.map(
      ({
        id,
        name,
        description,
        price,
        category,
        classification,
        reasons,
        criteria,
        evidenceConfidence,
        evidenceHighlight: dishEvidenceHighlight,
      }) => ({
        id,
        name,
        description,
        price,
        category,
        classification,
        reasons,
        criteria,
        evidenceConfidence,
        evidenceHighlight: dishEvidenceHighlight,
      }),
    ),
  });
}
