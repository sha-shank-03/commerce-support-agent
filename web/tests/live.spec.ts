import {test,expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

test('invited live refund survives refresh and executes only after approval',async({page})=>{
 test.skip(process.env.LIVE_BROWSER_TEST!=='true','Explicit provider-spending opt-in required');
 test.setTimeout(120000);
 execFileSync('bin/server',['-invite'],{cwd:'..',stdio:'ignore'});
 const invitation=readFileSync('../.local/invite.txt','utf8').trim();
 await page.goto('/');await page.getByRole('tab',{name:'Invited live access'}).click();
 await page.getByLabel('Invitation token').fill(invitation);
 await page.getByRole('button',{name:'Open live workspace'}).click();
 await expect(page.getByRole('button',{name:/CASE 02/})).toBeVisible({timeout:10000});
 await page.getByRole('button',{name:/CASE 02/}).click();
 await page.getByRole('button',{name:'Start investigation'}).click();
 await expect(page.getByRole('button',{name:'Approve simulated action'})).toBeVisible({timeout:80000});
 await expect(page.getByRole('heading',{name:'Action receipt',exact:false})).toHaveCount(0);
 await page.reload();await page.getByRole('tab',{name:'Invited live access'}).click();
 await expect(page.getByRole('button',{name:'Approve simulated action'})).toBeVisible();
 await page.getByRole('button',{name:'Approve simulated action'}).click();
 await expect(page.getByRole('heading',{name:'Action receipt',exact:false})).toBeVisible({timeout:30000});
 await expect(page.getByRole('button',{name:'Approve simulated action'})).toHaveCount(0);
});
