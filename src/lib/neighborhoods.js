// Manual-location fallback for Explore Nearby (plan §16: "Manual
// neighborhood/ZIP/address entry is always available and denying location
// must not block app use"). The prototype doesn't call a live geocoding
// API (see DATA_SOURCES.md — Google Maps usage is scoped to client-side
// map rendering only), so this is a short curated list of the actual
// neighborhoods covered by the curated dataset, each a representative
// coordinate documented from the restaurant addresses collected there.
export const NEIGHBORHOODS = [
  {
    id: "torrey-highlands",
    label: "Torrey Highlands / Rancho Peñasquitos",
    lat: 32.967,
    lng: -117.1717,
  },
  { id: "rancho-bernardo", label: "Rancho Bernardo", lat: 33.0281, lng: -117.0797 },
  { id: "poway", label: "Poway", lat: 32.9628, lng: -117.0359 },
  { id: "mira-mesa", label: "Mira Mesa", lat: 32.9083, lng: -117.1428 },
  { id: "carmel-valley", label: "Carmel Valley", lat: 32.9595, lng: -117.2364 },
  { id: "la-jolla-utc", label: "La Jolla / UTC", lat: 32.871, lng: -117.2108 },
  { id: "del-mar", label: "Del Mar / Solana Beach", lat: 32.9798, lng: -117.2576 },
  { id: "encinitas", label: "Encinitas", lat: 33.049, lng: -117.2604 },
];
