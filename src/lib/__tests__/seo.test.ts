import { describe, expect, it } from "vitest";
import { COUNTRIES, NICHES } from "@/lib/data";
import { CREATOR_TOOLS } from "@/lib/creator-tools";
import { GUIDES } from "@/lib/editorial";
import { LEGAL_POLICIES } from "@/lib/legal";
import {
  STATIC_PAGE_SEO,
  LEGAL_PAGE_SEO,
  allPageSeo,
  countrySeo,
  guideSeo,
  nicheSeo,
  toolSeo,
} from "@/lib/seo-keywords";
import { breadcrumbs, pageMetadata, serializeJsonLd, webPageSchema } from "@/lib/seo";

/**
 * SEO regression guard.
 *
 * These checks fail the build when a page loses its focus keyword, its
 * keyword set, its title budget or its structured data. They are cheap,
 * deterministic and cover every indexable route in the project.
 */

const TITLE_BUDGET = 60; // includes the " | ytcpm.online" template suffix
const DESCRIPTION_BUDGET = 160;

describe("focus-keyword registry", () => {
  it("gives every static page a focus keyword and a keyword set", () => {
    for (const [path, seo] of Object.entries(STATIC_PAGE_SEO)) {
      expect(path.startsWith("/"), path).toBe(true);
      expect(seo.focus.length, path).toBeGreaterThan(5);
      expect(seo.keywords.length, path).toBeGreaterThanOrEqual(4);
      expect(seo.shortDescription.length, path).toBeGreaterThan(40);
    }
  });

  it("gives every legal policy a focus keyword", () => {
    for (const policy of LEGAL_POLICIES) {
      const seo = LEGAL_PAGE_SEO[policy.path];
      expect(seo, policy.path).toBeDefined();
      expect(seo.focus.length, policy.path).toBeGreaterThan(5);
      expect(seo.keywords.length, policy.path).toBeGreaterThanOrEqual(4);
    }
  });

  it("keeps one focus keyword per page — no duplicate ownership", () => {
    const all = allPageSeo();
    const seen = new Map<string, string>();
    for (const entry of all) {
      const key = entry.seo.focus.toLowerCase();
      const owner = seen.get(key);
      expect(owner, `"${entry.seo.focus}" is claimed by both ${owner} and ${entry.path}`).toBeUndefined();
      seen.set(key, entry.path);
    }
  });

  it("covers every generated country and niche route", () => {
    for (const c of COUNTRIES) {
      const seo = countrySeo(c);
      expect(seo.focus.toLowerCase(), c.slug).toContain(c.name.toLowerCase());
      expect(seo.keywords.length, c.slug).toBeGreaterThanOrEqual(4);
    }
    for (const n of NICHES) {
      const seo = nicheSeo(n);
      expect(seo.focus.toLowerCase(), n.slug).toContain(n.name.toLowerCase());
      expect(seo.keywords.length, n.slug).toBeGreaterThanOrEqual(4);
    }
  });

  it("covers every creator tool and guide", () => {
    for (const t of CREATOR_TOOLS) {
      const seo = toolSeo(t);
      expect(seo.focus.length, t.slug).toBeGreaterThan(5);
      expect(seo.keywords.length, t.slug).toBeGreaterThanOrEqual(4);
    }
    for (const g of GUIDES) {
      const seo = guideSeo(g);
      expect(seo.focus.length, g.slug).toBeGreaterThan(5);
      expect(seo.keywords.length, g.slug).toBeGreaterThanOrEqual(4);
    }
  });

  it("lists every indexable route exactly once", () => {
    const paths = allPageSeo().map(e => e.path);
    expect(new Set(paths).size).toBe(paths.length);
    const expected =
      Object.keys(STATIC_PAGE_SEO).length +
      LEGAL_POLICIES.length +
      CREATOR_TOOLS.length +
      GUIDES.length +
      COUNTRIES.length +
      NICHES.length;
    expect(paths.length).toBe(expected);
  });
});

describe("pageMetadata", () => {
  it("emits a complete, canonical Open Graph and Twitter card", () => {
    const meta = pageMetadata("YouTube CPM in India — 2026 Model", "Model CPM and RPM scenarios for Indian audiences.", "/cpm-by-country/india", {
      focus: "youtube cpm in india",
      keywords: ["youtube cpm in india", "india rpm"],
      image: { url: "/cpm-by-country/india/opengraph-image", width: 1200, height: 630, alt: "India CPM card" },
    });

    expect(meta.title).toContain("YouTube CPM in India");
    expect(meta.description).toContain("Indian audiences");
    expect(meta.keywords).toContain("youtube cpm in india");
    expect(meta.alternates?.canonical).toBe("/cpm-by-country/india");
    expect(meta.openGraph?.locale).toBe("en_US");
    expect(meta.openGraph?.siteName).toBe("ytcpm.online");
    expect(Array.isArray(meta.openGraph?.images) ? meta.openGraph.images[0] : meta.openGraph?.images).toMatchObject({ url: "/cpm-by-country/india/opengraph-image", width: 1200, height: 630, alt: "India CPM card" });
    expect(Array.isArray(meta.twitter?.images) ? meta.twitter.images[0] : meta.twitter?.images).toMatchObject({ url: "/cpm-by-country/india/opengraph-image", alt: "India CPM card" });
  });

  it("allows large image previews in robots directives", () => {
    const meta = pageMetadata("Title", "Description", "/x");
    const robots = meta.robots as Record<string, unknown>;
    expect(robots).toBeDefined();
    expect(JSON.stringify(robots)).toContain("max-image-preview");
  });

  it("keeps every focus keyword usable inside a SERP title", () => {
    // The rendered title adds " | ytcpm.online", so the focus keyword plus
    // any qualifier must still fit inside the 60-character title budget.
    const suffix = " | ytcpm.online";
    for (const entry of allPageSeo()) {
      expect(entry.seo.focus.length + suffix.length, `${entry.path} focus keyword`).toBeLessThanOrEqual(TITLE_BUDGET);
    }
  });

  it("keeps every short description inside a usable range", () => {
    for (const entry of allPageSeo()) {
      expect(entry.seo.shortDescription.length, `${entry.path} short description`).toBeGreaterThanOrEqual(50);
      expect(entry.seo.shortDescription.length, `${entry.path} short description`).toBeLessThanOrEqual(160);
    }
  });

  it("renders a description inside the SERP budget", () => {
    const meta = pageMetadata("Title", "A description that sits comfortably inside the one hundred and sixty character budget that search engines show for a meta description.", "/x");
    expect(String(meta.description).length).toBeLessThanOrEqual(DESCRIPTION_BUDGET);
  });
});

describe("structured data", () => {
  it("builds a breadcrumb list", () => {
    const list = breadcrumbs([
      { name: "Home", path: "/" },
      { name: "Guides", path: "/guides" },
    ]);
    expect(list["@type"]).toBe("BreadcrumbList");
    expect(list.itemListElement).toHaveLength(2);
    expect((list.itemListElement as { name: string }[])[0].name).toBe("Home");
  });

  it("builds a WebPage node with an id, publisher and part-of reference", () => {
    const node = webPageSchema({ path: "/about", name: "About", description: "About the project." });
    expect(node["@type"]).toBe("WebPage");
    expect(node["@id"]).toContain("/about");
    expect(node.isPartOf).toBeDefined();
    expect(node.publisher).toBeDefined();
  });

  it("escapes angle brackets so the script tag cannot be broken", () => {
    const json = serializeJsonLd({ "@type": "WebPage", name: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("</script>");
    expect(json).toContain("\\u003c");
  });
});
