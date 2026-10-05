// Favorites storage + shared pure helpers, parallel to src/lib/profile.js.
// Guest-only app — no accounts — so favorites live entirely in
// localStorage, never on the server.

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
