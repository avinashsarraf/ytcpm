import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimits } from "../rate-limit";
const { startAudit, loadAuditPage } = vi.hoisted(() => ({ startAudit: vi.fn(), loadAuditPage: vi.fn() }));
vi.mock("@/lib/auditor/youtube", () => ({ startAudit, loadAuditPage, AuditError: class extends Error { status = 500; } }));
vi.mock("next/headers", () => ({ cookies: async () => new Map() }));
import { POST } from "@/app/api/channel-audit/route";
const request = (body: string) => new Request("http://test/api/channel-audit", { method: "POST", body });
beforeEach(() => {
  resetRateLimits();
  startAudit.mockReset();
  loadAuditPage.mockReset();
  process.env.AUDIT_SIGNING_SECRET = "test-secret-that-is-long-enough-0000000000";
  delete process.env.YOUTUBE_API_KEY;
});
describe("POST /api/channel-audit", () => {
  it.each(["null", "[]", '"text"', "{}"])("rejects %s without calling YouTube", async body => {
    const response = await POST(request(body));
    expect([400, 422, 503]).toContain(response.status);
    expect(startAudit).not.toHaveBeenCalled();
  });
  it("rejects a non-YouTube URL", async () => {
    const response = await POST(request(JSON.stringify({ channel: "https://evil.example.com/@x" })));
    expect(response.status).toBe(422);
    expect(startAudit).not.toHaveBeenCalled();
  });
  it("explains that live audits need an API key instead of failing silently", async () => {
    const response = await POST(request(JSON.stringify({ channel: "@mkbhd" })));
    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe("not_configured");
  });
  it("rejects a tampered cursor", async () => {
    const response = await POST(request(JSON.stringify({ cursor: "abc.def" })));
    expect(response.status).toBe(422);
    expect(loadAuditPage).not.toHaveBeenCalled();
  });
  it("never returns a cacheable response", async () => {
    const response = await POST(request(JSON.stringify({ channel: "@mkbhd" })));
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
  });
  it("rejects oversized bodies", async () => {
    const response = await POST(request("x".repeat(9000)));
    expect(response.status).toBe(413);
  });
  it("blocks cross-origin requests", async () => {
    const response = await POST(new Request("http://test/api/channel-audit", { method: "POST", headers: { origin: "https://evil.example" }, body: "{}" }));
    expect(response.status).toBe(403);
  });
});
