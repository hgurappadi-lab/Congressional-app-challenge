// Great-circle distance in miles between two { lat, lng } points, used to
// filter restaurants to the user's chosen search radius. Distance is a
// filter/secondary-sort input only — the plan explicitly keeps it out of
// the Choice Availability Score itself (see scoring.js) so a restaurant
// doesn't rank higher purely for being closer.

const EARTH_RADIUS_MILES = 3958.8;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceMiles(a, b) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_MILES * c;
}
