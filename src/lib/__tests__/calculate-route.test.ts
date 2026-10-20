import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimits } from "../rate-limit";
const { insert, values } = vi.hoisted(() => ({ insert: vi.fn(), values: vi.fn() }));
vi.mock("@/db", () => ({ db: { insert } }));
vi.mock("@/lib/log", () => ({ logOnce: vi.fn() }));
import { POST } from "@/app/api/calculate/route";
const valid = { views: 1_000_000, niche: "technology-software", country: "india", type: "long" };
const request = (body: string) => new Request("http://test/api/calculate", { method: "POST", body });
beforeEach(() => { resetRateLimits(); insert.mockReset().mockReturnValue({ values }); values.mockReset().mockResolvedValue(undefined); });
describe("POST /api/calculate", () => {
  it.each(["null", "[]", '"text"', "{}"])("returns 422 for %s instead of throwing", async (body) => {
    const response = await POST(request(body));
    expect(response.status).toBe(422);
    expect(insert).not.toHaveBeenCalled();
  });
  it("returns 400 for malformed JSON", async () => { expect((await POST(request("{"))).status).toBe(400); });
  it("returns 413 before parsing oversized requests", async () => { expect((await POST(request("x".repeat(4097)))).status).toBe(413); });
  it("returns and logs a valid estimate", async () => {
    const response = await POST(request(JSON.stringify(valid)));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, logged: true });
    expect(values).toHaveBeenCalledOnce();
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("59");
  });
  it("still returns the estimate on database failure", async () => {
    values.mockRejectedValueOnce(new Error("offline"));
    const response = await POST(request(JSON.stringify(valid)));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, logged: false, estimate: { monetizedShare: 1 } });
  });
  it("returns 429 with Retry-After after 60 calls", async () => {
    for (let i = 0; i < 60; i++) await POST(request("null"));
    const response = await POST(request("null"));
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
  });
});
