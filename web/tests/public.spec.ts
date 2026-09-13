import {test,expect} from '@playwright/test';

test('genuine replay is interactive with API access blocked',async({page})=>{
  const calls:string[]=[];const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',route=>{calls.push(route.request().url());return route.abort();});
  await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toContainText('A thoughtful answer.');
  await expect(page.getByRole('button',{name:/CASE 01/})).toBeVisible();
  await expect(page.getByText('Real provider execution',{exact:false})).toBeVisible();
  const slider=page.getByRole('slider',{name:'Recorded timeline position'});
  await slider.fill('0');await expect(page.locator('.timeline li')).toHaveCount(0);
  await slider.press('End');await expect(page.locator('.timeline li').first()).toBeVisible();
  await page.getByRole('button',{name:/A damaged delivery/}).click();
  await expect(page.getByRole('heading',{name:'Action receipt',exact:false})).toBeVisible();
  await expect(page.getByRole('button',{name:'Approve simulated action'})).toHaveCount(0);
  expect(calls).toEqual([]);expect(errors).toEqual([]);
});

test('mobile replay fits and invite entry is keyboard accessible',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');
  await expect(page.getByRole('button',{name:/CASE 01/})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const live=page.getByRole('tab',{name:'Invited live access'});await live.focus();await page.keyboard.press('Enter');
  await expect(page.getByLabel('Invitation token')).toBeVisible();
  await page.getByLabel('Invitation token').fill('deliberately-invalid-demo-token');
  await expect(page.getByLabel('Invitation token')).toHaveAttribute('type','password');
});
