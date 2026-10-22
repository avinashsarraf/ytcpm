import { describe, expect, it } from "vitest";
import { calculateCreatorTool, CREATOR_TOOLS, getCreatorTool } from "../creator-tools";
const defaults = (slug: string) => {
  const tool = getCreatorTool(slug)!;
  return { tool, raw: Object.fromEntries(tool.fields.map(f => [f.key, f.value])) };
};
describe("creator planning tools", () => {
  it.each([
    ["youtube-shorts-earnings-calculator", 60],
    ["youtube-views-to-money-calculator", 300],
    ["youtube-revenue-goal-calculator", 333334],
    ["youtube-cpm-to-rpm-calculator", 4.4],
    ["youtube-sponsorship-calculator", 1200],
    ["youtube-engagement-rate-calculator", 4.5],
    ["youtube-watch-time-calculator", 666.6666666667],
  ])("calculates the documented %s example", (slug, target) => {
    const { tool, raw } = defaults(slug as string);
    expect(calculateCreatorTool(tool, raw)?.value).toBeCloseTo(target as number, 7);
  });
  for (const tool of CREATOR_TOOLS) {
    const raw = Object.fromEntries(tool.fields.map(f => [f.key, f.value]));
    for (const field of tool.fields) {
      it.each(["", " ", "abc", "NaN", "Infinity", "-1", String(field.max + 1)])(`${tool.shortTitle}: rejects ${field.key}=%s`, value => {
        expect(calculateCreatorTool(tool, { ...raw, [field.key]: value })).toBeNull();
      });
      it(`${tool.shortTitle}: accepts bounds for ${field.key}`, () => {
        for (const value of [field.min, field.max]) expect(calculateCreatorTool(tool, { ...raw, [field.key]: String(value) })).not.toBeNull();
      });
      if (field.step === "1") it(`${tool.shortTitle}: rejects fractional ${field.key}`, () => {
        expect(calculateCreatorTool(tool, { ...raw, [field.key]: "1.5" })).toBeNull();
      });
    }
    it(`${tool.shortTitle}: accepts its full maximum scenario`, () => {
      expect(calculateCreatorTool(tool, Object.fromEntries(tool.fields.map(f => [f.key, String(f.max)])))).not.toBeNull();
    });
  }
  it("does not deduct the platform share from creator RPM again", () => {
    const { tool, raw } = defaults("youtube-shorts-earnings-calculator");
    expect(calculateCreatorTool(tool, { ...raw, rpm: "1", views: "1000" })?.value).toBe(1);
  });
  it("models ad density above one without clamping it to fill percentage", () => {
    const { tool, raw } = defaults("youtube-cpm-to-rpm-calculator");
    expect(calculateCreatorTool(tool, { ...raw, impressions: "150" })?.value).toBeCloseTo(8.25);
  });
  it("retains interaction rates over 100%, not unique-viewer rates", () => {
    const { tool, raw } = defaults("youtube-engagement-rate-calculator");
    expect(calculateCreatorTool(tool, { ...raw, views: "10", likes: "10", comments: "20" })?.value).toBe(300);
  });
  it("rejects zero denominators and supports a zero goal", () => {
    const { tool, raw } = defaults("youtube-revenue-goal-calculator");
    expect(calculateCreatorTool(tool, { ...raw, rpm: "0" })).toBeNull();
    expect(calculateCreatorTool(tool, { ...raw, goal: "0" })).toEqual({ value: 0, secondary: 0 });
  });
  it("rounds planning targets upward", () => {
    const goal = defaults("youtube-revenue-goal-calculator");
    expect(calculateCreatorTool(goal.tool, goal.raw)?.secondary).toBe(11112);
    const watch = defaults("youtube-watch-time-calculator");
    expect(calculateCreatorTool(watch.tool, watch.raw)?.secondary).toBe(60000);
  });
  it("has unique routes, supported related links and complete editorial sections", () => {
    expect(new Set(CREATOR_TOOLS.map(t => t.slug)).size).toBe(CREATOR_TOOLS.length);
    for (const tool of CREATOR_TOOLS) {
      expect(tool.sections.length).toBeGreaterThanOrEqual(3);
      expect(tool.faqs.length).toBeGreaterThanOrEqual(3);
      for (const slug of tool.related) expect(getCreatorTool(slug)).toBeDefined();
    }
    expect(getCreatorTool("nonexistent")).toBeUndefined();
  });
});
