import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox'],headless:true});
try {
 const page=await browser.newPage();const base=process.env.BASE_URL ?? 'http://localhost:3000';await page.goto(base);
 const ticker=page.getByRole('region',{name:'CPM rate ticker'});
 assert.equal(await ticker.getByRole('link').count(),14);
 assert.equal(await ticker.locator('ul[inert][aria-hidden="true"]').count(),1);
 await ticker.getByRole('button',{name:'Pause ticker',exact:true}).click();
 assert.equal(await ticker.locator('[data-paused]').getAttribute('data-paused'),'true');
 await ticker.getByRole('button',{name:'Resume ticker',exact:true}).click();
 assert.equal(await ticker.locator('[data-paused]').getAttribute('data-paused'),'false');
 for(const width of [320,375,480,768,1024,1440,1920,2560]) {
  await page.setViewportSize({width,height:1000});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`page overflow ${width}`);
  assert(await page.locator('footer').evaluate(e=>e.scrollWidth<=e.clientWidth),`footer overflow ${width}`);
  assert(await page.locator('footer a').evaluateAll(links=>links.every(a=>a.getBoundingClientRect().height>=44)),`footer touch targets ${width}`);
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.locator('footer').screenshot({path:'/tmp/reference-footer-desktop.png'});
 const urls=await page.locator('footer a').evaluateAll(links=>[...new Set(links.map(a=>a.getAttribute('href')))]);
 for(const path of urls) assert.equal((await page.request.get(base+path)).status(),200,`footer destination ${path}`);
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await ticker.locator('[data-paused]').evaluate(e=>getComputedStyle(e).animationName),'none');
 assert(await ticker.locator('ul[aria-hidden="true"]').isHidden());
 assert(await ticker.getByRole('button',{name:'Pause ticker'}).isHidden());
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'reduced motion overflow');
 console.log('PASS footer layout, destinations, touch targets, ticker controls and reduced motion');
} finally {await browser.close();}
