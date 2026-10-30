import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = process.env.BASE_URL ?? "http://localhost:3000";
const origin = "https://ytcpm.online";
const paths = ["/legal", "/privacy", "/terms", "/disclaimer", "/cookies", "/", "/youtube-cpm-calculator", "/youtube-rpm-calculator", "/guides", "/sources", "/guides/how-to-check-youtube-cpm", "/guides/youtube-cpm-vs-rpm", "/guides/youtube-earnings-per-1000-views", "/cpm-by-country", "/cpm-by-country/india", "/cpm-by-niche", "/cpm-by-niche/finance-investing", "/methodology", "/about", "/contact", "/tools", "/channel-auditor"];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ["--no-sandbox", "--disable-dev-shm-usage"], headless: true });
try {
  // A disabled-JS browser verifies real HTML, not content that exists only in hydration data.
  const plain = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 900 } });
  const page = await plain.newPage();
  const titles = new Set();
  for (const path of paths) {
    const response = await page.goto(base + path);
    assert.equal(response.status(), 200, path);
    assert.equal(await page.locator('h1').count(), 1, `one H1 ${path}`);
    const h1 = (await page.locator('h1').first().innerText()).trim();
    assert(h1.length >= 12, `descriptive H1 ${path}: ${h1}`);
    const title = await page.title(); assert(!titles.has(title), `unique title ${path}`); titles.add(title);
    assert(title.length <= 60, `title within SERP budget ${path}: ${title.length}`);
    assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href')).href, new URL(origin + path).href);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    assert(description.length > 50 && description.length <= 160, `description length ${path}: ${description.length}`);

    // Focus keywords and their supporting set must be present on every page.
    const keywords = await page.locator('meta[name="keywords"]').getAttribute('content');
    assert(keywords && keywords.split(',').length >= 4, `keywords ${path}`);

    // Open Graph and Twitter cards.
    assert.equal(await page.locator('meta[property="og:locale"]').getAttribute('content'), 'en_US', `og:locale ${path}`);
    assert.equal(await page.locator('meta[property="og:site_name"]').getAttribute('content'), 'ytcpm.online', `og:site_name ${path}`);
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    assert(ogImage, `og:image ${path}`);
    const ogImageAlt = await page.locator('meta[property="og:image:alt"]').getAttribute('content');
    assert(ogImageAlt && ogImageAlt.length > 8, `og:image:alt ${path}`);
    const twImageAlt = await page.locator('meta[name="twitter:image:alt"]').getAttribute('content');
    assert(twImageAlt && twImageAlt.length > 8, `twitter:image:alt ${path}`);
    assert(await page.locator('meta[name="twitter:card"]').getAttribute('content') !== null, `twitter:card ${path}`);

    // Structured data: every page publishes a WebPage node and a breadcrumb trail.
    const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse).flatMap(s => (Array.isArray(s) ? s : [s]));
    assert(schemas.some(s => s['@type'] === 'WebPage'), `WebPage schema ${path}`);
    assert(schemas.some(s => s['@type'] === 'BreadcrumbList'), `BreadcrumbList schema ${path}`);

    // Every image carries an alt attribute so image search can index it.
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      assert(alt !== null, `img alt present ${path}`);
    }

    if (path.includes('/guides/') || path.includes('-calculator')) {
      assert((await page.locator('main').textContent()).length > 1000, `substantial SSR content ${path}`);
      assert(await page.locator('main a[href^="https://support.google.com/"]').count() > 0, `primary source ${path}`);
      assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), origin + path);
    }
    if (['/privacy', '/terms', '/disclaimer', '/cookies'].includes(path)) {
      assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), origin + path);
      assert.equal(await page.locator('main details.group').count(), 3, 'policy FAQs in initial HTML');
      assert.equal(await page.locator('main nav[aria-label="Legal policies"] a[aria-current="page"]').count(), 1);
      assert(schemas.some(s => s['@type'] === 'WebPage' && s.url === origin + path));
      assert(schemas.some(s => s['@type'] === 'BreadcrumbList'));
      const mobileToc = page.locator('details').filter({hasText: 'Jump to a section'});
      await mobileToc.locator('summary').click();
      const target = await mobileToc.locator('a').first().getAttribute('href');
      assert.equal(await page.locator(target).count(), 1, 'TOC resolves to a section');
      await page.locator('main details.group summary').first().click();
      assert(await page.locator('main details.group').first().locator('p').isVisible(), 'policy FAQ works without JS');
    }
    console.log('PASS SEO HTML',path);
  }
  await page.goto(base);
  assert.equal(await page.locator('details[id^="faq-"]').count(),6);
  assert((await page.locator('details[id^="faq-"]').nth(4).textContent()).includes('owner authorization'));
  await page.locator('details[id^="faq-"] summary').nth(4).click();
  assert(await page.locator('details[id^="faq-"]').nth(4).locator('p').isVisible(), 'FAQ works without JS');
  assert.equal((await page.goto(base+'/guides/nonexistent-guide')).status(),404);
  const map=await (await page.request.get(base+'/sitemap.xml')).text();
  for(const path of paths.filter(p=>p!=='/')) assert(map.includes(origin+path),`sitemap ${path}`);
  assert(!map.includes(origin+'/monitor'));assert(!map.includes(origin+'/api/'));
  // The image sitemap lists the social cards with a title and a caption.
  const imageMap=await (await page.request.get(base+'/image-sitemap.xml')).text();
  assert(imageMap.includes('<image:loc>'),'image sitemap entries');
  assert(imageMap.includes('<image:title>'),'image sitemap titles');
  assert(imageMap.includes('/cpm-by-country/india/opengraph-image'),'country image in image sitemap');
  assert(imageMap.includes('/cpm-by-niche/finance-investing/opengraph-image'),'niche image in image sitemap');
  assert(imageMap.includes('/channel-auditor/opengraph-image'),'auditor image in image sitemap');
  const robots=await (await page.request.get(base+'/robots.txt')).text();
  assert(robots.includes('image-sitemap.xml'),'robots points at the image sitemap');
  await plain.close();
  const interactive=await browser.newContext();const tool=await interactive.newPage();const errors=[];tool.on('pageerror',e=>errors.push(e.message));
  for(const path of ['/youtube-cpm-calculator','/youtube-rpm-calculator', '/guides/how-to-check-youtube-cpm', '/guides/youtube-cpm-vs-rpm', '/legal', '/privacy', '/terms', '/disclaimer', '/cookies']) {
    for(const width of [320,480,768,1024,1920]) {
      await tool.setViewportSize({width,height:900});await tool.goto(base+path);
      assert(await tool.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${path} ${width}`);
    }
  }
  await tool.goto(base+'/youtube-cpm-calculator');
  assert((await tool.getByRole('status').innerText()).includes('$10.00'));
  await tool.getByRole('spinbutton',{name:'Gross ad revenue / advertiser spend (USD)',exact:true}).fill('200');
  assert((await tool.getByRole('status').innerText()).includes('$20.00'));
  await tool.getByRole('spinbutton',{name:'Ad impressions',exact:true}).fill('0');
  assert((await tool.getByRole('status').innerText()).includes('zero count is undefined'));
  await tool.goto(base+'/youtube-rpm-calculator');
  assert((await tool.getByRole('status').innerText()).includes('$2.75'));
  await tool.getByRole('spinbutton',{name:'Creator revenue after revenue sharing (USD)',exact:true}).fill('0');
  assert((await tool.getByRole('status').innerText()).includes('$0.00'));
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS no-JS FAQ, sitemap, image sitemap, 404, responsive tools and CPM/RPM interactions');
} finally { await browser.close(); }
