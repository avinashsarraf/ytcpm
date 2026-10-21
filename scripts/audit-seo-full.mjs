/**
 * Full-site SEO audit.
 *
 * Crawls every indexable route in the sitemap and reports the complete SEO
 * surface of each page: title, meta description, keywords, canonical, robots,
 * Open Graph, Twitter card, heading hierarchy, images and internal links.
 *
 * Usage: BASE_URL=http://127.0.0.1:3100 node scripts/audit-seo-full.mjs
 * Writes /tmp/ytcpm-seo-audit.json and prints a readable report.
 */
import fs from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const origin = "https://ytcpm.online";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const issues = [];
const note = (path, level, code, detail) => issues.push({ path, level, code, detail });

try {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const xml = await (await page.request.get(`${base}/sitemap.xml`)).text();
  const paths = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => new URL(m[1]).pathname);

  const pages = [];
  const inbound = new Map(paths.map(p => [p, new Set()]));
  const outbound = new Map(paths.map(p => [p, new Set()]));

  for (const path of paths) {
    const response = await page.goto(base + path);
    if (response.status() !== 200) { note(path, "error", "status", `HTTP ${response.status()}`); continue; }
    const html = await page.content();

    const meta = async sel => { const el = page.locator(sel).first(); return (await el.count()) ? (await el.getAttribute("content")) ?? "" : null; };
    const title = await page.title();
    const description = await meta('meta[name="description"]');
    const keywords = await meta('meta[name="keywords"]');
    const robots = await meta('meta[name="robots"]');
    const ogTitle = await meta('meta[property="og:title"]');
    const ogDescription = await meta('meta[property="og:description"]');
    const ogUrl = await meta('meta[property="og:url"]');
    const ogImage = await meta('meta[property="og:image"]');
    const ogImageAlt = await meta('meta[property="og:image:alt"]');
    const ogType = await meta('meta[property="og:type"]');
    const ogSiteName = await meta('meta[property="og:site_name"]');
    const ogLocale = await meta('meta[property="og:locale"]');
    const twCard = await meta('meta[name="twitter:card"]');
    const twTitle = await meta('meta[name="twitter:title"]');
    const twDescription = await meta('meta[name="twitter:description"]');
    const twImage = await meta('meta[name="twitter:image"]');
    const twImageAlt = await meta('meta[name="twitter:image:alt"]');
    const canonicalEl = page.locator('link[rel="canonical"]').first();
    const canonical = (await canonicalEl.count()) ? await canonicalEl.getAttribute("href") : null;
    const htmlLang = await page.locator("html").getAttribute("lang");
    const viewport = await meta('meta[name="viewport"]');
    const themeColor = await meta('meta[name="theme-color"]');

    const headings = await page.locator("h1,h2,h3,h4").evaluateAll(nodes => nodes.map(n => ({ level: Number(n.tagName[1]), text: (n.textContent || "").replace(/\s+/g, " ").trim() })));
    const h1 = headings.filter(h => h.level === 1);
    const h2 = headings.filter(h => h.level === 2);
    const images = await page.locator("img").evaluateAll(nodes => nodes.map(n => ({ src: n.getAttribute("src"), alt: n.getAttribute("alt"), w: n.getAttribute("width"), h: n.getAttribute("height") })));
    const links = await page.locator("a[href]").evaluateAll(nodes => nodes.map(n => ({ href: n.getAttribute("href"), text: (n.textContent || "").replace(/\s+/g, " ").trim() })));
    const mainText = (await page.locator("main").innerText()).replace(/\s+/g, " ").trim();
    const words = mainText ? mainText.split(" ").length : 0;
    const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents())
      .map(t => { try { return JSON.parse(t); } catch { return null; } })
      .filter(Boolean)
      .flatMap(node => Array.isArray(node) ? node : [node]);
    const schemaTypes = schemas.flatMap(s => (s["@type"] ? [s["@type"]] : (s["@graph"] ?? []).map(n => n["@type"])));

    // Internal link graph.
    for (const l of links) {
      if (!l.href) continue;
      const target = new URL(l.href, origin + path);
      if (target.origin !== origin) continue;
      const to = target.pathname;
      if (!inbound.has(to)) continue;
      outbound.get(path).add(to);
      if (to !== path) inbound.get(to).add(path);
    }

    // ── Checks ───────────────────────────────────────────────────────────
    if (!title) note(path, "error", "title-missing", "no <title>");
    else {
      if (title.length < 30) note(path, "warn", "title-short", `${title.length} chars`);
      if (title.length > 60) note(path, "warn", "title-long", `${title.length} chars: ${title}`);
      if (title === title.toLowerCase()) note(path, "info", "title-case", "title is all lowercase");
    }
    if (!description) note(path, "error", "description-missing", "no meta description");
    else {
      if (description.length < 70) note(path, "warn", "description-short", `${description.length} chars`);
      if (description.length > 160) note(path, "warn", "description-long", `${description.length} chars`);
    }
    if (!keywords) note(path, "warn", "keywords-missing", "no meta keywords");
    else if (keywords.split(",").length < 3) note(path, "warn", "keywords-thin", keywords);
    if (!canonical) note(path, "error", "canonical-missing", "no canonical");
    else if (new URL(canonical).href !== new URL(origin + path).href) note(path, "error", "canonical-wrong", canonical);
    if (!robots) note(path, "warn", "robots-missing", "no meta robots");
    else if (/noindex/i.test(robots)) note(path, "error", "robots-noindex", robots);
    if (!ogTitle) note(path, "error", "og-title-missing", "");
    if (!ogDescription) note(path, "error", "og-description-missing", "");
    if (!ogUrl) note(path, "error", "og-url-missing", "");
    else if (new URL(ogUrl).href !== new URL(origin + path).href) note(path, "error", "og-url-wrong", ogUrl);
    if (!ogImage) note(path, "error", "og-image-missing", "");
    if (!ogImageAlt) note(path, "warn", "og-image-alt-missing", "");
    if (!ogType) note(path, "warn", "og-type-missing", "");
    if (!ogSiteName) note(path, "warn", "og-site-name-missing", "");
    if (!ogLocale) note(path, "info", "og-locale-missing", "");
    if (!twCard) note(path, "error", "twitter-card-missing", "");
    else if (twCard !== "summary_large_image") note(path, "warn", "twitter-card-weak", twCard);
    if (!twTitle) note(path, "error", "twitter-title-missing", "");
    if (!twDescription) note(path, "error", "twitter-description-missing", "");
    if (!twImage) note(path, "error", "twitter-image-missing", "");
    if (!twImageAlt) note(path, "warn", "twitter-image-alt-missing", "");
    if (htmlLang !== "en") note(path, "error", "lang-wrong", String(htmlLang));
    if (!viewport) note(path, "error", "viewport-missing", "");
    if (!themeColor) note(path, "info", "theme-color-missing", "");
    if (h1.length !== 1) note(path, "error", "h1-count", `${h1.length} h1 elements`);
    else if (h1[0].text.length < 12) note(path, "warn", "h1-thin", h1[0].text);
    if (h2.length === 0) note(path, "warn", "h2-missing", "no h2 headings");
    for (const h of headings) if (!h.text) note(path, "error", "heading-empty", `h${h.level}`);
    for (const img of images) {
      if (img.alt === null) note(path, "error", "img-alt-missing", img.src);
      else if (img.alt.trim() === "") note(path, "warn", "img-alt-empty", img.src);
      if (!img.w || !img.h) note(path, "warn", "img-dimensions-missing", img.src);
    }
    if (words < 300) note(path, "warn", "thin-content", `${words} words`);
    if (!schemaTypes.length) note(path, "error", "schema-missing", "");
    if (!schemaTypes.includes("BreadcrumbList")) note(path, "warn", "schema-breadcrumb-missing", "");
    if (!schemaTypes.includes("WebPage")) note(path, "warn", "schema-webpage-missing", "");
    if (outbound.get(path).size < 3) note(path, "warn", "few-outbound-links", `${outbound.get(path).size} internal links`);
    for (const l of links) if (!l.text.trim() && !l.href.startsWith("#")) note(path, "warn", "empty-link-text", l.href);

    pages.push({
      path, title, titleLength: title.length, description, descriptionLength: description?.length ?? 0,
      keywords: keywords?.split(",").map(k => k.trim()).filter(Boolean) ?? [],
      canonical, robots, ogTitle, ogDescription, ogUrl, ogImage, ogImageAlt, ogType, ogSiteName, ogLocale,
      twCard, twTitle, twDescription, twImage, twImageAlt, htmlLang, viewport, themeColor,
      h1: h1.map(h => h.text), h2: h2.map(h => h.text), headings: headings.length,
      images: images.length, words, schemaTypes,
      outbound: [...outbound.get(path)],
    });
  }

  // Inbound counts are only final once every page has been crawled.
  for (const p of pages) p.inbound = [...inbound.get(p.path)];

  // Inbound link checks need the whole graph.
  for (const p of pages) {
    if (p.inbound.length === 0) note(p.path, "error", "orphan-page", "no internal inbound links");
    else if (p.inbound.length < 2) note(p.path, "warn", "few-inbound-links", p.inbound.join(", "));
  }

  // Duplicate metadata across the site.
  const byTitle = new Map(), byDesc = new Map();
  for (const p of pages) {
    (byTitle.get(p.title) ?? byTitle.set(p.title, []).get(p.title)).push(p.path);
    (byDesc.get(p.description) ?? byDesc.set(p.description, []).get(p.description)).push(p.path);
  }
  for (const [t, ps] of byTitle) if (ps.length > 1) for (const p of ps) note(p, "error", "duplicate-title", `shared with ${ps.filter(x => x !== p).join(", ")}: ${t}`);
  for (const [d, ps] of byDesc) if (ps.length > 1) for (const p of ps) note(p, "error", "duplicate-description", `shared with ${ps.filter(x => x !== p).join(", ")}`);

  await context.close();
  await browser.close();

  const report = { base, generatedAt: new Date().toISOString(), totalRoutes: paths.length, pages, issues };
  await fs.writeFile("/tmp/ytcpm-seo-audit.json", JSON.stringify(report, null, 2));

  const byLevel = { error: [], warn: [], info: [] };
  for (const i of issues) byLevel[i.level].push(i);
  console.log(`\n=== SEO AUDIT — ${pages.length}/${paths.length} routes ===\n`);
  for (const level of ["error", "warn", "info"]) {
    console.log(`${level.toUpperCase()} (${byLevel[level].length})`);
    const grouped = new Map();
    for (const i of byLevel[level]) { const k = `${i.path} · ${i.code}`; grouped.set(k, [...(grouped.get(k) ?? []), i.detail]); }
    for (const [k, ds] of grouped) console.log(`  ${k}\n     ${[...new Set(ds)].join("\n     ")}`);
    console.log("");
  }
  console.log("INTERNAL LINK GRAPH (inbound / outbound)");
  for (const p of pages) console.log(`  ${p.path.padEnd(42)} in:${String(p.inbound.length).padStart(2)}  out:${String(p.outbound.length).padStart(2)}`);
  console.log(`\nReport: /tmp/ytcpm-seo-audit.json`);
} finally {
  await browser.close();
}
