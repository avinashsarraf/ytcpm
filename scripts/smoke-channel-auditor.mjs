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
  assert.equal(h1, 'AuditanypublicYouTubechannel.');
  assert(await page.getByRole('link', { name: 'Channel Auditor', exact: true }).first().isVisible(), 'header link missing');

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

  // Premium plan dialog explains what paid depth adds and stays honest about checkout.
  await page.getByRole('button', { name: 'Half Audit' }).click();
  await page.getByRole('button', { name: 'Download CSV' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  assert((await dialog.innerText()).includes('Half Audit') && (await dialog.innerText()).includes('Full Audit'));
  assert((await dialog.innerText()).includes('Checkout is not switched on yet'), 'checkout honesty text missing');
  await page.getByRole('button', { name: 'Close plans' }).click();
  assert.equal(await page.getByRole('dialog').count(), 0);

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
  console.log('PASS channel auditor: API guards, sample dashboard, tabs, copy, plan dialog, 5 widths and axe checks');
} finally { await browser.close(); }
