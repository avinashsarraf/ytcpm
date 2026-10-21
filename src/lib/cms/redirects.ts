import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { cmsRedirects } from "@/db/schema";
import { logOnce } from "@/lib/log";

/**
 * Editor-managed redirects.
 *
 * The rule set is read on every public request by the proxy, so it is cached
 * in-process for a minute. The cache is shared by this module and the proxy,
 * and saving or deleting a rule clears it, so a redirect works the moment it
 * is saved instead of up to a minute later.
 */

const REDIRECT_CACHE_MS = 60_000;

export type RedirectRule = { fromPath: string; toPath: string; statusCode: number };

const globalForRedirects = globalThis as typeof globalThis & {
  __ytcpmRedirectCache?: { rules: RedirectRule[]; expiresAt: number };
};

export function clearRedirectCache(): void {
  globalForRedirects.__ytcpmRedirectCache = undefined;
}

function cachedRules(): RedirectRule[] | null {
  const cache = globalForRedirects.__ytcpmRedirectCache;
  if (!cache) return null;
  if (cache.expiresAt <= Date.now()) {
    globalForRedirects.__ytcpmRedirectCache = undefined;
    return null;
  }
  return cache.rules;
}

/**
 * The active rules. A database problem fails open: an empty rule set, so the
 * request continues as if no redirect existed.
 */
export async function loadRedirectRules(): Promise<RedirectRule[] | null> {
  const cached = cachedRules();
  if (cached) return cached;

  if (!isDatabaseConfigured()) return null;

  try {
    const rows = await db
      .select({ fromPath: cmsRedirects.fromPath, toPath: cmsRedirects.toPath, statusCode: cmsRedirects.statusCode })
      .from(cmsRedirects)
      .where(eq(cmsRedirects.isActive, true))
      .limit(500);

    const rules = rows.map((row) => ({ fromPath: row.fromPath, toPath: row.toPath, statusCode: row.statusCode }));
    globalForRedirects.__ytcpmRedirectCache = { rules, expiresAt: Date.now() + REDIRECT_CACHE_MS };
    return rules;
  } catch (error) {
    // Fail open — a database outage must not break the public site.
    logOnce("cms", "redirect lookup failed", error);
    return null;
  }
}
