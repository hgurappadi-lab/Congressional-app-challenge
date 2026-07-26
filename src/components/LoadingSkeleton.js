// Placeholder shown while result cards load — motion-safe: only pulses
// when the user hasn't requested reduced motion.
export default function LoadingSkeleton({ count = 3 }) {
  return (
    <ul className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="motion-safe:animate-pulse rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 h-5 w-2/3 rounded bg-surface" />
          <div className="mb-2 h-4 w-1/3 rounded bg-surface" />
          <div className="h-4 w-full rounded bg-surface" />
        </li>
      ))}
    </ul>
  );
}
