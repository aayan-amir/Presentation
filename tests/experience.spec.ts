import {expect, test} from '@playwright/test';

test('rapid terminal input opens the latest chapter and Back restores selection', async({page})=>{
  await page.route('**/terminal.glb',request=>request.abort());
  await page.goto('/');
  await expect(page.locator('.actions')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/chapters\/next-js\/$/);
  await expect(page.getByRole('heading',{level:1})).toHaveText('Next.js');
  await page.getByRole('button',{name:'Together'}).click();
  await expect(page.getByRole('heading',{name:'A dashboard with two jobs'})).toBeVisible();
  await page.getByRole('link',{name:'← Terminal',exact:true}).click();
  await expect(page).toHaveURL(/\?chapter=next-js$/);
  await expect(page.getByRole('heading',{level:1})).toHaveText('Next.js');
});

test('all eight chapters form a continuous presentation', async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.locator('[data-archive]')).toHaveAttribute('data-reduced','');
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect.poll(()=>page.locator('.poster').evaluate(img=>(img as HTMLImageElement).naturalWidth)).toBe(800);
  await page.locator('[data-command="open"]').click();
  const headings=['What is a web framework?','Languages now and next','Next.js','Astro','Remix 3','Two frameworks to watch','Usage and satisfaction','Pick a stack'];
  for(let index=0;index<headings.length;index++){
    await expect(page.getByRole('heading',{level:1})).toHaveText(headings[index]);
    if(index<headings.length-1)await page.getByRole('link',{name:'Next chapter'}).click();
  }
  await page.getByRole('button',{name:'React app'}).click();
  await expect(page.getByRole('heading',{name:'Start with Next.js'})).toBeVisible();
  await page.getByRole('heading',{level:1}).click();
  await page.keyboard.press('p');
  await expect(page.getByRole('heading',{level:1})).toHaveText('Usage and satisfaction');
});

test('framework shortcuts and mission URL state work', async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.getByText('Frameworks',{exact:true}).click();
  await page.getByRole('link',{name:'TanStack Start'}).click();
  await expect(page).toHaveURL(/#tanstack-start$/);
  await page.getByLabel('Mission status').selectOption('archived');
  await page.getByRole('button',{name:'Apply'}).click();
  await expect(page).toHaveURL(/\?status=archived#tanstack-start$/);
  await page.getByRole('link',{name:'Reopen this view'}).click();
  await expect(page.locator('[data-mission="archived"]')).toBeVisible();
  await expect(page.locator('[data-mission="active"]')).toBeHidden();
  await page.getByRole('button',{name:'Load',exact:true}).click();
  await expect(page.getByText('+page.server.ts → load mission data')).toBeVisible();
});

test('Astro islands and survey measures can be switched',async({page})=>{
  await page.goto('/chapters/astro/');
  await page.getByRole('button',{name:'Portfolio',exact:true}).click();
  await expect(page.locator('.atlas-astro')).toHaveAttribute('data-active','2');
  await expect(page.getByRole('heading',{name:'Activate a gallery when it appears'})).toBeVisible();
  await page.goto('/chapters/usage-and-satisfaction/');
  await expect(page.locator('[data-chart="usage"]')).toContainText('59%');
  await page.getByRole('button',{name:'Satisfaction'}).click();
  await expect(page.locator('[data-chart="satisfaction"]')).toContainText('55%');
  await expect(page.locator('[data-chart="usage"]')).toBeHidden();
});

test('language display changes its code example and explanation',async({page})=>{
  await page.goto('/chapters/languages/');
  await page.getByRole('button',{name:'Rust',exact:true}).click();
  await expect(page.getByText('Watch Rust + WebAssembly')).toBeVisible();
  await expect(page.locator('.language-frame:visible code')).toContainText('pub fn pixels');
  await expect(page.getByRole('heading',{name:'Compute-heavy browser code'})).toBeVisible();
});

test.describe('without JavaScript',()=>{
  test.use({javaScriptEnabled:false});
  test('chapter links and the opening definitions remain available',async({page})=>{
    await page.goto('/');
    await page.getByRole('link',{name:'Start chapter 01'}).click();
    await expect(page.getByRole('heading',{level:1})).toHaveText('What is a web framework?');
    await expect(page.getByRole('heading',{name:'HTML · CSS · JavaScript'})).toBeVisible();
    await page.getByRole('link',{name:'Next chapter'}).click();
    await expect(page.getByRole('heading',{name:'Backend services'})).toBeVisible();
  });
});

test('live orbit is interruptible and context loss exposes the poster',async({page,browserName})=>{
  test.skip(browserName!=='chromium','Live renderer verified in Chromium');
  await page.goto('/');
  await expect(page.locator('[data-archive]')).toHaveAttribute('data-mode','three',{timeout:25_000});
  await page.getByRole('button',{name:'Orbit PC'}).click();
  await expect(page.locator('[data-archive]')).toHaveAttribute('data-orbiting','');
  await page.locator('[data-command="right"]').click();
  await expect(page.getByRole('heading',{level:1})).toHaveText('Languages now and next');
  await expect(page.locator('[data-archive]')).not.toHaveAttribute('data-orbiting','');
  await page.locator('canvas').evaluate(canvas=>canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
  await expect(page.locator('[data-archive]')).toHaveAttribute('data-mode','poster');
});


