import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// DANGER: this client uses the service-role key and bypasses Row Level
// Security entirely. Only ever import this from trusted server-only code:
// one-time seed scripts (scripts/seed-*.js) or a privileged Route Handler
// that has its own explicit authorization check. Never import it into a
// Client Component or anything that ships to the browser.
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() must never run in the browser — it holds the Supabase service-role key.",
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check .env.local.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
