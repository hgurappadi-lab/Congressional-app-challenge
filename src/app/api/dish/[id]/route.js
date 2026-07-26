import { createClient } from "@/lib/supabase/server";
import { classifyDish } from "@/lib/classification";
import { generateQuestions } from "@/lib/questions";
import { weakestConfidence } from "@/lib/evidence";
import { fetchMenuItemById } from "../../_lib/menu-items";

// POST /api/dish/[id]
// Body: { allergies, dietaryRestrictions, matchingStrictness }
//
// The dish-detail-page counterpart to /api/restaurant/[id]: classifies
// this one dish against the caller's profile (same as restaurant detail)
// AND, unlike restaurant detail, returns every raw evidence row
// (allergens/dietary attributes/modifications/cross-contact) regardless of
// what the user personally selected, per plan §17's transparency
// requirement.
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
  let item;
  try {
    item = await fetchMenuItemById(supabase, id);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }

  if (!item) {
    return Response.json({ error: "Dish not found." }, { status: 404 });
  }

  // Defensive: normalize the embedded to-one restaurant relation in case
  // supabase-js returns it as a single-element array rather than an
  // object — this is the first place this codebase embeds a many-to-one
  // "belongs to" relation rather than a one-to-many child list.
  const restaurantRaw = item.restaurants;
  const restaurant = Array.isArray(restaurantRaw)
    ? (restaurantRaw[0] ?? null)
    : (restaurantRaw ?? null);

  const dishCrossContact = item.cross_contact_notes ?? [];
  const restaurantCrossContact = restaurant?.cross_contact_notes ?? [];
  const allCrossContact = [...dishCrossContact, ...restaurantCrossContact];

  const itemAllergens = item.item_allergens ?? [];
  const itemDietaryAttributes = item.item_dietary_attributes ?? [];
  const modifications = item.modifications ?? [];

  const result = classifyDish({
    allergies,
    dietaryRestrictions,
    matchingStrictness,
    itemAllergens,
    itemDietaryAttributes,
    modifications,
    crossContactNotes: allCrossContact,
  });

  const questions = generateQuestions({
    allergies,
    dietaryRestrictions,
    itemAllergens,
    itemDietaryAttributes,
    modifications,
    crossContactNotes: allCrossContact,
  });

  const selectedAllergenIds = new Set(allergies.map((a) => a.allergen));
  const selectedDietaryIds = new Set(dietaryRestrictions);

  return Response.json({
    dish: {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      sourceUrl: item.source_url,
      sourceType: item.source_type,
      dataCollectedAt: item.data_collected_at,
      lastCheckedAt: item.last_checked_at,
    },
    restaurant: restaurant ? { id: restaurant.id, name: restaurant.name } : null,
    classification: result.classification,
    reasons: result.reasons,
    evidenceConfidence: weakestConfidence(result.confidences),
    allergenAssessments: itemAllergens.map((row) => ({
      allergen: row.allergen,
      assessment: row.assessment,
      evidenceSource: row.evidence_source,
      confidence: row.confidence,
      evidenceNote: row.evidence_note,
      lastVerifiedAt: row.last_verified_at,
      isSelected: selectedAllergenIds.has(row.allergen),
    })),
    dietaryAssessments: itemDietaryAttributes.map((row) => ({
      attribute: row.attribute,
      status: row.status,
      evidenceSource: row.evidence_source,
      confidence: row.confidence,
      lastVerifiedAt: row.last_verified_at,
      isSelected: selectedDietaryIds.has(row.attribute),
    })),
    modifications: modifications.map((row) => ({
      description: row.description,
      sourceUrl: row.source_url,
      evidenceSource: row.evidence_source,
      confidence: row.confidence,
    })),
    crossContactNotes: [
      ...dishCrossContact.map((row) => ({
        crossContactType: row.cross_contact_type,
        note: row.note,
        sourceUrl: row.source_url,
        evidenceSource: row.evidence_source,
        confidence: row.confidence,
        lastVerifiedAt: row.last_verified_at,
        scope: "dish",
      })),
      ...restaurantCrossContact.map((row) => ({
        crossContactType: row.cross_contact_type,
        note: row.note,
        sourceUrl: row.source_url,
        evidenceSource: row.evidence_source,
        confidence: row.confidence,
        lastVerifiedAt: row.last_verified_at,
        scope: "restaurant",
      })),
    ],
    questions,
  });
}
