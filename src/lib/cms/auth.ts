import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Password hashing and session tokens.
 *
 * No third-party dependency: Node's built-in `scrypt` is a memory-hard KDF and
 * is exactly what a password store needs. Sessions use 256 bits of entropy and
 * are stored server-side as a SHA-256 hash, so a database dump cannot be
 * replayed as a login cookie.
 */

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
/** scrypt needs roughly 128 * N * r bytes; give it headroom. */
const MAX_MEM = 64 * 1024 * 1024;

export const SESSION_COOKIE = "ytcpm_cms_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

/** `scrypt$N$r$p$salt$hash`, all base64url. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: MAX_MEM,
  });
  return [
    "scrypt",
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  // Refuse absurd parameters from a tampered row — they would be a DoS.
  if (n < 1024 || n > 1_048_576 || r < 1 || r > 32 || p < 1 || p > 16) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[4], "base64url");
    expected = Buffer.from(parts[5], "base64url");
  } catch {
    return false;
  }
  if (!salt.length || expected.length !== KEY_LENGTH) return false;

  try {
    const derived = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, {
      N: n,
      r,
      p,
      maxmem: MAX_MEM,
    });
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** A fresh, high-entropy session token. */
export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only the hash of a session token is ever stored. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time comparison for two hex digests of equal length. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** A random, URL-safe key for API clients. */
export function createApiKey(): string {
  return `ytcpm_${randomBytes(24).toString("base64url")}`;
}

export function sessionCookieOptions(): {
  name: string;
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax",
    // The cookie is only marked Secure in production, so local HTTP testing works.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
