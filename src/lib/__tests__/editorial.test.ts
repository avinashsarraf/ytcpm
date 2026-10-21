import { describe, expect, it } from "vitest";
import { GUIDES, SOURCES, SITE_URL } from "../editorial";
import { breadcrumbs, pageMetadata, serializeJsonLd } from "../seo";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

describe("editorial SEO contract", () => {
  it("gives each guide a distinct slug and substantial answer-first content", () => {
    expect(new Set(GUIDES.map(g => g.slug)).size).toBe(GUIDES.length);
    for (const guide of GUIDES) {
      expect(guide.answer.length).toBeGreaterThan(150);
      expect(guide.sections.length).toBeGreaterThanOrEqual(4);
      expect(new Set(guide.sections.map(s => s.id)).size).toBe(guide.sections.length);
      expect(guide.sections.flatMap(s => s.paragraphs).join(" ").split(/\s+/).length).toBeGreaterThan(200);
      for (const id of guide.sourceIds) expect(SOURCES.some(s => s.id === id)).toBe(true);
    }
  });
  it("publishes source URLs on official Google/YouTube hosts", () => {
    for (const source of SOURCES) {
      expect(["support.google.com", "developers.google.com"]).toContain(new URL(source.url).hostname);
    }
  });
  it("adds only canonical public editorial paths to the sitemap", async () => {
    const urls = (await sitemap()).map(s => s.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const path of ["/youtube-cpm-calculator", "/youtube-rpm-calculator", "/guides", "/sources", "/contact", ...GUIDES.map(g => `/guides/${g.slug}`)]) expect(urls).toContain(SITE_URL + path);
    expect(urls.some(u => /\/monitor|\/api\//.test(u))).toBe(false);
  });
  it("keeps public content crawlable without exposing API paths", () => {
    expect(robots().sitemap).toEqual([SITE_URL + "/sitemap.xml", SITE_URL + "/image-sitemap.xml"]);
    expect(robots().rules).toEqual(expect.arrayContaining([expect.objectContaining({ allow: "/", disallow: ["/api/", "/cms/"] })]));
  });
  it("creates page-specific canonicals and social URLs", () => {
    const metadata = pageMetadata("CPM tool", "Description", "/youtube-cpm-calculator");
    expect(metadata.alternates?.canonical).toBe("/youtube-cpm-calculator");
    expect(metadata.openGraph).toMatchObject({ url: SITE_URL + "/youtube-cpm-calculator", title: "CPM tool" });
  });
  it("emits complete breadcrumb positions with absolute HTTPS URLs", () => {
    const result = breadcrumbs([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides" }]);
    expect(result.itemListElement[1]).toMatchObject({ position: 2, item: SITE_URL + "/guides" });
  });
  it("escapes executable script delimiters in future CMS data", () => {
    const value = { text: "</script><script>alert(1)</script>" };
    const serialized = serializeJsonLd(value);
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual(value);
  });
});
