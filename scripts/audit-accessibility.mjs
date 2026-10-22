import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
const base = process.env.BASE_URL ?? 'http://localhost:3000';

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const findings = [];
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const xml = await (await page.request.get(base + '/sitemap.xml')).text();
  // The CMS sign-in screen is not in the sitemap (it is noindex), so it is
  // added here to keep it covered by the accessibility sweep.
  const paths = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => new URL(m[1]).pathname).concat(['/monitor', '/not-a-real-page', '/cms/login']);
  const scan = async (label) => {
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    for (const v of result.violations) findings.push({ page: label, id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => ({ target: n.target, html: n.html, summary: n.failureSummary })) });
    console.log(`${result.violations.length ? 'FAIL' : 'PASS'} accessibility ${label}: ${result.violations.map(v => `${v.id}(${v.nodes.length})`).join(', ')}`);
  };
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of paths) {
      // The CMS screens have no public footer, so the wait is best-effort.
      await page.goto(base + path); await page.locator('footer').scrollIntoViewIfNeeded().catch(() => {}); await page.evaluate(() => window.scrollTo(0, 0));
      await scan(`${path} @${width}`);
    }
  }
  await page.goto(base); await page.getByRole('button', { name: 'Audience country', exact: true }).click(); await scan('country search open');
  await page.goto(base); await page.getByRole('button', { name: 'Audience country', exact: true }).click();
  await page.getByRole('combobox', { name: 'Search countries' }).fill('not-a-country'); await scan('country search no results');
  await page.goto(base + '/youtube-revenue-goal-calculator'); await page.getByRole('spinbutton', { name: 'Expected creator RPM (USD)' }).fill('0'); await scan('invalid revenue goal');
  await page.setViewportSize({ width: 375, height: 900 }); await page.goto(base + '/tools'); await page.getByRole('button', { name: 'Open menu' }).click(); await scan('mobile menu open');
} finally { await browser.close(); await fs.writeFile(process.env.AUDIT_REPORT ?? '/tmp/ytcpm-accessibility.json', JSON.stringify(findings, null, 2)); }
console.log(`${findings.length} rule/page violations. Report: ${process.env.AUDIT_REPORT ?? '/tmp/ytcpm-accessibility.json'}`);
if (findings.length) process.exitCode = 1;
