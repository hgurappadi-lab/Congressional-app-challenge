const { createAdminClient } = require("./lib/supabase-admin");
const menuItems = require("../data/seed/menu-items.json");

const MENU_ITEM_COLUMNS = [
  "id",
  "restaurant_id",
  "name",
  "description",
  "price",
  "category",
  "source_url",
  "source_type",
  "data_collected_at",
  "last_checked_at",
];

// Child tables keyed by menu_item_id. Only item_allergens and
// item_dietary_attributes have a unique constraint to upsert against, so
// instead this script deletes existing child rows for these menu item ids
// and re-inserts fresh ones — making it safe to re-run without duplicating.
const CHILD_TABLES = [
  "item_ingredients",
  "item_allergens",
  "item_dietary_attributes",
  "cross_contact_notes",
  "modifications",
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
  const itemIds = menuItems.map((item) => item.id);

  const itemRows = menuItems.map((item) => pickColumns(item, MENU_ITEM_COLUMNS));
  const { data: insertedItems, error: itemError } = await supabase
    .from("menu_items")
    .upsert(itemRows, { onConflict: "id" })
    .select("id, name");

  if (itemError) {
    console.error("Failed to seed menu_items:", itemError);
    process.exit(1);
  }
  console.log(`Seeded ${insertedItems.length} menu items.`);

  for (const table of CHILD_TABLES) {
    const { error } = await supabase.from(table).delete().in("menu_item_id", itemIds);
    if (error) {
      console.error(`Failed to clear existing ${table} rows:`, error);
      process.exit(1);
    }
  }

  const ingredientRows = [];
  const allergenRows = [];
  const dietaryRows = [];
  const crossContactRows = [];
  const modificationRows = [];

  for (const item of menuItems) {
    for (const row of item.ingredients || []) {
      ingredientRows.push({ menu_item_id: item.id, ...row });
    }
    for (const row of item.allergens || []) {
      allergenRows.push({ menu_item_id: item.id, ...row });
    }
    for (const row of item.dietary_attributes || []) {
      dietaryRows.push({ menu_item_id: item.id, ...row });
    }
    for (const row of item.cross_contact_notes || []) {
      crossContactRows.push({ menu_item_id: item.id, ...row });
    }
    for (const row of item.modifications || []) {
      modificationRows.push({ menu_item_id: item.id, ...row });
    }
  }

  const childInserts = [
    ["item_ingredients", ingredientRows],
    ["item_allergens", allergenRows],
    ["item_dietary_attributes", dietaryRows],
    ["cross_contact_notes", crossContactRows],
    ["modifications", modificationRows],
  ];

  for (const [table, rows] of childInserts) {
    if (rows.length === 0) continue;
    const { error } = await supabase.from(table).insert(rows);
    if (error) {
      console.error(`Failed to seed ${table}:`, error);
      process.exit(1);
    }
    console.log(`Seeded ${rows.length} rows into ${table}.`);
  }

  console.log("Menu data seed complete.");
}

main();
