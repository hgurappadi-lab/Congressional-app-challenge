// groupDishesByCategory(dishes) -> [{ category, dishes }]
//
// Groups already-classified dishes (as returned by /api/restaurant/[id])
// by their `category` field, preserving first-seen category order — the
// order menu items came back from Supabase — and bucketing missing/blank
// categories under "Other".
export function groupDishesByCategory(dishes) {
  const order = [];
  const groups = new Map();

  for (const dish of dishes) {
    const category = dish.category && dish.category.trim() ? dish.category : "Other";
    if (!groups.has(category)) {
      groups.set(category, []);
      order.push(category);
    }
    groups.get(category).push(dish);
  }

  return order.map((category) => ({ category, dishes: groups.get(category) }));
}
