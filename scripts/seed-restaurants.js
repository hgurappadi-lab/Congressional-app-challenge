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
}

main();
