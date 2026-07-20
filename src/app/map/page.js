import { Suspense } from "react";
import MapPageClient from "./MapPageClient";

// useSearchParams() (used to deep-link straight into Find a Dish mode from
// /home) requires a Suspense boundary around the client component that
// calls it, so this thin Server Component wrapper provides one.
export default function MapPage() {
  return (
    <Suspense fallback={null}>
      <MapPageClient />
    </Suspense>
  );
}
