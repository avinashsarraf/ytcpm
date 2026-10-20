/**
 * Minimal structured logger with de-duplication.
 *
 * A missing/unreachable database used to print a full Drizzle stack trace on
 * every request, which floods container logs. We log the first occurrence of a
 * message with the error attached, then only a one-line counter every N hits.
 */
const seen = new Map<string, { count: number; lastLogged: number }>();
const REPEAT_EVERY = 50;

export function logOnce(scope: string, message: string, error?: unknown): void {
  const key = `${scope}:${message}`;
  const now = Date.now();
  const entry = seen.get(key);

  if (!entry) {
    seen.set(key, { count: 1, lastLogged: now });
    console.error(`[${scope}] ${message}`, error instanceof Error ? error.message : error ?? "");
    return;
  }

  entry.count += 1;
  if (entry.count % REPEAT_EVERY === 0) {
    entry.lastLogged = now;
    console.warn(`[${scope}] ${message} (repeated ${entry.count}×)`);
  }
}

/** Test helper — clears de-duplication state. */
export function resetLogState(): void {
  seen.clear();
}
