export default function Loading() {
  return (
    <div className="pt-32 sm:pt-36" aria-busy="true" aria-live="polite">
      <div className="shell">
        <div className="h-4 w-28 animate-pulse rounded-full bg-surface-2" />
        <div className="mt-5 h-10 w-2/3 animate-pulse rounded-lg bg-surface-2" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-surface-2/70" />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-surface" />
          ))}
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}
