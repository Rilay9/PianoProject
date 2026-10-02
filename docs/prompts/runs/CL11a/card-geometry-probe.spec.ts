import { expect, test } from '@playwright/test';

test('card geometry, phone sideways: does the sheet scroll, and can Start be reached?', async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 360 });
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') !== null) return;
    sessionStorage.setItem('e2e-fresh', '1');
    indexedDB.deleteDatabase('pianopath');
    localStorage.clear();
    localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
    localStorage.setItem(
      'pianopath.settings',
      JSON.stringify({ inputPriority: ['keys'], defaultModeWithInput: 'tempo', defaultModeWithoutInput: 'tempo', defaultTempoPct: 100 }),
    );
  });
  await page.goto('/#/score/song.folk.hot-cross-buns?rung=1.1');
  const card = page.locator('#score-first-sight');
  await expect(card).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(500);
  const chain = await page.evaluate(() => {
    const out: string[] = [];
    let el: HTMLElement | null = document.getElementById('score-first-sight');
    while (el && out.length < 6) {
      const cs = getComputedStyle(el);
      out.push(`${el.tagName.toLowerCase()}#${el.id}.${el.className} overflowY=${cs.overflowY} pos=${cs.position} sh=${String(el.scrollHeight)} ch=${String(el.clientHeight)} maxH=${cs.maxHeight}`);
      el = el.parentElement;
    }
    return out;
  });
  console.log(`CHAIN ${JSON.stringify(chain)}`);
  const before = await page.locator('#score-first-sight-go').boundingBox();
  await page.mouse.move(390, 200);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(300);
  const after = await page.locator('#score-first-sight-go').boundingBox();
  const visible = await page.locator('#score-first-sight-go').isVisible();
  console.log(`WHEEL before=${JSON.stringify(before)} after=${JSON.stringify(after)} visible=${String(visible)}`);
  let clicked = 'no';
  try {
    await page.locator('#score-first-sight-go').click({ timeout: 3000 });
    clicked = 'yes';
  } catch (error) {
    clicked = `no: ${String(error).split('\n')[0]}`;
  }
  console.log(`CLICK ${clicked}`);
});
