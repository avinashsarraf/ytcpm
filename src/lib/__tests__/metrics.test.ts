import { describe, expect, it } from "vitest";
import { metricPerThousand, parseMetricInput } from "../metrics";
describe("report-based CPM/RPM arithmetic", () => {
  it("calculates CPM from gross revenue and ad impressions", () => { expect(metricPerThousand(100, 10000)).toBe(10); });
  it("calculates RPM without a second platform deduction", () => { expect(metricPerThousand(55, 20000)).toBe(2.75); });
  it("allows zero revenue with positive activity", () => { expect(metricPerThousand(0, 1000)).toBe(0); });
  it.each([0, -1, 0.5, NaN, Infinity, 1e12 + 1])("rejects invalid denominator %s", count => { expect(metricPerThousand(100, count)).toBeNull(); });
  it.each([-1, NaN, Infinity, 1e12 + 1])("rejects invalid revenue %s", value => { expect(metricPerThousand(value, 1000)).toBeNull(); });
  it("retains full calculation precision", () => { expect(metricPerThousand(1, 3)).toBeCloseTo(333.333333333); });
  it.each([["", "1000"], ["100", ""], [" ", "1000"], ["abc", "1000"], ["1e309", "1000"]])("rejects incomplete/unbounded input %s / %s", (revenue, count) => { expect(parseMetricInput(revenue, count)).toBeNull(); });
});
