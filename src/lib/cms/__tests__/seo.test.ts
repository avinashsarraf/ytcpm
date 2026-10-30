import { describe, expect, it } from "vitest";
import { analyzePost, effectiveDescription, effectiveTitle, SEO_BUDGETS } from "@/lib/cms/seo";

/**
 * The analyzer is the publish gate, so its behaviour is pinned here: a post
 * that satisfies every rule must pass, and a thin post must be blocked.
 */

const BODY = [
  "## What youtube cpm vs rpm actually means",
  "",
  "CPM is what an advertiser pays for a thousand impressions, and RPM is what reaches the creator after the platform takes its share. The youtube cpm vs rpm question comes up constantly, and the answer is shorter than most explanations make it sound: both numbers describe the same impressions, but they are measured against different denominators.",
  "",
  "![A bar chart comparing CPM and RPM for the same channel](/media/2026/10/cpm-rpm-chart.png)",
  "",
  "### The two denominators",
  "",
  "CPM divides revenue by every impression the ad was served on. RPM divides the same revenue by the views that were actually monetised. If your channel had a hundred thousand impressions and sixty thousand monetised views, a ten dollar CPM would produce six hundred dollars of gross revenue, which works out to an RPM of ten dollars across the monetised views and six dollars across all the views.",
  "",
  "That gap is not a mistake in the reporting. It is the arithmetic of the inventory you did not fill with a monetised impression, plus the platform share, plus the format mix of the video the ad ran on.",
  "",
  "## Why the youtube cpm vs rpm gap changes over time",
  "",
  "Three things move the gap between the two numbers, and they move independently of each other.",
  "",
  "- **Monetised view share.** The share of your views that carried an ad. A channel that reaches a lot of viewers in countries with low advertiser demand can show a strong CPM and a weak RPM at the same time.",
  "- **Format.** Long-form video attracts a different advertiser mix than Shorts, and Shorts are monetised differently again. Mixing the two in one average hides more than it explains.",
  "- **Seasonality.** Advertiser demand is not flat across the year. A finance channel in January is not competing for the same budget as a gaming channel in July.",
  "",
  "## How to read your own youtube cpm vs rpm numbers",
  "",
  "Open YouTube Studio, go to the revenue analytics tab, and set the date range to the last twenty-eight days so the figures cover a full cycle of weekly uploads. You will find a table with an RPM column and a CPM column for each of your content types.",
  "",
  "Compare the two columns for the same row. If the RPM is a little over half the CPM, most of your views were monetised and you are close to the platform's theoretical ceiling for that mix. If the RPM is under a third of the CPM, the majority of your views were never offered an ad.",
  "",
  "### A worked example",
  "",
  "Suppose a report shows a CPM of ten dollars and an RPM of four dollars. The gap means roughly two out of every five monetised views carried an ad, and the rest of the inventory was either not eligible or not filled. On the [CPM calculator](/youtube-cpm-calculator) you can model what a different audience mix would do to that number before you change anything.",
  "",
  "## What to do about it",
  "",
  "Start with the format split, because it is the lever you control most directly. If most of your impressions come from Shorts and most of your revenue comes from long-form, the blended RPM will always look worse than the revenue actually is.",
  "",
  "Next, look at the audience country breakdown. The same video earns different amounts in different markets, and the [country benchmarks](/cpm-by-country) page shows the modelled range for each one.",
  "",
  "Finally, check how much of your watch time comes from the first thirty seconds of a video. If a large share of your views never reach the point where an ad can be served, no amount of title optimisation will close the gap.",
  "",
  "## Where these numbers come from",
  "",
  "Every figure on this site is a labelled model scenario built from the assumptions published on the [methodology page](/methodology), not a promise of payment. The platform share itself is described in the [YouTube help centre](https://support.google.com/youtube/answer/72902), and the revenue-share rules are the same for everyone in the same programme.",
  "",
  "If you want the numbers for your own channel rather than a model, the [RPM calculator](/youtube-rpm-calculator) and the [views-to-money calculator](/youtube-views-to-money-calculator) both run in your browser and need no signup.",
].join("\n");

function goodInput() {
  return {
    title: "YouTube CPM vs RPM: What the Numbers Mean",
    slug: "youtube-cpm-vs-rpm",
    excerpt: "A clear youtube cpm vs rpm explanation: what each number measures, why they differ, and how to read the gap in your own YouTube Studio report.",
    contentMd: BODY,
    focusKeyword: "youtube cpm vs rpm",
    seoTitle: "YouTube CPM vs RPM: What the Numbers Mean",
    seoDescription: "A clear youtube cpm vs rpm explanation: what each number measures, why they differ, and how to read the gap in your own YouTube Studio report.",
    seoKeywords: ["cpm or rpm", "youtube revenue metrics", "youtube monetization rpm"],
    ogImageUrl: "/media/2026/10/chart.png",
    ogImageAlt: "A bar chart comparing CPM and RPM for the same channel",
    canonicalUrl: null,
    noindex: false,
  };
}

describe("effectiveTitle and effectiveDescription", () => {
  it("prefers the explicit SEO fields", () => {
    expect(effectiveTitle({ title: "Body title", seoTitle: "Override" })).toBe("Override | ytcpm.online");
    expect(effectiveTitle({ title: "Body title", seoTitle: null })).toBe("Body title | ytcpm.online");
  });

  it("falls back from the description to the excerpt to the body", () => {
    expect(effectiveDescription({ excerpt: "The excerpt", seoDescription: "The description", contentMd: "x" })).toBe("The description");
    expect(effectiveDescription({ excerpt: "The excerpt", seoDescription: null, contentMd: "x" })).toBe("The excerpt");
    expect(effectiveDescription({ excerpt: "", seoDescription: null, contentMd: "Some body text" })).toContain("Some body text");
  });
});

describe("analyzePost", () => {
  it("gives a complete post a high score and no blocking issues", () => {
    const report = analyzePost(goodInput());
    expect(report.blocking.length).toBe(0);
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.scoreBand).not.toBe("poor");
  });

  it("blocks a post that is too thin", () => {
    const report = analyzePost({ ...goodInput(), contentMd: "Short." });
    expect(report.blocking.some((check) => check.id === "length")).toBe(true);
    expect(report.score).toBeLessThan(70);
  });

  it("blocks a post with no focus keyword", () => {
    const report = analyzePost({ ...goodInput(), focusKeyword: null });
    expect(report.blocking.some((check) => check.id === "keyword")).toBe(true);
  });

  it("blocks a post with no internal links", () => {
    const report = analyzePost({
      ...goodInput(),
      contentMd: BODY.replace(/\[([^\]]+)\]\(\/[^)]+\)/g, "$1").replace(/\[[^\]]+\]\(https:\/\/[^)]+\)/g, "the YouTube help centre"),
    });
    expect(report.blocking.some((check) => check.id === "internal-links")).toBe(true);
  });

  it("blocks a post whose images have no alt text", () => {
    const report = analyzePost({ ...goodInput(), contentMd: BODY.replace("A bar chart comparing CPM and RPM for the same channel", "") });
    expect(report.blocking.some((check) => check.id === "images")).toBe(true);
  });

  it("blocks a canonical URL that is not absolute", () => {
    const report = analyzePost({ ...goodInput(), canonicalUrl: "/blog/other-post" });
    expect(report.blocking.some((check) => check.id === "canonical")).toBe(true);
  });

  it("warns when the canonical URL points at another domain", () => {
    const report = analyzePost({ ...goodInput(), canonicalUrl: "https://example.com/post" });
    const check = report.checks.find((entry) => entry.id === "canonical");
    expect(check?.status).toBe("warn");
    expect(check?.blocking).toBe(false);
  });

  it("warns when the focus keyword is missing from the opening", () => {
    const report = analyzePost({ ...goodInput(), contentMd: BODY.replace(/youtube cpm vs rpm/g, "the two metrics") });
    expect(report.checks.some((check) => check.id === "keyword" && check.status !== "pass")).toBe(true);
  });

  it("counts the internal and external links it found", () => {
    const report = analyzePost(goodInput());
    expect(report.internalLinks).toBeGreaterThanOrEqual(2);
    expect(report.externalLinks).toBeGreaterThanOrEqual(1);
    expect(report.internalLinkList).toContain("/methodology");
  });

  it("counts the headings at the level the article page renders them", () => {
    const report = analyzePost(goodInput());
    // `##` in the body is an `<h2>` on the page — the post title is the H1.
    expect(report.headings.filter((heading) => heading.level === 2).length).toBeGreaterThanOrEqual(3);
  });

  it("keeps the title inside the SERP budget", () => {
    const report = analyzePost(goodInput());
    expect(report.titleLength).toBeLessThanOrEqual(SEO_BUDGETS.titleMax);
  });

  it("is a pure function — the same input gives the same report", () => {
    expect(analyzePost(goodInput())).toEqual(analyzePost(goodInput()));
  });
});
