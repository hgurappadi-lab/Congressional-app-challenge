import {
  buildNearbySearchBody,
  buildTextSearchBody,
  parsePlacesCandidates,
  PLACES_FIELD_MASK,
} from "@/lib/google-places";
import { haversineDistanceMiles } from "@/lib/geo";

// POST /api/nearby-live
// Body: { lat, lng, radiusMiles, query? }
//
// Live counterpart to scripts/find-restaurant-candidates.js: queries the
// Google Places API (New) for nearby restaurants and returns them as
// unscored candidates. Deliberately separate from /api/rank — these are
// NOT curated data, carry no allergen evidence, and must never be shown
// with a score/badge (see LIMITATIONS.md). Paid API — see
// GOOGLE_PLACES_API_KEY's comment in .env.example. The optional `query`
// (Find a Dish's craving) switches this to a Text Search instead of a
// generic Nearby Search, so e.g. "pizza" actually returns pizza places
// instead of the same unfiltered nearby list regardless of what was typed
// — restaurant *selection* here is still 100% deterministic (Google's own
// text-relevance ranking, then distance), never an AI judgment call.
const NEARBY_SEARCH_URL = "https://places.googleapis.com/v1/places:searchNearby";
const TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { lat, lng, radiusMiles, query } = body ?? {};
  if (typeof lat !== "number" || typeof lng !== "number" || typeof radiusMiles !== "number") {
    return Response.json(
      { error: "lat, lng, and radiusMiles are required numbers." },
      { status: 400 },
    );
  }

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return Response.json(
      { error: "Restaurant discovery isn't configured (missing GOOGLE_PLACES_API_KEY)." },
      { status: 503 },
    );
  }

  const hasCraving = typeof query === "string" && query.trim().length > 0;

  let response;
  try {
    response = await fetch(hasCraving ? TEXT_SEARCH_URL : NEARBY_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": PLACES_FIELD_MASK,
      },
      body: JSON.stringify(
        hasCraving
          ? buildTextSearchBody(query.trim(), lat, lng, radiusMiles)
          : buildNearbySearchBody(lat, lng, radiusMiles),
      ),
    });
  } catch {
    return Response.json({ error: "Couldn't reach the restaurant lookup service." }, { status: 502 });
  }

  if (!response.ok) {
    return Response.json({ error: "Couldn't reach the restaurant lookup service." }, { status: 502 });
  }

  const placesBody = await response.json();
  const origin = { lat, lng };
  const restaurants = parsePlacesCandidates(placesBody)
    .map((candidate) => ({
      ...candidate,
      distanceMiles:
        Math.round(haversineDistanceMiles(origin, { lat: candidate.lat, lng: candidate.lng }) * 10) /
        10,
    }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles);

  return Response.json({ restaurants });
}
