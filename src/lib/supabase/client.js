import { createBrowserClient } from "@supabase/ssr";

// Safe to call from Client Components. Uses the public anon key — data
// access is governed by the Row Level Security policies in
// supabase/schema.sql, not by keeping this key secret.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
