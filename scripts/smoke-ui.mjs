import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const screenshotDir = process.env.SCREENSHOT_DIR;
if (screenshotDir) await mkdir(screenshotDir, { recursive: true });
(async () => {
 const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ["--no-sandbox", "--disable-dev-shm-usage"], headless: true });
 const page=await browser.newPage();
 const chooseCountry = async name => {
  await page.getByRole('button',{name:'Audience country',exact:true}).click();
  await page.getByRole('combobox',{name:'Search countries',exact:true}).fill(name);
  await page.getByRole('listbox',{name:'Countries',exact:true}).getByRole('option').first().click();
 };
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,375,420,480,600,768,820,970,1024,1440,1920,2560]) {
  await page.setViewportSize({width,height:1000});await page.goto(baseUrl);await page.waitForTimeout(600);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
  const box=await page.locator('.shell').first().boundingBox();assert(box.width<=1600);
  assert(await page.getByRole('textbox',{name:'Total views',exact:true}).isVisible());
  if(width>=1024) { const card=page.locator('[data-home-calculator]'); const grid=card.locator(':scope > div').first(); assert.equal(await grid.evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),2); }
  await page.locator('img').evaluateAll(imgs => Promise.all(imgs.map(async i => { i.loading = 'eager'; try { await i.decode(); } catch { /* reported by the asset assertion below */ } })));
  assert.equal(await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete || i.naturalWidth===0).length),0,`broken images ${width}: ${JSON.stringify(await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.naturalWidth).map(i=>i.src)))}`);
  if(screenshotDir && width===375) await page.screenshot({path:join(screenshotDir,'mobile.png'),fullPage:true});
  if(screenshotDir && width===1920) await page.screenshot({path:join(screenshotDir,'desktop.png'),fullPage:true});
  const controls = page.locator('header .shell');
  assert(await controls.evaluate(e=>e.scrollWidth<=e.clientWidth),`header controls overflow ${width}`);
  const presets=page.getByRole('group',{name:'Quick view presets',exact:true});
  assert(await presets.getByRole('button').evaluateAll(buttons=>buttons.every(b=>b.getBoundingClientRect().height>=44)),`preset touch targets ${width}`);
  const rows=await presets.getByRole('button').evaluateAll(buttons=>Object.values(buttons.reduce((rows,b)=>{const y=Math.round(b.getBoundingClientRect().top);rows[y]=(rows[y]||0)+1;return rows},{})));
  assert.deepEqual(rows,width<640?[3,3]:[6],`uneven presets at ${width}`);
  if(width>=768 && width<1024) assert((await page.locator('.hero-shell').boundingBox()).height<520,`oversized tablet hero ${width}`);
  if(width<640) assert(await page.locator('[data-benefit-card]').evaluateAll(cards=>cards.every(c=>c.getBoundingClientRect().height<160)),`oversized benefits ${width}`);
  if(screenshotDir && width===820) await page.screenshot({path:join(screenshotDir,'tablet.png'),fullPage:true});
  console.log('PASS layout',width);
 }
 // Enlarged text must preserve the country selection control.
 await page.setViewportSize({width:480,height:900});
 await page.addStyleTag({content:'html { font-size: 20px; }'});
 assert(await page.getByRole('button',{name:'Audience country',exact:true}).evaluate(e=>e.scrollWidth<=e.clientWidth+1));
 await page.goto(baseUrl);
 assert((await page.locator('#results').innerText()).includes('$825'));
 await page.getByRole('button',{name:'Edit assumptions',exact:true}).click();
 const cpm=page.getByRole('textbox',{name:/^CPM in /});await cpm.fill('3.');assert.equal(await cpm.inputValue(),'3.');await cpm.fill('3.50');
 await page.getByRole('textbox',{name:'Total views',exact:true}).fill('1,000,000');assert((await page.locator('#results').innerText()).includes('$1,925'));
 await page.getByRole('slider',{name:'Views serving ads'}).fill('0');assert((await page.locator('#results').innerText()).includes('$0.00'));
 await page.getByRole('slider',{name:'Views serving ads'}).fill('70');assert((await page.locator('#results').innerText()).includes('$1,348'));
 await cpm.fill('');await cpm.blur();assert.equal(await cpm.inputValue(),'15');
 await chooseCountry('India');assert.notEqual(await cpm.inputValue(),'15');
 assert((await page.locator('[data-assumptions-summary]').innerText()).includes('70% ad fill'));
 await page.getByRole('slider',{name:'Views serving ads'}).fill('100');
 await chooseCountry('United States');
 assert(await page.getByRole('link',{name:'View Results',exact:true}).isVisible());
 assert.equal(await page.getByRole('group',{name:'Calculator mode'}).count(),0);
 assert.equal(await page.getByRole('complementary',{name:'Estimate limitations'}).count(),0);
 assert.equal(await page.getByText('Compare views & channel projections',{exact:true}).count(),0);
 // Format switching must use the separate Shorts model and preserve long-form assumptions.
 await page.getByRole('button',{name:'Shorts',exact:false}).click();
 assert((await page.locator('#results').innerText()).includes('Not applicable'));
 assert.equal(await page.getByRole('textbox',{name:/^CPM in /}).count(),0);
 assert((await page.locator('#results').innerText()).includes('Shorts engaged-view scenario'));
 await page.getByRole('textbox',{name:'Total views',exact:true}).fill('0');
 assert((await page.locator('#results').innerText()).includes('$0.00'));
 await chooseCountry('United States');
 await page.getByRole('textbox',{name:'Total views',exact:true}).fill('100,000');
 assert((await page.locator('#results').innerText()).includes('$5.75'));
 await page.getByRole('button',{name:'Long-form',exact:false}).click();
 assert((await page.locator('#results').innerText()).includes('$825'));
 await chooseCountry('India');
 assert((await page.locator('#results').innerText()).includes('INR'));
 await page.getByRole('textbox',{name:/^CPM in /}).fill('10000');
 await page.getByRole('textbox',{name:'Total views',exact:true}).fill('999999999999999');
 assert.equal(await page.getByRole('textbox',{name:'Total views',exact:true}).inputValue(),'1,000,000,000');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'max-value result overflow');
 await page.getByRole('slider',{name:'Monthly views slider',exact:true}).fill('0');
 assert.equal(await page.getByRole('textbox',{name:'Total views',exact:true}).inputValue(),'0');
 await page.getByRole('slider',{name:'Monthly views slider',exact:true}).fill('100');
 assert.equal(await page.getByRole('textbox',{name:'Total views',exact:true}).inputValue(),'1,000,000,000');
 await page.setViewportSize({width:375,height:900});await page.getByRole('button',{name:'Open menu',exact:true}).click();assert(await page.getByRole('navigation',{name:'Mobile',exact:true}).isVisible());await page.keyboard.press('Escape');assert.equal(await page.getByRole('navigation',{name:'Mobile',exact:true}).count(),0);
 await page.setViewportSize({width:740,height:320});
 await page.getByRole('button',{name:'Open menu',exact:true}).click();
 const landscapeMenu=page.getByRole('navigation',{name:'Mobile',exact:true});
 await landscapeMenu.getByRole('link').last().scrollIntoViewIfNeeded();
 assert(await landscapeMenu.evaluate(e=>{const r=e.getBoundingClientRect();return r.bottom<=innerHeight+1 && getComputedStyle(e).overflowY==='auto'}),'landscape menu extends beyond viewport');
 await page.keyboard.press('Escape');
 await page.setViewportSize({width:375,height:900});
 for(const path of ['/cpm-by-country','/cpm-by-country/india','/cpm-by-niche','/cpm-by-niche/finance-investing','/about','/contact','/methodology','/privacy','/terms','/monitor']) {
  const response=await page.goto(baseUrl+path);assert.equal(response.status(),200);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${path}`);console.log('PASS page',path);
 }
 const req=page.request;
 for(const [body,status] of [['null',422],['[1]',422],['{',400],['x'.repeat(4097),413]]) {assert.equal((await req.post(baseUrl+'/api/calculate',{data:body})).status(),status);}
 const response=await req.post(baseUrl+'/api/calculate',{data:{views:1000,niche:'technology-software',country:'india',type:'long'}});assert.equal(response.status(),200);assert.equal(typeof (await response.json()).logged,"boolean");
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS interactions, API and zero browser errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
