import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.BASE_URL ?? 'http://localhost:3000';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox'],headless:true});
try {
 const page=await browser.newPage();await page.goto(base);
 const trigger=page.getByRole('button',{name:'Audience country',exact:true});
 const search=page.getByRole('combobox',{name:'Search countries',exact:true});
 const result=page.locator('#results');
 for(const width of [320,375,768,1024,1920]) {
  await page.setViewportSize({width,height:900});await trigger.click();
  assert.equal(await page.getByRole('listbox',{name:'Countries',exact:true}).getByRole('option').count(),24);
  await search.fill('no-such-country');assert.equal(await page.getByRole('listbox',{name:'Countries',exact:true}).getByRole('option').count(),0);
  assert(await page.getByRole('status').filter({hasText:'No countries found'}).isVisible());
  await search.fill('INR');assert.equal(await page.getByRole('listbox',{name:'Countries',exact:true}).getByRole('option').count(),1);
  assert.equal(await page.getByRole('listbox',{name:'Countries',exact:true}).getByRole('option').locator('img').count(),1);
  await search.press('Enter');assert(await trigger.evaluate(e=>e===document.activeElement));
  assert.equal(await result.locator('[aria-label="Result currency"]').textContent(),'INR');
  assert((await result.locator('[aria-live]').textContent()).includes('₹'));
  assert(!(await result.locator('dl').textContent()).includes('$'));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert((await trigger.boundingBox()).y < (await page.getByRole('button',{name:'Channel niche',exact:true}).boundingBox()).y);
  await trigger.click();await search.fill('United');assert.equal(await page.getByRole('listbox',{name:'Countries',exact:true}).getByRole('option').count(),2);
  await search.press('ArrowDown');await search.press('Enter');
  assert((await trigger.textContent()).includes('United Kingdom'));
  assert((await result.locator('[aria-live]').textContent()).includes('£'));
  await trigger.click();await search.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
  await trigger.click();await page.mouse.click(2,200);assert.equal(await page.getByRole('dialog').count(),0);
 }
 // Each supported local currency updates automatically; no USD toggle exists.
 for(const [name,code,symbol] of [['Japan','JPY','￥'],['Germany','EUR','€'],['Australia','AUD','$'],['South Korea','KRW','₩'],['Indonesia','IDR','Rp'],['United States','USD','$'],['Worldwide','USD','$']]) {
  await trigger.click();await search.fill(name);await search.press('Enter');
  assert.equal(await result.locator('[aria-label="Result currency"]').textContent(),code);
  assert((await result.locator('[aria-live]').textContent()).includes(symbol));
 }
 await page.getByRole('button',{name:'Edit assumptions',exact:true}).click();
 await trigger.click();await search.fill('INR');await search.press('Enter');
 const cpm=page.getByRole('textbox',{name:'CPM in INR',exact:true});
 await cpm.fill('860');await page.getByRole('textbox',{name:'Total views',exact:true}).fill('1000');
 assert((await result.locator('[aria-live]').textContent()).includes('473')); // INR 860 × 55%, no second FX multiplication
 await page.getByRole('button',{name:'Shorts',exact:false}).click();
 assert.equal(await result.locator('[aria-label="Result currency"]').textContent(),'INR');
 assert((await result.locator('dl').textContent()).includes('Not applicable'));
 await page.setViewportSize({width:1440,height:1000});await page.goto(base);await trigger.click();await search.fill('INR');await search.press('Enter');
 await page.locator('[data-home-calculator]').screenshot({path:'/tmp/local-currency-calculator.png'});
 console.log('PASS searchable flags/currencies, ordering, keyboard/escape/outside dismissal, automatic FX and custom local CPM');
} finally {await browser.close();}
