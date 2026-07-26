// Bulk name lookups for /api/favorites' GET (full-list) response. Both
// `restaurants` and `menu_items` are publicly readable per RLS, so these
// need no auth check of their own — the caller (route.js) already gates
// the endpoint by requiring a signed-in user before ever calling these.
export async function fetchFavoriteRestaurants(supabase, ids) {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("restaurants").select("id, name").in("id", ids);
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchFavoriteDishes(supabase, ids) {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, restaurant_id, restaurants ( name )")
    .in("id", ids);
  if (error) throw new Error(error.message);
  return data;
}
