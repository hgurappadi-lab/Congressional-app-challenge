// Shared Supabase fetch for the dish detail page, parallel to
// restaurants.js's RESTAURANT_WITH_EVIDENCE_SELECT — the single-item
// counterpart that additionally pulls the parent restaurant (id, name) and
// its own restaurant-wide cross_contact_notes nested one level up,
// mirroring the same double-nesting pattern already proven in
// restaurants.js (there: restaurant -> its own notes + menu_items -> their
// own notes; here: menu_item -> its own notes + parent restaurant -> its
// own notes).
const MENU_ITEM_WITH_EVIDENCE_SELECT = `
    id, restaurant_id, name, description, price, category,
    source_url, source_type, data_collected_at, last_checked_at,
    item_allergens ( allergen, assessment, evidence_source, confidence, evidence_note, last_verified_at ),
    item_dietary_attributes ( attribute, status, evidence_source, confidence, last_verified_at ),
    modifications ( description, source_url, evidence_source, confidence ),
    cross_contact_notes ( cross_contact_type, note, source_url, evidence_source, confidence, last_verified_at ),
    restaurants (
      id, name,
      cross_contact_notes ( cross_contact_type, note, source_url, evidence_source, confidence, last_verified_at )
    )
  `;

export async function fetchMenuItemById(supabase, id) {
  const { data, error } = await supabase
    .from("menu_items")
    .select(MENU_ITEM_WITH_EVIDENCE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
