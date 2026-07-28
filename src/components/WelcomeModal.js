import Link from "next/link";

// Shown as a blocking overlay on top of the home page for anyone who
// hasn't set up a food profile yet (no guest profile saved, not signed
// in). Replaces the old standalone /welcome page — same content and same
// three exits (signup, guest, sign in), just presented as a popup so the
// main page is the first thing people see.
export default function WelcomeModal() {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-8 rounded-3xl border border-border bg-card px-6 py-10 text-center shadow-xl">
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-semibold text-white">
            C
          </span>
          <h1 id="welcome-modal-title" className="text-[26px] font-semibold tracking-tight text-text sm:text-[32px]">
            ClearPlate
          </h1>
          <p className="text-base text-text-secondary">
            Find what you can actually eat nearby, based on your allergies,
            dietary restrictions, and what you&apos;re craving.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Link
            href="/auth/signup"
            className="flex min-h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Get started
          </Link>
          <Link
            href="/profile"
            className="flex min-h-11 items-center justify-center rounded-2xl border border-border bg-card px-4 text-sm font-medium text-text hover:border-accent"
          >
            Continue as guest
          </Link>
          <Link
            href="/auth/signin"
            className="flex min-h-11 items-center justify-center px-4 text-sm font-medium text-primary hover:text-primary-hover"
          >
            Sign in
          </Link>
        </div>

        <p className="max-w-xs text-xs text-text-muted">
          This is a San Diego-area prototype. It never guarantees a dish is
          free from allergens or cross-contact — always confirm with the
          restaurant before ordering.
        </p>
      </div>
    </div>
  );
}
