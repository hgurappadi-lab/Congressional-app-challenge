const { createAdminClient } = require("./lib/supabase-admin");
const restaurants = require("../data/seed/restaurants.json");

// Explicit allow-list so extra documentary fields in the JSON (e.g. notes
// about approximated coordinates) never get sent to Postgres as columns.
const RESTAURANT_COLUMNS = [
  "id",
  "name",
  "address",
  "latitude",
  "longitude",
  "cuisine",
  "price_level",
  "hours",
  "phone",
  "website",
  "source_url",
  "source_type",
  "data_collected_at",
  "last_checked_at",
];

function pickColumns(row, columns) {
  const out = {};
  for (const key of columns) {
    if (row[key] !== undefined) out[key] = row[key];
  }
  return out;
}

async function main() {
  const supabase = createAdminClient();
  const rows = restaurants.map((r) => pickColumns(r, RESTAURANT_COLUMNS));

  const { data, error } = await supabase
    .from("restaurants")
    .upsert(rows, { onConflict: "id" })
    .select("id, name");

  if (error) {
    console.error("Failed to seed restaurants:", error);
    process.exit(1);
  }

  console.log(`Seeded ${data.length} restaurants:`);
  for (const r of data) console.log(`  - ${r.name} (${r.id})`);

  // Restaurant-wide cross_contact_notes (cross_contact_notes.restaurant_id,
  // as opposed to the per-dish rows keyed by menu_item_id that
  // seed-menu-data.js handles) — an existing schema capability with no
  // seed data exercising it until now. Cleared and re-inserted per
  // restaurant so this script stays safe to re-run.
  const restaurantIds = restaurants.map((r) => r.id);
  const { error: clearError } = await supabase
    .from("cross_contact_notes")
    .delete()
    .in("restaurant_id", restaurantIds);
  if (clearError) {
    console.error("Failed to clear existing restaurant-level cross_contact_notes:", clearError);
    process.exit(1);
  }

  const crossContactRows = restaurants.flatMap((r) =>
    (r.cross_contact_notes || []).map((row) => ({ restaurant_id: r.id, ...row })),
  );
  if (crossContactRows.length > 0) {
    const { error: insertError } = await supabase
      .from("cross_contact_notes")
      .insert(crossContactRows);
    if (insertError) {
      console.error("Failed to seed restaurant-level cross_contact_notes:", insertError);
      process.exit(1);
    }
    console.log(`Seeded ${crossContactRows.length} restaurant-level cross-contact note(s).`);
  }
}

main();
