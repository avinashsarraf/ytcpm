import { timingSafeEqual } from "node:crypto";

/**
 * API-key authentication for the CMS HTTP API.
 *
 * The key lives in the environment (`CMS_API_KEY`) and is never stored in the
 * database, so revoking access is a deployment change rather than a data
 * migration. Comparisons are constant-time.
 */

export function apiKeyFromRequest(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header) {
    const match = /^Bearer\s+(.+)$/i.exec(header.trim());
    if (match) return match[1].trim();
  }
  const direct = request.headers.get("x-cms-api-key");
  return direct ? direct.trim() : null;
}

export function isValidApiKey(key: string | null | undefined): boolean {
  const expected = process.env.CMS_API_KEY;
  if (!expected || expected.length < 16) return false;
  if (!key || key.length > 512) return false;
  const supplied = Buffer.from(key);
  const reference = Buffer.from(expected);
  if (supplied.length !== reference.length) return false;
  return timingSafeEqual(supplied, reference);
}

/** True when an API key is configured at all — used to explain a 503. */
export function apiKeyConfigured(): boolean {
  const value = process.env.CMS_API_KEY;
  return Boolean(value && value.length >= 16);
}
