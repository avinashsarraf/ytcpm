import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = process.env.BASE_URL ?? "http://localhost:3000";
const origin = "https://ytcpm.online";
const paths = ["/legal", "/privacy", "/terms", "/disclaimer", "/cookies", "/", "/youtube-cpm-calculator", "/youtube-rpm-calculator", "/guides", "/sources", "/guides/how-to-check-youtube-cpm", "/guides/youtube-cpm-vs-rpm", "/guides/youtube-earnings-per-1000-views", "/cpm-by-country/india", "/cpm-by-niche/finance-investing", "/methodology"];
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
    const title = await page.title(); assert(!titles.has(title), `unique title ${path}`); titles.add(title);
    assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href')).href, new URL(origin + path).href);
    assert((await page.locator('meta[name="description"]').getAttribute('content')).length > 50);
    for (const script of await page.locator('script[type="application/ld+json"]').allTextContents()) JSON.parse(script);
    if (path.includes('/guides/') || path.includes('-calculator')) {
      assert((await page.locator('main').textContent()).length > 1000, `substantial SSR content ${path}`);
      assert(await page.locator('main a[href^="https://support.google.com/"]').count() > 0, `primary source ${path}`);
      assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), origin + path);
    }
    if (['/privacy', '/terms', '/disclaimer', '/cookies'].includes(path)) {
      assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), origin + path);
      assert.equal(await page.locator('main details.group').count(), 3, 'policy FAQs in initial HTML');
      assert.equal(await page.locator('main nav[aria-label="Legal policies"] a[aria-current="page"]').count(), 1);
      const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse);
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
  console.log('PASS no-JS FAQ, sitemap, 404, responsive tools and CPM/RPM interactions');
} finally { await browser.close(); }
