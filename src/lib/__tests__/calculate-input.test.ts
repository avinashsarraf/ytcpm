import { describe, expect, it } from "vitest";
import { readLimitedJson, validateCalculation } from "../calculate-input";
const valid = { views: 1_000_000, niche: "technology-software", country: "india", type: "long" };

describe("calculation boundary validation", () => {
  it.each([null, [], "value", 12, true, {}, { ...valid, views: "1000" }, { ...valid, views: true }, { ...valid, views: 1.5 }, { ...valid, views: -1 }, { ...valid, views: 1_000_000_001 }, { ...valid, type: "unknown" }, { ...valid, niche: "missing" }, { ...valid, country: "missing" }, { ...valid, season: "Q5" }, { ...valid, monetizedShare: "0.7" }, { ...valid, monetizedShare: null }, { ...valid, monetizedShare: -1 }, { ...valid, monetizedShare: 2 }, { ...valid, monetizedShare: NaN }])("rejects invalid data %#", (value) => {
    expect(validateCalculation(value)).toBeNull();
  });
  it("allows zero views/fill and valid seasons", () => {
    expect(validateCalculation({ ...valid, views: 0, monetizedShare: 0, season: "Q4" })).toMatchObject({ views: 0, monetizedShare: 0, season: { q: "Q4" } });
    expect(validateCalculation(valid)).toMatchObject({ monetizedShare: 1 });
  });
  it("reads valid JSON and rejects malformed or empty JSON", async () => {
    expect(await readLimitedJson(new Request("http://test", { method: "POST", body: JSON.stringify(valid) }), 4096)).toEqual({ ok: true, value: valid });
    expect(await readLimitedJson(new Request("http://test", { method: "POST", body: "{" }), 4096)).toEqual({ ok: false, status: 400 });
    expect(await readLimitedJson(new Request("http://test", { method: "POST" }), 4096)).toEqual({ ok: false, status: 400 });
  });
  it("limits UTF-8 bytes, not string length or Content-Length claims", async () => {
    const req = new Request("http://test", { method: "POST", body: JSON.stringify("🙂".repeat(1500)) });
    expect(await readLimitedJson(req, 4096)).toEqual({ ok: false, status: 413 });
  });
});
