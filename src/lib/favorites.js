// Guest-mode favorites storage + shared pure helpers, parallel to
// src/lib/profile.js. Registered users' favorites live in Supabase (the
// `favorites` table, RLS'd to their own rows, via /api/favorites). Guest
// users get the same conceptual data, but it lives only in localStorage —
// there is no server-side guest favorites row, because `favorites.user_id`
// is NOT NULL (see supabase/schema.sql) and simply cannot exist without a
// signed-in user.

const GUEST_FAVORITES_KEY = "allergy-food-app:guest-favorites";

// Mirrors the schema's target_type CHECK constraint.
export const FAVORITE_TARGET_TYPES = ["restaurant", "dish"];
export const DEFAULT_LIST_NAME = "Favorites";

// ---- Pure array helpers (independently unit-testable, no localStorage) ----
// A "guest favorite entry" is { targetType, targetId, listName, createdAt }.

export function addFavoriteEntry(entries, { targetType, targetId, listName = DEFAULT_LIST_NAME }) {
  const exists = entries.some(
    (e) => e.targetType === targetType && e.targetId === targetId && e.listName === listName,
  );
  if (exists) return entries; // idempotent — favoriting twice is a no-op
  return [...entries, { targetType, targetId, listName, createdAt: new Date().toISOString() }];
}

export function removeFavoriteEntry(
  entries,
  { targetType, targetId, listName = DEFAULT_LIST_NAME },
) {
  return entries.filter(
    (e) => !(e.targetType === targetType && e.targetId === targetId && e.listName === listName),
  );
}

export function isFavoriteEntry(entries, { targetType, targetId, listName = DEFAULT_LIST_NAME }) {
  return entries.some(
    (e) => e.targetType === targetType && e.targetId === targetId && e.listName === listName,
  );
}

// A stable key for guest entries, which have no db row id.
export function guestFavoriteKey({ targetType, targetId, listName = DEFAULT_LIST_NAME }) {
  return `${targetType}:${targetId}:${listName}`;
}

// ---- Guest localStorage I/O ----

export function loadGuestFavorites() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGuestFavorites(entries) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(entries));
}

export function addGuestFavorite(target) {
  const updated = addFavoriteEntry(loadGuestFavorites(), target);
  saveGuestFavorites(updated);
  return updated;
}

export function removeGuestFavorite(target) {
  const updated = removeFavoriteEntry(loadGuestFavorites(), target);
  saveGuestFavorites(updated);
  return updated;
}

export function isGuestFavorite(target) {
  return isFavoriteEntry(loadGuestFavorites(), target);
}

export function clearGuestFavorites() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GUEST_FAVORITES_KEY);
}

// ---- Shared pure merge logic for the signed-in GET response ----
// Combines raw `favorites` rows (no FK to restaurants/menu_items — see
// schema) with separately-fetched restaurant/dish rows, keyed by id. Used
// only server-side by /api/favorites route.js, but kept pure/here (not in
// app/api/_lib) so it's unit-testable like the rest of /lib.
export function mergeFavoritesWithTargets(favoriteRows, restaurantsById, dishesById) {
  return favoriteRows.map((row) => {
    if (row.target_type === "restaurant") {
      const restaurant = restaurantsById[row.target_id];
      return {
        id: row.id,
        targetType: "restaurant",
        targetId: row.target_id,
        listName: row.list_name,
        createdAt: row.created_at,
        available: Boolean(restaurant),
        name: restaurant ? restaurant.name : null,
        restaurantId: null,
        restaurantName: null,
      };
    }

    const dish = dishesById[row.target_id];
    // Defensive: supabase-js can return an embedded to-one relation as a
    // single-element array rather than an object — same normalization
    // already applied in src/app/api/dish/[id]/route.js.
    const parentRaw = dish?.restaurants;
    const parent = Array.isArray(parentRaw) ? (parentRaw[0] ?? null) : (parentRaw ?? null);

    return {
      id: row.id,
      targetType: "dish",
      targetId: row.target_id,
      listName: row.list_name,
      createdAt: row.created_at,
      available: Boolean(dish),
      name: dish ? dish.name : null,
      restaurantId: dish ? dish.restaurant_id : null,
      restaurantName: parent ? parent.name : null,
    };
  });
}
