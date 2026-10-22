import { describe, expect, it } from "vitest";
import {
  createApiKey,
  createSessionToken,
  hashPassword,
  hashSessionToken,
  safeEqual,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/cms/auth";

describe("password hashing", () => {
  it("verifies the right password", async () => {
    const stored = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", stored)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const stored = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery stapl", stored)).toBe(false);
  });

  it("never stores the password itself", async () => {
    const stored = await hashPassword("my-secret-password");
    expect(stored).not.toContain("my-secret-password");
    expect(stored.startsWith("scrypt$")).toBe(true);
  });

  it("salts every hash, so two identical passwords differ", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
    expect(await verifyPassword("same-password", a)).toBe(true);
    expect(await verifyPassword("same-password", b)).toBe(true);
  });

  it("rejects a missing or malformed hash", async () => {
    expect(await verifyPassword("x", null)).toBe(false);
    expect(await verifyPassword("x", undefined)).toBe(false);
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
    expect(await verifyPassword("x", "scrypt$16384$8$1$only-three-parts")).toBe(false);
  });

  it("refuses absurd scrypt parameters from a tampered row", async () => {
    const tampered = "scrypt$99999999$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    expect(await verifyPassword("x", tampered)).toBe(false);
  });
});

describe("session tokens", () => {
  it("creates a long random token", () => {
    const token = createSessionToken();
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(createSessionToken()).not.toBe(token);
  });

  it("stores only the hash of the token", () => {
    const token = createSessionToken();
    const hash = hashSessionToken(token);
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(token);
    expect(hashSessionToken(token)).toBe(hash);
  });

  it("compares hashes in constant time without throwing on a length mismatch", () => {
    expect(safeEqual("abcd", "abcd")).toBe(true);
    expect(safeEqual("abcd", "abce")).toBe(false);
    expect(safeEqual("abcd", "abc")).toBe(false);
  });
});

describe("api keys and cookie options", () => {
  it("creates a prefixed, URL-safe key", () => {
    const key = createApiKey();
    expect(key.startsWith("ytcpm_")).toBe(true);
    expect(key).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("marks the session cookie HttpOnly and Lax", () => {
    const options = sessionCookieOptions();
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.maxAge).toBeGreaterThan(0);
  });
});
