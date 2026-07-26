import DishDetailClient from "./DishDetailClient";

// No useSearchParams() here — same reasoning as restaurant/[id]/page.js.
export default async function DishDetailPage({ params }) {
  const { id } = await params;
  return <DishDetailClient id={id} />;
}
