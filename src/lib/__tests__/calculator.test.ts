import { describe, expect, it } from "vitest";
import { DEFAULT_CPM, DEFAULT_NICHE, WORLDWIDE, MAX_VIEWS, benchmarkCpm, parseViews, revenueFromCpm } from "../calculator";
import { estimateEarnings } from "../data";

describe("shared browser calculator", () => {
  it("has one finite, rounded worldwide default", () => {
    expect(DEFAULT_CPM).toBeGreaterThan(0);
    expect(DEFAULT_CPM).toBe(benchmarkCpm(DEFAULT_NICHE, WORLDWIDE));
    expect(Number(DEFAULT_CPM.toFixed(2))).toBe(DEFAULT_CPM);
  });
  it("matches the range model midpoint within CPM rounding", () => {
    const range = estimateEarnings({ views: 1000, niche: DEFAULT_NICHE, country: WORLDWIDE, type: "long", monetizedShare: 0.7 });
    expect(revenueFromCpm(1000, DEFAULT_CPM, 0.7).creator).toBeCloseTo((range.monthlyLow + range.monthlyHigh) / 2, 2);
  });
  it("applies creator share exactly once", () => {
    const result = revenueFromCpm(1_000_000, 10, 0.7);
    expect(result.gross).toBe(7000);
    expect(result.creator).toBeCloseTo(3850);
  });
  it.each([0, 0.7, 1])("handles %s ad fill", (fill) => {
    expect(revenueFromCpm(1000, 10, fill).creator).toBeCloseTo(5.5 * fill);
  });
  it("supports zero views and zero CPM", () => {
    expect(revenueFromCpm(0, 20).creator).toBe(0);
    expect(revenueFromCpm(1000, 0).creator).toBe(0);
  });
  it("normalizes formatted counts and bounds pasted values", () => {
    expect(parseViews("1,200,000")).toBe(1_200_000);
    expect(parseViews("")).toBe(0);
    expect(parseViews("9999999999999999999")).toBe(MAX_VIEWS);
  });
});

describe("self-hosted flags", () => {
  it("has a local SVG for every tracked country", async () => {
    const { COUNTRIES } = await import("../data");
    const { flagUrl } = await import("../flags");
    const { readFile } = await import("node:fs/promises");
    for (const country of COUNTRIES) {
      const path = flagUrl(country.code);
      expect(path).toMatch(/^\/flags\/[a-z]{2}\.svg$/);
      expect(await readFile(`public${path}`, "utf8")).toContain("<svg");
    }
  });
});
