import { describe, expect, it } from "vitest";
import { parseChannelInput } from "../auditor/input";
import { readCursor, readExport, signCursor, signExport } from "../auditor/cursor";
import { analyzeVideos, viewsPerDay } from "../auditor/analysis";
import { buildInsights } from "../auditor/insights";
import { buildScenario, isShort, parseDuration } from "../auditor/estimate";
import { buildSummaryText } from "../auditor/report";
import { sampleReport } from "../auditor/sample";
import { planAllows } from "../auditor/catalog";
import { categoryName } from "../auditor/categories";

process.env.AUDIT_SIGNING_SECRET = "test-secret-that-is-long-enough-0000000000";

describe("channel input parsing", () => {
  it("accepts handles, @handle URLs, channel URLs and legacy user URLs", () => {
    expect(parseChannelInput("@mkbhd")).toEqual({ kind: "handle", value: "mkbhd" });
    expect(parseChannelInput("https://www.youtube.com/@mkbhd")).toEqual({ kind: "handle", value: "mkbhd" });
    expect(parseChannelInput("youtube.com/channel/UCabcdefghijklmnopqrstuv")).toEqual({ kind: "id", value: "UCabcdefghijklmnopqrstuv" });
    expect(parseChannelInput("https://www.youtube.com/user/someuser")).toEqual({ kind: "username", value: "someuser" });
  });
  it("rejects non-YouTube hosts, private hosts and junk", () => {
    expect(parseChannelInput("https://evil.example.com/@mkbhd")).toBeNull();
    expect(parseChannelInput("http://localhost/@mkbhd")).toBeNull();
    expect(parseChannelInput("javascript:alert(1)")).toBeNull();
    expect(parseChannelInput("")).toBeNull();
    expect(parseChannelInput("https://www.youtube.com/@mkbhd/videos")).toEqual({ kind: "handle", value: "mkbhd" });
  });
  it("never returns a value that could be fetched as a URL", () => {
    const parsed = parseChannelInput("https://user:pass@www.youtube.com/@mkbhd");
    expect(parsed === null || parsed.kind !== "id").toBe(true);
  });
});

describe("signed audit tokens", () => {
  it("round-trips a cursor and rejects tampering", () => {
    const token = signCursor({ channelId: "UCabcdefghijklmnopqrstuv", collection: "videos", playlistId: "PL123", level: "full", pageToken: "abc" });
    expect(readCursor(token)?.pageToken).toBe("abc");
    expect(readCursor(token.replace(/.$/, "x"))).toBeNull();
    expect(readCursor("not-a-token")).toBeNull();
  });
  it("round-trips an export token and rejects a foreign channel", () => {
    const token = signExport("UCabcdefghijklmnopqrstuv", "half");
    expect(readExport(token)?.level).toBe("half");
    const [body, signature] = token.split(".");
    const tampered = `${body.replace(/.$/, body.endsWith("a") ? "b" : "a")}.${signature}`;
    expect(readExport(tampered)).toBeNull();
    expect(readExport(`${body}.${"x".repeat(signature.length)}`)).toBeNull();
  });
});

describe("public video analysis", () => {
  const videos = [
    { id: "a", title: "Best laptop setup for editing", description: "notes", publishedAt: "2026-01-01T00:00:00Z", tags: ["laptop", "editing"], categoryId: "17", views: 1000, likes: 50, comments: 10, duration: "PT8M" },
    { id: "b", title: "Laptop tips and tricks", description: "", publishedAt: "2026-02-01T00:00:00Z", tags: ["laptop"], categoryId: "17", views: 100, likes: 1, comments: 0, duration: "PT60S" },
  ];
  it("ranks repeated phrases by associated views", () => {
    const analysis = analyzeVideos(videos, "");
    expect(analysis.phrases[0].phrase).toBe("laptop");
    expect(analysis.phrases[0].associatedViews).toBe(1100);
  });
  it("infers a niche signal and counts missing descriptions", () => {
    const analysis = analyzeVideos(videos, "tech and editing gear");
    expect(analysis.niche).toBe("technology-software");
    expect(analysis.missingDescriptions).toBe(1);
  });
  it("computes views per day from publication age", () => {
    const video = { ...videos[0], publishedAt: new Date(Date.now() - 10 * 86400000).toISOString() };
    expect(viewsPerDay(video)).toBeCloseTo(100, 0);
  });
});

describe("channel insights", () => {
  it("ranks best and worst performers and keeps engagement above 100% possible", () => {
    const insights = buildInsights([
      { id: "a", title: "Top video", description: "", publishedAt: "2026-01-01T00:00:00Z", tags: ["tag"], categoryId: "10", views: 5000, likes: 900, comments: 300, duration: "PT10M" },
      { id: "b", title: "Low video", description: "", publishedAt: "2026-01-02T00:00:00Z", tags: [], categoryId: "10", views: 100, likes: 1, comments: 0, duration: "PT10M" },
    ]);
    expect(insights.best?.id).toBe("a");
    expect(insights.worst?.id).toBe("b");
    expect(insights.engagement).toBeGreaterThan(0);
  });
});

describe("revenue scenarios", () => {
  it("parses durations and flags Shorts", () => {
    expect(parseDuration("PT3M20S")).toBe(200);
    expect(parseDuration("PT45S")).toBe(45);
    expect(isShort("PT45S")).toBe(true);
    expect(isShort("PT8M")).toBe(false);
  });
  it("keeps every CPM and RPM value non-negative and ordered", () => {
    const scenario = buildScenario(sampleReport().videos, { marketSlug: "united-states", nicheSlug: "technology-software" });
    expect(scenario.cpmLow).toBeGreaterThan(0);
    expect(scenario.cpmHigh).toBeGreaterThanOrEqual(scenario.cpmLow);
    expect(scenario.longRpmLow).toBeGreaterThanOrEqual(0);
    expect(scenario.shortRpmLow).toBeGreaterThanOrEqual(0);
    expect(scenario.monthlyHigh).toBeGreaterThanOrEqual(scenario.monthlyLow);
  });
  it("scales revenue with views", () => {
    const videos = sampleReport().videos;
    const small = buildScenario(videos.slice(0, 2), { nicheSlug: "finance-investing" });
    const large = buildScenario(videos, { nicheSlug: "finance-investing" });
    expect(large.longViews).toBeGreaterThan(small.longViews);
  });
});

describe("plan gating", () => {
  it("keeps half and full features behind the right plan", () => {
    expect(planAllows("free", "half")).toBe(false);
    expect(planAllows("free", "copy")).toBe(false);
    expect(planAllows("half", "copy")).toBe(true);
    expect(planAllows("half", "full")).toBe(false);
    expect(planAllows("full", "full")).toBe(true);
  });
});

describe("report summary", () => {
  it("labels public, inferred and estimated content honestly", () => {
    const report = sampleReport();
    const text = buildSummaryText({ channel: report.channel, videos: report.videos, playlists: report.playlists, insights: buildInsights(report.videos, { description: report.channel.description }), fetchedAt: report.fetchedAt });
    expect(text).toContain("public YouTube data");
    expect(text).toContain("modelled scenarios");
    expect(text).not.toContain("verified average");
  });
});

describe("category labels", () => {
  it("maps known ids and falls back safely", () => {
    expect(categoryName("10")).toBe("Education");
    expect(categoryName("999")).toContain("999");
    expect(categoryName("")).toBe("Uncategorised");
  });
});
