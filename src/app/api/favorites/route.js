import { createClient } from "@/lib/supabase/server";
import {
  FAVORITE_TARGET_TYPES,
  DEFAULT_LIST_NAME,
  mergeFavoritesWithTargets,
} from "@/lib/favorites";
import { fetchFavoriteRestaurants, fetchFavoriteDishes } from "../_lib/favorite-targets";

// Favorites are always scoped to the signed-in user — there is no
// guest-mode server row (favorites.user_id is NOT NULL). This is the
// first route in the app that requires auth; it returns an explicit 401
// rather than relying on RLS to fail silently.
async function requireUser(supabase) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

function unauthorized() {
  return Response.json({ error: "You must be signed in to use favorites." }, { status: 401 });
}

function invalidTarget() {
  return Response.json(
    { error: "targetType must be 'restaurant' or 'dish', and targetId is required." },
    { status: 400 },
  );
}

// GET /api/favorites
//   - with ?targetType=&targetId=(&listName=)  -> { favorited: boolean }
//     Lightweight single-item check, used by FavoriteButton so it doesn't
//     have to pull the full enriched list just to render one toggle.
//   - with no query params -> { favorites: [...] }
//     Full list, enriched with restaurant/dish names, used by /favorites.
export async function GET(request) {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!user) return unauthorized();

  const targetType = request.nextUrl.searchParams.get("targetType");
  const targetId = request.nextUrl.searchParams.get("targetId");
  const listName = request.nextUrl.searchParams.get("listName") || DEFAULT_LIST_NAME;

  if (targetType || targetId) {
    if (!FAVORITE_TARGET_TYPES.includes(targetType) || !targetId) return invalidTarget();
    const { data, error } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .eq("list_name", listName)
      .maybeSingle();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ favorited: Boolean(data) });
  }

  const { data: rows, error } = await supabase
    .from("favorites")
    .select("id, target_type, target_id, list_name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const restaurantIds = rows.filter((r) => r.target_type === "restaurant").map((r) => r.target_id);
  const dishIds = rows.filter((r) => r.target_type === "dish").map((r) => r.target_id);

  let restaurants, dishes;
  try {
    [restaurants, dishes] = await Promise.all([
      fetchFavoriteRestaurants(supabase, restaurantIds),
      fetchFavoriteDishes(supabase, dishIds),
    ]);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }

  const restaurantsById = Object.fromEntries(restaurants.map((r) => [r.id, r]));
  const dishesById = Object.fromEntries(dishes.map((d) => [d.id, d]));

  return Response.json({
    favorites: mergeFavoritesWithTargets(rows, restaurantsById, dishesById),
  });
}

// POST /api/favorites
// Body: { targetType, targetId, listName? }  (listName defaults server-side)
// Idempotent: favoriting an already-favorited target is a harmless no-op.
export async function POST(request) {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!user) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { targetType, targetId, listName = DEFAULT_LIST_NAME } = body ?? {};
  if (!FAVORITE_TARGET_TYPES.includes(targetType) || !targetId) return invalidTarget();

  const { error } = await supabase.from("favorites").upsert(
    { user_id: user.id, target_type: targetType, target_id: targetId, list_name: listName },
    { onConflict: "user_id,target_type,target_id,list_name", ignoreDuplicates: true },
  );
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}

// DELETE /api/favorites
// Body: { targetType, targetId, listName? }
// Idempotent: deleting a non-favorite is a no-op, not a 404 — there is no
// meaningful "not found" state for a toggle-off action.
export async function DELETE(request) {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!user) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { targetType, targetId, listName = DEFAULT_LIST_NAME } = body ?? {};
  if (!FAVORITE_TARGET_TYPES.includes(targetType) || !targetId) return invalidTarget();

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("list_name", listName);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
