import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPreviewToken, previewPath, previewSecret, verifyPreviewToken } from "@/lib/cms/preview";

const SECRETS = ["CMS_PREVIEW_SECRET", "CMS_REVALIDATE_SECRET", "CMS_API_KEY"] as const;

describe("preview links", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of SECRETS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of SECRETS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
    vi.useRealTimers();
  });

  it("is off when no secret is configured", () => {
    expect(previewSecret()).toBeNull();
    expect(createPreviewToken("a-post")).toBeNull();
    expect(previewPath("a-post")).toBeNull();
    expect(verifyPreviewToken("a-post", "123.abc")).toBe(false);
  });

  it("ignores a secret that is too short to be safe", () => {
    process.env.CMS_API_KEY = "short";
    expect(previewSecret()).toBeNull();
    expect(createPreviewToken("a-post")).toBeNull();
  });

  it("prefers the dedicated preview secret", () => {
    process.env.CMS_PREVIEW_SECRET = "preview-secret-0123456789";
    process.env.CMS_REVALIDATE_SECRET = "revalidate-secret-012345";
    process.env.CMS_API_KEY = "api-key-0123456789abcdef";
    expect(previewSecret()).toBe("preview-secret-0123456789");
  });

  it("accepts the token it just issued", () => {
    process.env.CMS_API_KEY = "api-key-0123456789abcdef";
    const token = createPreviewToken("how-to-read-rpm");
    expect(token).toBeTruthy();
    expect(verifyPreviewToken("how-to-read-rpm", token)).toBe(true);
  });

  it("rejects a token issued for another post", () => {
    process.env.CMS_API_KEY = "api-key-0123456789abcdef";
    const token = createPreviewToken("post-a");
    expect(verifyPreviewToken("post-b", token)).toBe(false);
  });

  it("rejects a token signed with a different secret", () => {
    process.env.CMS_API_KEY = "api-key-0123456789abcdef";
    const token = createPreviewToken("post-a");
    process.env.CMS_API_KEY = "another-key-0123456789ab";
    expect(verifyPreviewToken("post-a", token)).toBe(false);
  });

  it("rejects a token whose expiry was rewritten", () => {
    process.env.CMS_API_KEY = "api-key-0123456789abcdef";
    const token = createPreviewToken("post-a")!;
    const signature = token.slice(token.indexOf(".") + 1);
    const future = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;
    expect(verifyPreviewToken("post-a", `${future}.${signature}`)).toBe(false);
  });

  it("rejects a token once it expires", () => {
    process.env.CMS_API_KEY = "api-key-0123456789abcdef";
    const token = createPreviewToken("post-a", 60)!;
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 61_000);
    expect(verifyPreviewToken("post-a", token)).toBe(false);
  });

  it("rejects malformed, empty and missing tokens", () => {
    process.env.CMS_API_KEY = "api-key-0123456789abcdef";
    expect(verifyPreviewToken("post-a", "")).toBe(false);
    expect(verifyPreviewToken("post-a", null)).toBe(false);
    expect(verifyPreviewToken("post-a", undefined)).toBe(false);
    expect(verifyPreviewToken("post-a", "no-dot-here")).toBe(false);
    expect(verifyPreviewToken("post-a", ".onlysignature")).toBe(false);
    expect(verifyPreviewToken("post-a", "notanumber.signature")).toBe(false);
    expect(verifyPreviewToken("", createPreviewToken("post-a"))).toBe(false);
  });

  it("builds a relative URL that carries the token", () => {
    process.env.CMS_API_KEY = "api-key-0123456789abcdef";
    const path = previewPath("how-to-read-rpm");
    expect(path).toMatch(/^\/blog\/how-to-read-rpm\?preview=/);
    const token = decodeURIComponent(path!.split("preview=")[1]);
    expect(verifyPreviewToken("how-to-read-rpm", token)).toBe(true);
  });
});
