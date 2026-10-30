/**
 * Signed preview links for unpublished posts.
 *
 * A draft has no public URL, but the author still needs to see the real page:
 * the actual layout, the table of contents, the share buttons, the typography
 * — not a lookalike inside the admin. A preview link grants exactly that,
 * without publishing the post and without letting anybody else guess the URL.
 *
 * The token is an HMAC over the slug and an expiry time, so it cannot be
 * forged, cannot be edited to point at another post and stops working on its
 * own. It is signed with a server-only secret; if no secret is configured the
 * feature turns itself off rather than falling back to something guessable.
 *
 * The pages that use a token are always `noindex`, are never added to the
 * sitemap or the feed, and are never cached.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/** How long a link stays valid. Long enough to write and review, short enough to leak safely. */
export const PREVIEW_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * The secret used to sign preview links.
 *
 * A dedicated `CMS_PREVIEW_SECRET` is preferred. Without one the CMS reuses
 * the revalidation secret, and failing that the API key, so a deployment that
 * already has a CMS has preview links without any extra configuration.
 * Returns null when there is nothing to sign with.
 */
export function previewSecret(): string | null {
  const candidates = [process.env.CMS_PREVIEW_SECRET, process.env.CMS_REVALIDATE_SECRET, process.env.CMS_API_KEY];
  for (const value of candidates) {
    if (value && value.length >= 16) return value;
  }
  return null;
}

function sign(slug: string, expiresAt: number, secret: string): string {
  return createHmac("sha256", secret).update(`${slug}.${expiresAt}`).digest("base64url");
}

/**
 * Builds a preview token for one post.
 *
 * Returns null when previewing is not configured, so the caller can hide the
 * link instead of handing out a URL that will not work.
 */
export function createPreviewToken(slug: string, ttlSeconds: number = PREVIEW_TTL_SECONDS): string | null {
  const secret = previewSecret();
  if (!secret || !slug) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + Math.max(60, ttlSeconds);
  const signature = sign(slug, expiresAt, secret);
  return `${expiresAt}.${signature}`;
}

/** The URL an author should open to see the post exactly as it will be published. */
export function previewPath(slug: string, ttlSeconds?: number): string | null {
  const token = createPreviewToken(slug, ttlSeconds);
  if (!token) return null;
  return `/blog/${slug}?preview=${encodeURIComponent(token)}`;
}

/**
 * Checks a token against a slug.
 *
 * Fails closed on anything unexpected: a missing token, a malformed token, an
 * expired token, a token for a different post, or no configured secret.
 */
export function verifyPreviewToken(slug: string, token: string | null | undefined): boolean {
  if (!slug || !token) return false;
  const secret = previewSecret();
  if (!secret) return false;

  const separator = token.indexOf(".");
  if (separator <= 0) return false;

  const expiresAt = Number.parseInt(token.slice(0, separator), 10);
  if (!Number.isFinite(expiresAt)) return false;
  if (expiresAt * 1000 < Date.now()) return false;

  const supplied = token.slice(separator + 1);
  const expected = sign(slug, expiresAt, secret);

  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  if (suppliedBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(suppliedBytes, expectedBytes);
}
