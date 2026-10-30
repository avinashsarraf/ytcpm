import { describe, it, expect, afterEach } from "vitest";
import { AHREFS_ANALYTICS, CLOUDFLARE_INSIGHTS, THIRD_PARTY_ORIGINS, analyticsEnabled } from "@/lib/analytics";
import nextConfig from "../../../next.config";

/**
 * The analytics tag is the kind of thing that fails silently: a typo in the
 * key, a CSP that blocks the download, a CSP that blocks the beacon. The
 * dashboard just stays empty and nobody knows why for a month. These tests pin
 * the three values that have to agree.
 */

async function csp(): Promise<string> {
  const rules = await nextConfig.headers!();
  const all = rules.find((rule) => rule.source === "/(.*)")!.headers;
  const policy = all.find((header) => header.key === "Content-Security-Policy");
  expect(policy, "Content-Security-Policy header").toBeDefined();
  return String(policy!.value);
}

/** One directive out of a CSP string, as a list of sources. */
function directive(policy: string, name: string): string[] {
  const found = policy.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name} `));
  expect(found, `${name} directive`).toBeDefined();
  return found!.split(/\s+/).slice(1);
}

describe("Ahrefs analytics tag", () => {
  it("is the script Ahrefs ships, over https", () => {
    const url = new URL(AHREFS_ANALYTICS.scriptSrc);
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("analytics.ahrefs.com");
    expect(url.pathname).toBe("/analytics.js");
  });

  it("carries a plausible public site key", () => {
    // Ahrefs keys are short, unseparated alphanumeric strings. This catches a
    // pasted URL, an empty value or a key trimmed by a bad copy.
    expect(AHREFS_ANALYTICS.key).toMatch(/^[A-Za-z0-9]{16,32}$/);
  });

  it("keeps the CSP origin in step with the script URL", () => {
    expect(AHREFS_ANALYTICS.origin).toBe(new URL(AHREFS_ANALYTICS.scriptSrc).origin);
  });

  it("is allowed to download by script-src", async () => {
    expect(directive(await csp(), "script-src")).toContain(AHREFS_ANALYTICS.origin);
  });

  it("is allowed to report by connect-src", async () => {
    // Without this the script loads, runs, and every measurement is dropped.
    expect(directive(await csp(), "connect-src")).toContain(AHREFS_ANALYTICS.origin);
  });

  it("allows the Cloudflare beacon the edge injects", async () => {
    // Cloudflare appends its beacon to the HTML leaving the edge; nothing in
    // this repository can remove it, so blocking it only logs an error on
    // every visit. This is the finding that scored Best Practices 92.
    const policy = await csp();
    expect(directive(policy, "script-src")).toContain(CLOUDFLARE_INSIGHTS.scriptOrigin);
    // The script and the endpoint it reports to are different hosts.
    expect(directive(policy, "connect-src")).toContain(CLOUDFLARE_INSIGHTS.beaconOrigin);
  });

  it("serves every declared third-party origin, and nothing else", async () => {
    const policy = await csp();
    const script = directive(policy, "script-src").filter((s) => s.startsWith("http"));
    const connect = directive(policy, "connect-src").filter((s) => s.startsWith("http"));
    expect([...script].sort()).toEqual([...THIRD_PARTY_ORIGINS.scripts].sort());
    // connect-src also carries the app's own API calls via 'self', plus ws: in
    // development; only the declared third parties may appear by URL.
    for (const origin of connect) expect(THIRD_PARTY_ORIGINS.connect).toContain(origin);
  });

  it("does not open the policy to every origin", async () => {
    const policy = await csp();
    expect(directive(policy, "script-src")).not.toContain("*");
    expect(directive(policy, "script-src")).not.toContain("https:");
    expect(policy).not.toContain("unsafe-eval");
  });
});

describe("analyticsEnabled", () => {
  const original = process.env.NEXT_PUBLIC_AHREFS_ANALYTICS;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_AHREFS_ANALYTICS;
    else process.env.NEXT_PUBLIC_AHREFS_ANALYTICS = original;
  });

  it("is on when nothing is configured", () => {
    delete process.env.NEXT_PUBLIC_AHREFS_ANALYTICS;
    expect(analyticsEnabled()).toBe(true);
  });

  it("can be switched off for a build that wants no third-party calls", () => {
    process.env.NEXT_PUBLIC_AHREFS_ANALYTICS = "off";
    expect(analyticsEnabled()).toBe(false);
  });

  it("treats any other value as on", () => {
    process.env.NEXT_PUBLIC_AHREFS_ANALYTICS = "on";
    expect(analyticsEnabled()).toBe(true);
  });
});
