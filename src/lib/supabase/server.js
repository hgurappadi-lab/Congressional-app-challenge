import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Call from Server Components / Route Handlers only. Guest-only app (no
// accounts), so there's no user session to read here — this queries the
// curated dataset (restaurants/menu_items) via the public anon key + RLS,
// same as any anonymous request. Still not a privileged client — see
// admin.js for the service-role client used by the seed scripts.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // No session cookies to write back — nothing to do.
        },
      },
    },
  );
}
