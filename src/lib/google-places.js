// Pure request-building/response-parsing for the Google Places API (New)
// Nearby Search endpoint. No network calls live here — those live in the
// caller (scripts/find-restaurant-candidates.js for dev-time discovery,
// src/app/api/nearby-live/route.js and src/app/api/ai-recommend/route.js
// for live in-app lookups) so this stays unit-testable without hitting the
// real API. Replaces the free OpenStreetMap Overpass discovery this app
// used before — see ARCHITECTURE.md/DATA_SOURCES.md for why (accuracy and
// worldwide coverage over cost).
const MILES_TO_METERS = 1609.34;
const MAX_RADIUS_METERS = 50000; // Places API (New) Nearby Search's own cap
const MAX_RESULT_COUNT = 20; // Places API (New) Nearby Search's own cap
const INCLUDED_TYPES = ["restaurant", "cafe", "fast_food_restaurant"];

export const PLACES_FIELD_MASK =
  "places.displayName,places.formattedAddress,places.location,places.websiteUri,places.googleMapsUri,places.primaryTypeDisplayName";

export function buildNearbySearchBody(lat, lng, radiusMiles) {
  const radiusMeters = Math.min(Math.round(radiusMiles * MILES_TO_METERS), MAX_RADIUS_METERS);
  return {
    includedTypes: INCLUDED_TYPES,
    maxResultCount: MAX_RESULT_COUNT,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radiusMeters,
      },
    },
  };
}

// Text Search body for a craving-specific request (e.g. "pizza") — Nearby
// Search above has no text query parameter at all, so a generic Nearby
// Search was previously used for Find a Dish too, returning the exact same
// restaurants regardless of what was typed. Text Search's `locationBias`
// (unlike Nearby Search's `locationRestriction`) is a soft preference, not
// a hard boundary, so a craving with few nearby matches still returns the
// closest reasonable ones instead of nothing.
export function buildTextSearchBody(query, lat, lng, radiusMiles) {
  const radiusMeters = Math.min(Math.round(radiusMiles * MILES_TO_METERS), MAX_RADIUS_METERS);
  return {
    textQuery: `${query} restaurant`,
    maxResultCount: MAX_RESULT_COUNT,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radiusMeters,
      },
    },
  };
}

// Turns a raw Places API (New) searchNearby JSON body into the plain
// candidate shape callers want. Skips any place with no name — not useful
// as a restaurant candidate either way.
export function parsePlacesCandidates(body) {
  return (body.places ?? [])
    .filter((p) => p.displayName?.text)
    .map((p) => ({
      name: p.displayName.text,
      cuisine: p.primaryTypeDisplayName?.text ?? null,
      address: p.formattedAddress ?? null,
      website: p.websiteUri ?? null,
      lat: p.location?.latitude,
      lng: p.location?.longitude,
      mapsUrl: p.googleMapsUri ?? null,
    }));
}
