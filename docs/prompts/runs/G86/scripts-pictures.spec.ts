// G86's pictures at 342 x 740 (throwaway probe, not for the commit).
import { expect, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { openScoreMenu, pressControl } from '../../tests/e2e/scoreControls';

const ITEM = 'song.folk.hot-cross-buns';
const LABEL = process.env.G86_LABEL ?? 'unlabelled';
const OUT = '../docs/prompts/pictures/g86';

test.use({ viewport: { width: 342, height: 740 } });
test.describe.configure({ timeout: 120_000 });

type Captured = Window & { __contexts?: AudioContext[]; __busySeen?: number };

test('the Library after Back with the ⋯ sheet open', async ({ page }) => {
  await page.goto('/#/library');
  await expect(page.locator('.screen h1')).toHaveText('Library');
  await page.evaluate((id) => {
    window.location.hash = `#/score/${id}`;
  }, ITEM);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, {
    timeout: 60_000,
  });
  await openScoreMenu(page);
  await page.screenshot({ path: `${OUT}/score-menu-open-${LABEL}.png` });
  await page.goBack();
  await expect(page.locator('.screen h1')).toHaveText('Library');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/library-after-back-${LABEL}.png` });
  const left = await page.evaluate(() => ({
    sheets: document.querySelectorAll('.sheet').length,
    inert: Array.from(document.body.children).filter((n) => n instanceof HTMLElement && n.inert).length,
  }));
  writeFileSync(`build/g86-probe/library-after-back-${LABEL}.json`, JSON.stringify(left));
});

test('▶ on a suspended context: the busy state, ordinary and with a start that never answers', async ({ page }) => {
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    const made: AudioContext[] = [];
    (window as Captured).__contexts = made;
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options);
        made.push(this);
      }
    };
  });
  await page.goto(`/#/score/${ITEM}?mode=tempo`);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', 'tempo', {
    timeout: 60_000,
  });
  await expect(page.locator('#score-bar')).toHaveAttribute('data-visible', 'true');
  await page.locator('#score-title').click({ timeout: 5_000 });
  const state = (): Promise<string> => page.evaluate(() => (window as Captured).__contexts?.[0]?.state ?? 'none');
  await expect.poll(state).toBe('running');

  // Ordinary: the context resumes when asked. Count every moment ▶ said it was busy.
  await page.evaluate(async () => {
    const w = window as Captured;
    w.__busySeen = 0;
    const play = document.getElementById('score-play');
    if (play) {
      new MutationObserver(() => {
        if (play.dataset.startingSound === 'true') w.__busySeen = (w.__busySeen ?? 0) + 1;
      }).observe(play, { attributes: true, attributeFilter: ['data-starting-sound'] });
    }
    await w.__contexts?.[0]?.suspend();
  });
  await expect.poll(state).toBe('suspended');
  await page.locator('#score-play').click({ timeout: 5_000 });
  await expect.poll(state, { timeout: 10_000 }).toBe('running');
  const ordinaryBusy = await page.evaluate(() => (window as Captured).__busySeen ?? 0);
  // Pause the run (a pause never waits), then a start that never answers.
  await pressControl(page, '#score-play');
  await expect(page.locator('#score-play')).toHaveText('▶');
  await page.evaluate(async () => {
    const ctx = (window as Captured).__contexts?.[0];
    await ctx?.suspend();
    if (ctx) ctx.resume = () => new Promise<void>(() => undefined);
  });
  await pressControl(page, '#score-play');
  const busyNow = await page.evaluate(() => {
    const play = document.getElementById('score-play') as HTMLButtonElement | null;
    return { busy: play?.getAttribute('aria-busy') ?? null, disabled: play?.disabled ?? null };
  });
  await page.screenshot({ path: `${OUT}/play-busy-${LABEL}.png` });
  await expect(page.locator('#score-play')).not.toHaveAttribute('data-starting-sound', 'true', { timeout: 5_000 });
  await expect(page.locator('#score-play')).toHaveText('⏸');
  writeFileSync(
    `build/g86-probe/play-busy-${LABEL}.json`,
    JSON.stringify({ ordinaryBusy, busyNow, stateAfter: await state() }),
  );
});
