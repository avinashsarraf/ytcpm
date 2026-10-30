import { describe, it, expect } from "vitest";
import nextConfig from "../../../next.config";

/**
 * Headers that are easy to break and impossible to notice.
 *
 * Every assert here came out of a Lighthouse run against the live site: static
 * artwork revalidated on every visit, the edge-injected analytics beacon
 * blocked by the policy, and a health endpoint that must never be cached by a
 * proxy in front of it.
 */

type Rule = { source: string; headers: { key: string; value: string }[] };

async function rules(): Promise<Rule[]> {
  return (await nextConfig.headers!()) as Rule[];
}

async function headerFor(source: string, key: string): Promise<string | undefined> {
  const rule = (await rules()).find((r) => r.source === source);
  return rule?.headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;
}

describe("static asset caching", () => {
  it("lets browsers keep flags for a year", async () => {
    const value = await headerFor("/flags/:path*", "Cache-Control");
    expect(value).toBe("public, max-age=31536000, immutable");
  });

  it("lets browsers keep tool images for a year", async () => {
    expect(await headerFor("/images/:path*", "Cache-Control")).toContain("immutable");
  });

  it("lets browsers keep the hero illustration for a year", async () => {
    expect(await headerFor("/hero-illustration.webp", "Cache-Control")).toContain("immutable");
  });

  it("never marks HTML or API responses immutable", async () => {
    for (const rule of await rules()) {
      const cache = rule.headers.find((h) => h.key.toLowerCase() === "cache-control")?.value ?? "";
      if (!cache.includes("immutable")) continue;
      // Only the three static-asset rules above may be immutable. A wildcard
      // or a page path here would pin a stale page in every browser.
      expect(["/flags/:path*", "/images/:path*", "/hero-illustration.webp"]).toContain(rule.source);
    }
  });

  it("keeps the health endpoint uncacheable", async () => {
    expect(await headerFor("/api/health", "Cache-Control")).toBe("no-store, max-age=0");
  });
});

describe("security headers", () => {
  it("keeps HSTS on for production and off in development", async () => {
    const hsts = await headerFor("/(.*)", "Strict-Transport-Security");
    if (process.env.NODE_ENV === "development") expect(hsts).toBeUndefined();
    else {
      expect(hsts).toContain("max-age=31536000");
      expect(hsts).toContain("includeSubDomains");
    }
  });

  it("keeps the policy closed by default", async () => {
    const csp = (await headerFor("/(.*)", "Content-Security-Policy")) ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("does not allow remote scripts through a wildcard", async () => {
    const csp = (await headerFor("/(.*)", "Content-Security-Policy")) ?? "";
    const scriptSrc = csp.split(";").find((p) => p.trim().startsWith("script-src")) ?? "";
    // `https:` would allow every https origin, which defeats the point.
    expect(scriptSrc).not.toMatch(/(^|\s)https:(\s|$)/);
    expect(scriptSrc).not.toContain("*");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });
});
