import { describe, it, expect, beforeEach, vi } from "vitest";
import { rateLimit, resetRateLimits, clientKey } from "@/lib/rate-limit";

beforeEach(() => resetRateLimits());

describe("rateLimit", () => {
  it("allows requests up to the limit", () => {
    for (let i = 0; i < 5; i++) {
      expect(rateLimit("ip", 5, 60_000).ok).toBe(true);
    }
  });

  it("blocks the request after the limit and reports retry-after", () => {
    for (let i = 0; i < 5; i++) rateLimit("ip", 5, 60_000);
    const blocked = rateLimit("ip", 5, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("isolates buckets by key", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", 3, 60_000);
    expect(rateLimit("a", 3, 60_000).ok).toBe(false);
    expect(rateLimit("b", 3, 60_000).ok).toBe(true);
  });

  it("resets after the window expires", () => {
    // A real sleep makes this test depend on the runner's scheduler: on a
    // loaded CI machine the 10 ms window can close before the loop finishes.
    // Moving the clock instead tests the rule and nothing else.
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
      for (let i = 0; i < 2; i++) rateLimit("window", 2, 10);
      expect(rateLimit("window", 2, 10).ok).toBe(false);
      vi.setSystemTime(new Date("2026-01-01T00:00:00.005Z"));
      expect(rateLimit("window", 2, 10).ok).toBe(false);
      vi.setSystemTime(new Date("2026-01-01T00:00:00.025Z"));
      expect(rateLimit("window", 2, 10).ok).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("clientKey", () => {
  const req = (headers: Record<string, string>) =>
    new Request("http://localhost/api/calculate", { method: "POST", headers });

  it("uses the first x-forwarded-for hop (Coolify/Traefik)", () => {
    expect(clientKey(req({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }))).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip", () => {
    expect(clientKey(req({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
  });

  it("uses a sentinel when no proxy headers exist", () => {
    expect(clientKey(req({}))).toBe("unknown");
  });
});
