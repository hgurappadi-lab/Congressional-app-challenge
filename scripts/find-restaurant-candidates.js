// Dev-time discovery aid for expanding the curated dataset to a new area.
// Queries the Google Places API (New) for restaurants near a point and
// prints a candidate list — nothing here is written to data/seed/*.json or
// Supabase, and no allergen/menu data is produced. Each candidate still
// needs the same manual research + sourcing DATA_SOURCES.md describes for
// every other restaurant in the dataset before it can be added for real.
//
// Request building/parsing is shared with the live in-app lookups
// (src/app/api/nearby-live/route.js, src/app/api/ai-recommend/route.js)
// via src/lib/google-places.js — imported dynamically since this script is
// CommonJS and that module is ESM.
//
// Requires GOOGLE_PLACES_API_KEY in .env.local (see .env.example) — paid
// API, unlike the free OpenStreetMap discovery this replaced.
//
// Usage: node scripts/find-restaurant-candidates.js <lat> <lng> [radiusMiles=15]

const { loadEnvLocal } = require("./lib/load-env");

const PLACES_URL = "https://places.googleapis.com/v1/places:searchNearby";

async function main() {
  loadEnvLocal();

  const { buildNearbySearchBody, parsePlacesCandidates, PLACES_FIELD_MASK } = await import(
    "../src/lib/google-places.js"
  );

  const [latArg, lngArg, radiusArg] = process.argv.slice(2);
  const lat = Number(latArg);
  const lng = Number(lngArg);
  const radiusMiles = radiusArg ? Number(radiusArg) : 15;

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radiusMiles)) {
    console.error(
      "Usage: node scripts/find-restaurant-candidates.js <lat> <lng> [radiusMiles=15]",
    );
    process.exitCode = 1;
    return;
  }

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.error("Missing GOOGLE_PLACES_API_KEY. Check .env.local (see .env.example).");
    process.exitCode = 1;
    return;
  }

  const response = await fetch(PLACES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask": PLACES_FIELD_MASK,
    },
    body: JSON.stringify(buildNearbySearchBody(lat, lng, radiusMiles)),
  });

  if (!response.ok) {
    console.error(`Places API request failed: ${response.status} ${response.statusText}`);
    console.error(await response.text());
    process.exitCode = 1;
    return;
  }

  const body = await response.json();
  const candidates = parsePlacesCandidates(body);

  if (candidates.length === 0) {
    console.log(`No candidates found within ${radiusMiles} mi of (${lat}, ${lng}).`);
    return;
  }

  console.log(
    `${candidates.length} candidate(s) within ${radiusMiles} mi of (${lat}, ${lng}) — research each before adding it to data/seed/*.json:\n`,
  );
  for (const c of candidates) {
    console.log(`- ${c.name}${c.cuisine ? ` (${c.cuisine})` : ""}`);
    if (c.address) console.log(`  ${c.address}`);
    if (c.website) console.log(`  ${c.website}`);
    console.log(`  ${c.lat}, ${c.lng}${c.mapsUrl ? ` — ${c.mapsUrl}` : ""}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
