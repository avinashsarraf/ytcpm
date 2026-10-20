import { describe, it, expect } from "vitest";
import {
  COUNTRIES, NICHES, SEASONS, US, estimateEarnings, countryMultiplier,
  CREATOR_SHARE, US_BLENDED_CPM, getCountry, getNiche, getSeason,
  money, localMoney, currencySymbol, fxNote, viewsLabel, perMillionViews,
  DATA_UPDATED_AT, VIEW_PRESETS,
} from "@/lib/data";

const india = getCountry("india")!;
const tech = getNiche("technology-software")!;
const finance = getNiche("finance-investing")!;

describe("dataset invariants", () => {
  it("has the documented coverage", () => {
    expect(COUNTRIES).toHaveLength(23);
    expect(NICHES).toHaveLength(18);
    expect(SEASONS).toHaveLength(4);
  });

  it("has unique slugs", () => {
    expect(new Set(COUNTRIES.map((c) => c.slug)).size).toBe(COUNTRIES.length);
    expect(new Set(NICHES.map((n) => n.slug)).size).toBe(NICHES.length);
  });

  it("has ordered CPM ranges and positive FX/local data", () => {
    for (const c of COUNTRIES) {
      expect(c.cpmHigh).toBeGreaterThan(c.cpmLow);
      expect(c.fx).toBeGreaterThan(0);
      expect(c.currency).toMatch(/^[A-Z]{3}$/);
    }
    for (const n of NICHES) expect(n.cpmHigh).toBeGreaterThan(n.cpmLow);
  });

  it("anchors the US as the 1.0 multiplier", () => {
    expect(countryMultiplier(US)).toBe(1);
    expect(US_BLENDED_CPM).toBe(18);
  });

  it("keeps India below the US", () => {
    expect(countryMultiplier(india)).toBeCloseTo(0.086111, 6);
  });

  it("exposes a review date", () => {
    expect(DATA_UPDATED_AT).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("estimateEarnings — long form", () => {
  it("keeps low <= high for every country × niche", () => {
    for (const country of COUNTRIES) {
      for (const niche of NICHES) {
        const e = estimateEarnings({ views: 100_000, niche, country, type: "long" });
        expect(e.cpmLow).toBeLessThanOrEqual(e.cpmHigh);
        expect(e.rpmLow).toBeLessThanOrEqual(e.rpmHigh);
        expect(e.monthlyLow).toBeLessThanOrEqual(e.monthlyHigh);
        expect(e.monthlyLow).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("scales linearly with views", () => {
    const a = estimateEarnings({ views: 10_000, niche: tech, country: US, type: "long" });
    const b = estimateEarnings({ views: 20_000, niche: tech, country: US, type: "long" });
    expect(b.monthlyLow).toBeCloseTo(a.monthlyLow * 2, 6);
    expect(b.monthlyHigh).toBeCloseTo(a.monthlyHigh * 2, 6);
  });

  it("matches the documented India regression pin", () => {
    const e = estimateEarnings({ views: 1_000_000, niche: tech, country: india, type: "long" });
    expect(e.monthlyLow).toBeCloseTo(378.888888, 4);
    expect(e.monthlyHigh).toBeCloseTo(1041.944444, 4);
    expect(e.cpmHigh).toBeCloseTo(1.894444, 5);
  });

  it("applies the creator share to RPM", () => {
    const e = estimateEarnings({ views: 1000, niche: tech, country: US, type: "long" });
    expect(e.rpmLow).toBeCloseTo(e.cpmLow * CREATOR_SHARE, 10);
    expect(e.rpmHigh).toBeCloseTo(e.cpmHigh * CREATOR_SHARE, 10);
  });

  it("reduces RPM when the ad-impression rate drops", () => {
    const full = estimateEarnings({ views: 100_000, niche: finance, country: US, type: "long" });
    const half = estimateEarnings({ views: 100_000, niche: finance, country: US, type: "long", monetizedShare: 0.5 });
    expect(half.rpmHigh).toBeCloseTo(full.rpmHigh * 0.5, 8);
    expect(half.cpmHigh).toBe(full.cpmHigh); // CPM is unaffected
    expect(half.monetizedShare).toBe(0.5);
  });

  it("clamps the ad-impression rate to a sane window", () => {
    const low = estimateEarnings({ views: 1000, niche: tech, country: US, type: "long", monetizedShare: 0 });
    expect(low.monetizedShare).toBe(0);
    expect(low.monthlyHigh).toBe(0);
    const high = estimateEarnings({ views: 1000, niche: tech, country: US, type: "long", monetizedShare: 5 });
    expect(high.monetizedShare).toBe(1);
  });

  it("applies seasonality to CPM and earnings", () => {
    const base = estimateEarnings({ views: 100_000, niche: tech, country: US, type: "long" });
    const q4 = estimateEarnings({ views: 100_000, niche: tech, country: US, type: "long", season: getSeason("Q4")!.mult });
    expect(q4.cpmHigh).toBeCloseTo(base.cpmHigh * 1.6, 6);
    expect(q4.monthlyHigh).toBeCloseTo(base.monthlyHigh * 1.6, 6);
    expect(q4.season).toBe(1.6);
  });

  it("clamps out-of-range seasonality", () => {
    const e = estimateEarnings({ views: 1000, niche: tech, country: US, type: "long", season: 99 });
    expect(e.season).toBe(2);
  });
});

describe("estimateEarnings — Shorts", () => {
  it("reports no classic CPM", () => {
    const e = estimateEarnings({ views: 1_000_000, niche: tech, country: US, type: "shorts" });
    expect(e.cpmLow).toBe(0);
    expect(e.cpmHigh).toBe(0);
  });

  it("stays far below long-form", () => {
    const shorts = estimateEarnings({ views: 1_000_000, niche: tech, country: US, type: "shorts" });
    const long = estimateEarnings({ views: 1_000_000, niche: tech, country: US, type: "long" });
    expect(shorts.monthlyHigh).toBeLessThan(long.monthlyLow);
  });

  it("uses the documented Tier-1 base range for B-tier niches", () => {
    const food = getNiche("food-cooking")!; // B tier → factor 1.0
    const e = estimateEarnings({ views: 1_000_000, niche: food, country: US, type: "shorts" });
    expect(e.rpmLow).toBeCloseTo(0.02, 10);
    expect(e.rpmHigh).toBeCloseTo(0.08, 10);
  });

  it("applies the niche tier factor within the documented band", () => {
    const s = estimateEarnings({ views: 1_000_000, niche: finance, country: US, type: "shorts" });
    const c = estimateEarnings({ views: 1_000_000, niche: getNiche("gaming")!, country: US, type: "shorts" });
    expect(s.rpmHigh).toBeCloseTo(0.08 * 1.25, 10);
    expect(c.rpmHigh).toBeCloseTo(0.08 * 0.85, 10);
  });

  it("differentiates niches and no longer flattens every low-CPM country", () => {
    const a = estimateEarnings({ views: 1_000_000, niche: finance, country: US, type: "shorts" });
    const b = estimateEarnings({ views: 1_000_000, niche: tech, country: US, type: "shorts" });
    expect(a.rpmHigh).toBeGreaterThan(b.rpmHigh);

    const indiaShorts = estimateEarnings({ views: 1_000_000, niche: tech, country: india, type: "shorts" });
    expect(indiaShorts.rpmHigh).toBeLessThan(b.rpmHigh);
    expect(indiaShorts.rpmHigh).toBeGreaterThan(0);
  });

  it("stays inside the FAQ band (roughly $0.02–$0.10 per 1K in Tier-1)", () => {
    for (const niche of NICHES) {
      const e = estimateEarnings({ views: 1000, niche, country: US, type: "shorts" });
      expect(e.rpmLow).toBeGreaterThanOrEqual(0.02 * 0.85);
      expect(e.rpmHigh).toBeLessThanOrEqual(0.08 * 1.25);
    }
  });
});

describe("formatters", () => {
  it("formats USD with adaptive precision", () => {
    expect(money(24)).toBe("$24");
    expect(money(9.5)).toBe("$9.50");
    expect(money(9.5, 2)).toBe("$9.50");
  });

  it("formats local currency with the country locale", () => {
    expect(localMoney(100, india)).toContain("8,600");
    expect(localMoney(10, US)).toContain("$");
    expect(currencySymbol(india)).toBe("₹");
    expect(fxNote(US)).toBe("Values in US Dollars");
    expect(fxNote(india)).toContain("86");
  });

  it("never throws for exotic locale/currency combinations", () => {
    const fake = { ...india, locale: "not-a-locale", currency: "XXX" };
    expect(() => localMoney(10, fake)).not.toThrow();
    expect(typeof localMoney(10, fake)).toBe("string");
    expect(localMoney(10, fake)).toContain("860");
  });

  it("labels view counts", () => {
    expect(viewsLabel(1_000)).toBe("1K");
    expect(viewsLabel(1_500_000)).toBe("1.5M");
    expect(viewsLabel(2_000_000)).toBe("2M");
    expect(viewsLabel(500)).toBe("500");
  });

  it("converts RPM to per-million earnings", () => {
    expect(perMillionViews(1, 2)).toEqual({ low: 1000, high: 2000 });
  });

  it("keeps view presets ascending", () => {
    expect([...VIEW_PRESETS].sort((a, b) => a - b)).toEqual(VIEW_PRESETS);
  });
});
