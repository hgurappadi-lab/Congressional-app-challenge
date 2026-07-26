import HomePageClient from "./HomePageClient";

// Thin server wrapper, matching the split used by the other pages in this
// app — profile/auth state can only be resolved client-side (guest
// profiles live in localStorage), so all the real work lives in
// HomePageClient.
export default function HomePage() {
  return <HomePageClient />;
}
