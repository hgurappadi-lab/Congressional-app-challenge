import Link from "next/link";

export default function WelcomePage() {
  return (
    <main className="mx-auto flex max-w-sm flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Allergy-Aware Food Discovery
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Find what you can actually eat nearby, based on your allergies,
          dietary restrictions, and what you&apos;re craving.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <Link
          href="/auth/signup"
          className="rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
        >
          Get started
        </Link>
        <Link
          href="/profile"
          className="rounded-md border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
        >
          Continue as guest
        </Link>
        <Link
          href="/auth/signin"
          className="px-4 py-2 text-sm underline text-zinc-600 dark:text-zinc-400"
        >
          Sign in
        </Link>
      </div>

      <p className="max-w-xs text-xs text-zinc-500 dark:text-zinc-500">
        This is a San Diego-area prototype. It never guarantees a dish is
        free from allergens or cross-contact — always confirm with the
        restaurant before ordering.
      </p>
    </main>
  );
}
