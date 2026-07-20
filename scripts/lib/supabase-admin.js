const { createClient } = require("@supabase/supabase-js");
const { loadEnvLocal } = require("./load-env");

// DANGER: uses the service-role key and bypasses Row Level Security entirely.
// Only ever call this from trusted server-only scripts (scripts/seed-*.js).
function createAdminClient() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check .env.local.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

module.exports = { createAdminClient };
