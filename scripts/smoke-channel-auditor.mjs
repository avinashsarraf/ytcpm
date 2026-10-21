import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const base = process.env.BASE_URL ?? 'http://localhost:3000';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'], headless: true });
try {
  const context = await browser.newContext({ reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`${base}/channel-auditor`);
  const h1 = (await page.getByRole('heading', { level: 1 }).textContent()).replace(/\s+/g, '').trim();
  assert.equal(h1, 'YouTubeChannelAuditor');
  assert(await page.getByRole('link', { name: 'Channel Auditor', exact: true }).first().isVisible(), 'header link missing');

  // SEO surface: focus keyword, route-specific social image, canonical, JSON-LD graph.
  const title = await page.title();
  assert(title.includes('YouTube Channel Auditor'), `focus keyword in title: ${title}`);
  assert(title.includes('Free Channel Audit'), `intent in title: ${title}`);
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  for (const phrase of ['public YouTube channel', 'playlists', 'tags', 'keywords', 'CPM', 'RPM']) assert(description.toLowerCase().includes(phrase.toLowerCase()), `description missing ${phrase}`);
  assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href')).href, 'https://ytcpm.online/channel-auditor');
  assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), 'https://ytcpm.online/channel-auditor');
  const ogImage = await page.locator('meta[property="og:image"]').first().getAttribute('content');
  assert(ogImage.includes('/channel-auditor/'), `route-specific social image: ${ogImage}`);
  const imageResponse = await page.request.get(ogImage.replace('https://ytcpm.online', base));
  assert.equal(imageResponse.status(), 200, 'social image reachable');
  assert(imageResponse.headers()['content-type'].includes('image/png'), 'social image is a png');
  const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content');
  assert(twitterImage.includes('/channel-auditor/'), `route-specific twitter image: ${twitterImage}`);
  const keywords = await page.locator('meta[name="keywords"]').getAttribute('content');
  assert(keywords.includes('youtube channel auditor') && keywords.includes('youtube channel audit tool'), `keywords missing: ${keywords}`);
  const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse).flat();
  const types = schemas.flatMap(s => (s['@type'] ? [s['@type']] : (s['@graph'] ?? []).map(n => n['@type'])));
  for (const type of ['BreadcrumbList', 'WebPage', 'WebApplication', 'HowTo', 'FAQPage']) assert(types.includes(type), `missing ${type} schema`);
  const faq = schemas.find(s => s['@type'] === 'FAQPage');
  assert.equal(faq.mainEntity.length, 10, 'FAQ schema covers every visible question');
  const howTo = schemas.find(s => s['@type'] === 'HowTo');
  assert.equal(howTo.step.length, 3, 'HowTo schema has three steps');
  const app = schemas.find(s => s['@type'] === 'WebApplication');
  assert.equal(app.isAccessibleForFree, true, 'app is marked free');
  assert(app.featureList.length >= 6, 'app feature list missing');

  // Editorial depth that a keyword-thin page would not have.
  const mainText = (await page.locator('main').innerText());
  assert(mainText.length > 6000, `substantial SSR content: ${mainText.length}`);
  for (const heading of ['How to audit a YouTube channel in three steps', 'What the Channel Auditor checks', 'Public audit vs. YouTube Studio analytics', 'How to read the three data labels', 'What creators use a channel audit for', 'Limitations we will not hide', 'Channel Auditor questions']) {
    assert(await page.getByRole('heading', { name: heading, exact: true }).count() > 0, `missing section ${heading}`);
  }
  assert.equal(await page.locator('main table').count(), 2, 'coverage and comparison tables');
  assert(await page.locator('main details').count() >= 10, 'every FAQ answer is in the initial HTML');
  assert(await page.locator('main a[href^="https://developers.google.com/youtube/v3/docs"]').count() > 0, 'Data API source cited');
  assert(await page.locator('main a[href^="https://support.google.com/youtube/"]').count() > 0, 'YouTube Help source cited');
  assert(await page.locator('main a[href="/cpm-by-niche"]').count() > 0 && await page.locator('main a[href="/methodology"]').count() > 0, 'internal links to benchmarks and methodology');

  // Live audits are unconfigured in CI: the API must explain that instead of failing silently.
  const api = await page.request.post(`${base}/api/channel-audit`, { data: { channel: '@mkbhd' } });
  assert.equal(api.status(), 503);
  assert.equal((await api.json()).code, 'not_configured');
  const invalid = await page.request.post(`${base}/api/channel-audit`, { data: { channel: 'https://evil.example.com/@x' } });
  assert.equal(invalid.status(), 422);

  // Sample report renders the full dashboard.
  await page.getByRole('button', { name: 'View sample report' }).click();
  const shell = page.locator('.auditor-shell');
  await shell.waitFor();
  const shellText = (await shell.innerText()).toLowerCase();
  assert(shellText.includes('sample tech channel'), 'sample channel not rendered');
  assert(shellText.includes('sample data'), 'sample label missing');
  for (const label of ['subscribers', 'lifetime views', 'published videos', 'uploads / month', 'engagement rate', 'tag coverage']) {
    assert(shellText.includes(label), `missing stat ${label}`);
  }
  for (const tag of ['public', 'inferred']) assert(shellText.includes(tag), `missing provenance tag ${tag}`);

  // Tabs switch panels and keep the document free of horizontal overflow.
  await page.getByRole('tab', { name: 'Videos' }).click();
  assert((await page.locator('#auditor-panel-videos').innerText()).toLowerCase().includes('most viewed'));
  assert(await page.locator('#auditor-panel-videos table tbody tr').count() > 0, 'video table empty');
  await page.getByRole('tab', { name: 'Keywords' }).click();
  const keywordText = await page.locator('#auditor-panel-keywords').innerText();
  assert(keywordText.includes('Strongest repeated phrases') && keywordText.includes('Weakest repeated phrases'), 'keyword tables missing');
  await page.getByRole('tab', { name: 'Revenue scenarios' }).click();
  const revenueText = (await page.locator('#auditor-panel-revenue').innerText()).toLowerCase();
  assert(revenueText.includes('estimated') && revenueText.includes('not the channel'), 'estimate label missing');
  assert(revenueText.includes('advertiser cpm') && revenueText.includes('creator rpm'));
  await page.getByRole('tab', { name: 'Overview' }).click();
  assert((await page.locator('#auditor-panel-overview').innerText()).includes('Best and worst performers'));

  // Copy is a real clipboard action during the free launch period.
  await page.getByRole('button', { name: 'Copy summary' }).click();
  await page.waitForTimeout(250);
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  assert(clipboard.includes('Channel Auditor report'), 'summary not copied');
  assert(clipboard.includes('public YouTube data'), 'summary provenance missing');

  // No pricing, plan names or paid-depth wording anywhere on the page.
  const pageText = (await page.locator('body').innerText()).toLowerCase();
  for (const banned of ['₹', 'half audit', 'full audit', 'free overview', 'upgrade', 'subscribe now', 'per month', 'pricing', 'plan name']) {
    assert(!pageText.includes(banned), `pricing or plan wording still visible: ${banned}`);
  }
  // A price needs an amount: "videos published per month" is cadence, not billing.
  assert(!/[$€£]\s?\d[\d.,]*\s*(?:per|\/)\s*(?:month|year)/i.test(pageText), 'a priced period is still visible');
  assert(!/\b(?:rs\.?|inr|usd)\s?\d[\d.,]*/i.test(pageText), 'a currency amount is still visible');
  assert.equal(await page.getByRole('button', { name: /Half Audit|Full Audit|Free Overview/ }).count(), 0, 'plan buttons still visible');
  assert.equal(await page.getByRole('dialog').count(), 0, 'plan dialog should not exist');

  // CSV download on a sample report explains that a live audit is needed instead of opening a paywall.
  await page.getByRole('button', { name: 'Download CSV' }).click();
  await page.waitForTimeout(200);
  assert((await page.locator('.auditor-shell').innerText()).toLowerCase().includes('live audit'), 'CSV fallback message missing');

  // Without JavaScript the FAQ answers still exist in the HTML.
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 900 } });
  const plain = await noJs.newPage();
  await plain.goto(`${base}/channel-auditor`);
  assert.equal(await plain.locator('main details').count(), 10, 'FAQ items in the no-JS HTML');
  await plain.locator('main details summary').nth(3).click();
  assert(await plain.locator('main details').nth(3).locator('p').isVisible(), 'FAQ works without JS');
  await noJs.close();

  // Responsive: no horizontal overflow and the toolbar stays usable.
  for (const width of [320, 375, 768, 1024, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${base}/channel-auditor`);
    await page.getByRole('button', { name: 'View sample report' }).click();
    await page.locator('.auditor-shell').waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow at ${width}`);
  }

  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto(`${base}/channel-auditor`);
  await page.getByRole('button', { name: 'View sample report' }).click();
  await page.locator('.auditor-shell').waitFor();
  await page.locator('.auditor-shell').screenshot({ path: '/tmp/channel-auditor-premium.png' });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(`${base}/channel-auditor`);
  await page.getByRole('button', { name: 'View sample report' }).click();
  await page.locator('.auditor-shell').waitFor();
  await page.locator('.auditor-shell').screenshot({ path: '/tmp/channel-auditor-mobile.png' });

  const audit = await new AxeBuilder({ page }).include('.auditor-shell').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  assert.deepEqual(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.html) })), []);
  assert.deepEqual(errors, []);
  console.log('PASS channel auditor: SEO metadata and schema graph, editorial depth, API guards, sample dashboard, tabs, copy, no-pricing check, CSV fallback, no-JS FAQ, 5 widths and axe checks');
} finally { await browser.close(); }
