import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// Placeholder home screen — proves the auth session wiring end-to-end.
// Replaced with the full Explore Nearby / Find a Dish home screen in
// Phase 4/5 of the build plan.
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Home
      </h1>

      {user ? (
        <>
          <p className="text-zinc-600 dark:text-zinc-400">
            Signed in as {user.email}
          </p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
            >
              Sign out
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="text-zinc-600 dark:text-zinc-400">
            Browsing as a guest — your profile is saved on this device only.
          </p>
          <Link href="/auth/signin" className="text-sm underline">
            Sign in to save your profile across devices
          </Link>
        </>
      )}

      <Link
        href="/map"
        className="w-full rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
      >
        Explore Nearby
      </Link>

      <Link
        href="/map?mode=find-dish"
        className="w-full rounded-md border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
      >
        Find a Dish
      </Link>

      <Link href="/profile" className="text-sm underline">
        Edit allergy &amp; dietary profile
      </Link>
    </main>
  );
}
