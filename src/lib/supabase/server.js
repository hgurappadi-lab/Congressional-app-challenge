import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Call from Server Components / Route Handlers only. Reads the user's auth
// session from cookies via the public anon key + RLS (still not a
// privileged client — see admin.js for the service-role client).
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
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render (not a Route Handler /
            // Server Action) — cookies can't be set here. Session refresh
            // for that case is handled by src/proxy.js instead.
          }
        },
      },
    },
  );
}
