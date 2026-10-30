import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.BASE_URL ?? 'http://localhost:3000';
const origin = 'https://ytcpm.online';
const cases = [
  ['youtube-shorts-earnings-calculator', '$60.00', 'Shorts engaged views', '2000000', '$120.00'],
  ['youtube-views-to-money-calculator', '$300.00', 'Video views', '200000', '$600.00'],
  ['youtube-revenue-goal-calculator', '333,334', 'Revenue target (USD)', '3000', '1,000,000'],
  ['youtube-cpm-to-rpm-calculator', '$4.40', 'Ad impressions per 100 video views', '150', '$8.25'],
  ['youtube-sponsorship-calculator', '$1,200.00', 'Usage rights / exclusivity fee (USD)', '300', '$1,500.00'],
  ['youtube-engagement-rate-calculator', '4.5%', 'Comments', '100', '5%'],
  ['youtube-watch-time-calculator', '666.67', 'Average view duration (minutes)', '4.5', '750'],
];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
try {
  const plain = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 900 } });
  const page = await plain.newPage();
  const xml = await (await page.request.get(base + '/sitemap.xml')).text();
  const paths = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => new URL(m[1]).pathname);
  const titles = new Set(); const descriptions = new Set(); const hrefs = new Set();
  for (const path of paths) {
    assert.equal((await page.goto(base + path)).status(), 200, path);
    const title = await page.title(); const description = await page.locator('meta[name="description"]').getAttribute('content');
    assert(title && !titles.has(title), `unique title ${path}`); titles.add(title);
    assert(description?.length > 50 && !descriptions.has(description), `unique description ${path}`); descriptions.add(description);
    assert.equal(await page.locator('h1').count(), 1, `one H1 ${path}`);
    assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href')).href, new URL(origin + path).href, `canonical ${path}`);
    assert.equal(new URL(await page.locator('meta[property="og:url"]').getAttribute('content')).href, new URL(origin + path).href, `OG URL ${path}`);
    assert(await page.locator('meta[property="og:image"]').count() > 0, `social image ${path}`);
    for (const text of await page.locator('script[type="application/ld+json"]').allTextContents()) JSON.parse(text);
    for (const href of await page.locator('main a[href^="/"]').evaluateAll(links => links.map(l => l.getAttribute('href')))) hrefs.add(href.split('#')[0]);
    if (cases.some(c => path === '/' + c[0])) {
      assert((await page.locator('main').textContent()).length > 3000, 'substantial server-rendered editorial content');
      assert.equal(await page.locator('main details').count(), 3);
      assert(await page.locator('main img[alt]').count() > 0);
      const image = await page.locator('meta[property="og:image"]').first().getAttribute('content');
      const response = await page.request.get(image.replace(origin, base)); assert.equal(response.status(), 200);
      assert(response.headers()['content-type'].includes('image/png'));
      assert(image.includes(path.slice(1)), 'route-specific social image');
      await page.locator('details').last().locator('summary').click();
      assert(await page.locator('details').last().locator('p').isVisible(), 'no-JS FAQ');
    }
  }
  for (const [slug] of cases) assert(paths.includes('/' + slug), `sitemap ${slug}`);
  // `/blog/rss.xml` is a real feed, not a page, so it is allowed next to the
  // sitemap routes and the noindex monitor page.
  for (const href of hrefs) assert(href === '' || paths.includes(href) || href === '/monitor' || href === '/blog/rss.xml', `internal target ${href}`);
  assert.equal((await page.goto(base + '/not-a-real-tool')).status(), 404);
  assert.equal((await page.goto(base + '/youtube-made-up-calculator')).status(), 404);
  console.log(`PASS site-wide SEO: ${paths.length} indexable routes, unique metadata, H1s, canonicals, OG images, JSON-LD and internal targets`);
  await plain.close();
  const context = await browser.newContext(); const tool = await context.newPage(); const errors = []; tool.on('pageerror', e => errors.push(e.message));
  for (const [slug, initial, field, input, expected] of cases) {
    await tool.goto(base + '/' + slug);
    assert.equal(await tool.locator('[data-tool-result]').innerText(), initial);
    await tool.getByRole('spinbutton', { name: field, exact: true }).fill(input);
    assert.equal(await tool.locator('[data-tool-result]').innerText(), expected);
    await tool.getByRole('spinbutton', { name: field, exact: true }).fill('');
    assert.equal(await tool.locator('[data-tool-result]').innerText(), '—');
    assert.equal(await tool.getByRole('spinbutton', { name: field, exact: true }).getAttribute('aria-invalid'), 'true');
    await tool.getByRole('button', { name: 'Reset example' }).click();
    assert.equal(await tool.locator('[data-tool-result]').innerText(), initial);
    for (const width of [320, 375, 768, 1024, 1440, 1920]) {
      await tool.setViewportSize({ width, height: 1000 });
      assert(await tool.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow ${slug} ${width}`);
    }
  }
  for (const path of ['/tools', '/cpm-by-country/india', '/cpm-by-niche/finance-investing']) {
    await tool.goto(base + path);
    for (const width of [320, 768, 1920]) {
      await tool.setViewportSize({ width, height: 1000 });
      assert(await tool.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow ${path} ${width}`);
    }
  }
  await tool.goto(base + '/cpm-by-country/india');
  assert((await tool.getByRole('button', { name: 'Audience country', exact: true }).innerText()).includes('India'));
  await tool.goto(base + '/cpm-by-niche/finance-investing');
  assert.equal(await tool.getByRole('button', { name: 'Channel niche', exact: true }).getAttribute('data-picker-value'), 'finance-investing');
  await tool.setViewportSize({ width: 1440, height: 1000 }); await tool.goto(base + '/youtube-shorts-earnings-calculator');
  await tool.screenshot({ path: '/tmp/creator-tool-desktop.png', fullPage: true });
  await tool.setViewportSize({ width: 375, height: 900 }); await tool.screenshot({ path: '/tmp/creator-tool-mobile.png', fullPage: true });
  await tool.setViewportSize({ width: 768, height: 1000 }); await tool.goto(base + '/tools');
  await tool.screenshot({ path: '/tmp/creator-tools-tablet.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS 7 interactive tools, invalid/reset handling, 6 widths, country/niche initialization and no runtime errors');
} finally { await browser.close(); }
