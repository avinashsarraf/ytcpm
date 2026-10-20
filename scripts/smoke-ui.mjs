import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const screenshotDir = process.env.SCREENSHOT_DIR;
if (screenshotDir) await mkdir(screenshotDir, { recursive: true });
(async () => {
 const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ["--no-sandbox", "--disable-dev-shm-usage"], headless: true });
 const page=await browser.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,375,768,1024,1440,1920,2560]) {
  await page.setViewportSize({width,height:1000});await page.goto(baseUrl);await page.waitForTimeout(600);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
  const box=await page.locator('.shell').first().boundingBox();assert(box.width<=1600);
  const pad=await page.getByRole('textbox',{name:'Total views',exact:true}).evaluate(e=>getComputedStyle(e).paddingLeft); assert.equal(pad,'40px');
  assert.equal(await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete || i.naturalWidth===0).length),0,`broken images ${width}`);
  if(screenshotDir && width===375) await page.screenshot({path:join(screenshotDir,'mobile.png'),fullPage:true});
  if(screenshotDir && width===1920) await page.screenshot({path:join(screenshotDir,'desktop.png'),fullPage:true});
  const controls = page.locator('header .shell');
  assert(await controls.evaluate(e=>e.scrollWidth<=e.clientWidth),`header controls overflow ${width}`);
  console.log('PASS layout',width);
 }
 const cpm=page.getByRole('textbox',{name:'CPM in US dollars'});await cpm.fill('3.');assert.equal(await cpm.inputValue(),'3.');await cpm.fill('3.50');
 await page.getByRole('textbox',{name:'Total views',exact:true}).fill('1,000,000');assert((await page.locator('#results').innerText()).includes('$1,925'));
 await page.getByRole('button',{name:'Edit assumptions',exact:true}).click();await page.getByRole('slider',{name:'Views serving ads'}).fill('0');assert((await page.locator('#results').innerText()).includes('$0.00'));
 await page.getByRole('slider',{name:'Views serving ads'}).fill('70');assert((await page.locator('#results').innerText()).includes('$1,348'));
 await cpm.fill('');await cpm.blur();assert.equal(await cpm.inputValue(),'7.01');
 await page.getByRole('combobox',{name:'Audience country',exact:true}).selectOption('india');assert.notEqual(await cpm.inputValue(),'7.01');
 await page.getByRole('button',{name:'Earnings by Views',exact:true}).click();await page.getByRole('button',{name:/10K/}).click();assert.equal(await page.getByRole('textbox',{name:'Total views',exact:true}).inputValue(),'10,000');
 await page.getByRole('button',{name:'Channel Estimator',exact:true}).click();assert(await page.locator('#calculator').getByRole('textbox',{name:'Channel monthly views',exact:true}).isVisible());
 assert.equal(await page.getByRole('region',{name:'Channel projection',exact:true}).count(),1);
 assert((await page.locator('[data-assumptions-summary]').innerText()).includes('70% ad fill'));
 const projection=page.getByRole('region',{name:'Channel projection',exact:true});
 await page.getByRole('slider',{name:'Views serving ads'}).fill('0');
 assert((await projection.innerText()).includes('$0.00'));
 assert((await projection.innerText()).includes('Per 1,000 views\n$0.00'));
 await page.getByRole('slider',{name:'Views serving ads'}).fill('100');
 assert(await page.getByText('100% ad fill — optimistic scenario, not a guaranteed payout',{exact:true}).isVisible());
 await page.getByRole('button',{name:'CPM Calculator',exact:true}).click();
 assert(await page.getByRole('link',{name:'View Results',exact:true}).isVisible());
 assert(await page.getByRole('complementary',{name:'Estimate limitations'}).isVisible());
 await page.setViewportSize({width:375,height:900});await page.getByRole('button',{name:'Open menu',exact:true}).click();assert(await page.getByRole('navigation',{name:'Mobile',exact:true}).isVisible());await page.keyboard.press('Escape');assert.equal(await page.getByRole('navigation',{name:'Mobile',exact:true}).count(),0);
 for(const path of ['/cpm-by-country','/cpm-by-country/india','/cpm-by-niche','/cpm-by-niche/finance-investing','/about','/contact','/methodology','/privacy','/terms','/monitor']) {
  const response=await page.goto(baseUrl+path);assert.equal(response.status(),200);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${path}`);console.log('PASS page',path);
 }
 const req=page.request;
 for(const [body,status] of [['null',422],['[1]',422],['{',400],['x'.repeat(4097),413]]) {assert.equal((await req.post(baseUrl+'/api/calculate',{data:body})).status(),status);}
 const response=await req.post(baseUrl+'/api/calculate',{data:{views:1000,niche:'technology-software',country:'india',type:'long'}});assert.equal(response.status(),200);assert.equal(typeof (await response.json()).logged,"boolean");
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS interactions, API and zero browser errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
