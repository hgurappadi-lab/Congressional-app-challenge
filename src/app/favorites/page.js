import FavoritesPageClient from "./FavoritesPageClient";

// No dynamic route segment and no useSearchParams(), so unlike /map/page.js
// no Suspense boundary is needed here.
export default function FavoritesPage() {
  return <FavoritesPageClient />;
}
