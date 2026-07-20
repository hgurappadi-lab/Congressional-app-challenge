import RestaurantDetailClient from "./RestaurantDetailClient";

// No useSearchParams() here — the id comes from the route's dynamic
// segment, not the URL's query string — so unlike /map/page.js this
// doesn't need a Suspense boundary.
export default async function RestaurantDetailPage({ params }) {
  const { id } = await params;
  return <RestaurantDetailClient id={id} />;
}
