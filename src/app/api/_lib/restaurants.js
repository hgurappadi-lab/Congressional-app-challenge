// Shared Supabase fetch used by both /api/rank and /api/search. Lives
// under a Next.js "_"-prefixed folder so it's excluded from routing — it's
// a server-only data-access helper, not a route handler, and deliberately
// kept out of /src/lib since it isn't pure/deterministic like the rest of
// that directory (see ARCHITECTURE.md).
export async function fetchRestaurantsWithEvidence(supabase) {
  const { data, error } = await supabase.from("restaurants").select(`
    id, name, address, latitude, longitude, cuisine, price_level, website, last_checked_at,
    cross_contact_notes ( cross_contact_type, note, evidence_source, confidence ),
    menu_items (
      id, name, description, price, category,
      item_allergens ( allergen, assessment, evidence_source, confidence, evidence_note ),
      item_dietary_attributes ( attribute, status, evidence_source, confidence ),
      modifications ( description, evidence_source, confidence ),
      cross_contact_notes ( cross_contact_type, note, evidence_source, confidence )
    )
  `);

  if (error) throw new Error(error.message);
  return data;
}
