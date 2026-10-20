import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.env.BASE_URL ?? 'http://localhost:3000';
const origin = 'https://ytcpm.online';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const report = { pages: [], resources: 0, fragmentLinks: 0, clientNavigation: false };
try {
  const plain = await browser.newContext({ javaScriptEnabled: false }); const page = await plain.newPage();
  const xml = await (await page.request.get(base + '/sitemap.xml')).text();
  const paths = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => new URL(m[1]).pathname);
  const idsByPath = new Map(); const links = []; const resources = new Set();
  for (const path of paths) {
    const response = await page.goto(base + path); assert.equal(response.status(), 200, path);
    assert(!/noindex/i.test(await page.locator('meta[name="robots"]').getAttribute('content')), `indexable ${path}`);
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(n => n.id));
    assert.equal(new Set(ids).size, ids.length, `unique IDs ${path}`); idsByPath.set(path, new Set(ids));
    for (const h of await page.locator('a[href]').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')))) {
      const target = new URL(h, origin + path);
      if (target.origin === origin) links.push({ from: path, to: target.pathname, fragment: target.hash ? decodeURIComponent(target.hash.slice(1)) : '' });
    }
    assert.equal(await page.locator('img:not([alt])').count(), 0, `image alt attributes ${path}`);
    for (const img of await page.locator('img').evaluateAll(nodes => nodes.map(n => ({ src: n.getAttribute('src'), width: n.getAttribute('width'), height: n.getAttribute('height') })))) {
      assert(img.width && img.height, `image dimensions ${path}`); if (img.src?.startsWith('/')) resources.add(img.src);
    }
    const og = await page.locator('meta[property="og:image"]').first().getAttribute('content'); resources.add(og.replace(origin, ''));
    const title = await page.title(); const description = await page.locator('meta[name="description"]').getAttribute('content');
    report.pages.push({ path, titleLength: title.length, descriptionLength: description.length, words: (await page.locator('main').innerText()).trim().split(/\s+/).length });
  }
  for (const link of links) {
    assert(paths.includes(link.to) || link.to === '/monitor', `internal URL ${link.from} → ${link.to}`);
    if (link.fragment) { assert(idsByPath.get(link.to)?.has(link.fragment), `fragment ${link.from} → ${link.to}#${link.fragment}`); report.fragmentLinks++; }
  }
  for (const src of resources) {
    const response = await page.request.get(base + src); assert.equal(response.status(), 200, `resource ${src}`);
    assert(response.headers()['content-type']?.startsWith('image/'), `image MIME ${src}`);
  }
  report.resources = resources.size;
  for (const path of ['/made-up-tool', '/cpm-by-country/made-up-country', '/cpm-by-niche/made-up-niche', '/guides/made-up-guide']) {
    assert.equal((await page.goto(base + path)).status(), 404, path);
    assert((await page.locator('meta[name="robots"]').evaluateAll(nodes => nodes.map(n => n.content))).some(content => content.includes('noindex')));
  }
  await page.goto(base + '/monitor'); assert((await page.locator('meta[name="robots"]').evaluateAll(nodes => nodes.map(n => n.content))).some(content => content.includes('noindex')));
  await plain.close();
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
  const app = await context.newPage(); const errors = []; app.on('pageerror', e => errors.push(e.message));
  await app.goto(base + '/youtube-shorts-earnings-calculator');
  await app.getByRole('spinbutton', { name: 'Shorts RPM (USD)', exact: true }).fill('1');
  await app.locator('main a[href="/youtube-revenue-goal-calculator"]').first().click();
  await app.waitForURL('**/youtube-revenue-goal-calculator');
  assert.equal(await app.locator('[data-tool-result]').innerText(), '333,334', 'tool state resets on client navigation');
  assert.equal(await app.locator('nav[aria-label="Primary"] a[aria-current="page"]').innerText(), 'Creator Tools');
  await app.goto(base + '/cpm-by-country/india');
  await app.getByRole('textbox', { name: 'Total views', exact: true }).fill('1');
  const marketLink = app.locator('main a[href^="/cpm-by-country/"]').first(); const marketPath = await marketLink.getAttribute('href');
  await marketLink.click(); await app.waitForURL('**' + marketPath);
  assert.equal(await app.getByRole('textbox', { name: 'Total views', exact: true }).inputValue(), '100,000', 'market route resets scenario');
  assert(!(await app.getByRole('button', { name: 'Audience country', exact: true }).innerText()).includes('India'), 'new market preselected');
  await app.goto(base + '/cpm-by-niche/finance-investing');
  await app.getByRole('textbox', { name: 'Total views', exact: true }).fill('1');
  const nicheLink = app.locator('main a[href^="/cpm-by-niche/"]').first(); const nichePath = await nicheLink.getAttribute('href');
  await nicheLink.click(); await app.waitForURL('**' + nichePath);
  assert.equal(await app.getByRole('textbox', { name: 'Total views', exact: true }).inputValue(), '100,000');
  assert.equal(await app.getByRole('combobox', { name: 'Channel niche' }).inputValue(), nichePath.split('/').pop());
  await app.setViewportSize({ width: 375, height: 900 }); await app.goto(base + '/tools');
  await app.getByRole('button', { name: 'Open menu' }).click(); await app.getByRole('navigation', { name: 'Mobile', exact: true }).getByRole('link', { name: 'Guides', exact: true }).focus();
  await app.keyboard.press('Escape'); assert(await app.getByRole('button', { name: 'Open menu' }).evaluate(n => n === document.activeElement));
  // Visual inspection artifacts deliberately stay outside Git.
  for (const [path, name, width] of [['/tools', 'tools-desktop', 1440], ['/cpm-by-country/india', 'country-tablet', 768], ['/', 'home-mobile', 375]]) {
    await app.setViewportSize({ width, height: 1000 }); await app.goto(base + path); await app.screenshot({ path: `/tmp/audit-${name}.png`, fullPage: true });
  }
  assert.deepEqual(errors, []); report.clientNavigation = true;
  await fs.writeFile('/tmp/ytcpm-project-audit.json', JSON.stringify(report, null, 2));
  console.log(`PASS project audit: ${paths.length} pages, ${resources.size} image resources, ${report.fragmentLinks} fragment links, unique IDs, alt/dimensions, robots/404s and client-side navigation`);
  console.log('Long titles (editorial review, not a ranking rule):', report.pages.filter(p => p.titleLength > 75).map(p => `${p.path} (${p.titleLength})`).join(', ') || 'none');
} finally { await browser.close(); }
