// U122c check: pictures of the current score surface at the three cells of
// tests/e2e/score.task-chrome.spec.ts, in three states each: rest, count-in, paused.
//
// Setup steps and viewports are the spec's own (same selectors, same mode choices, same mock,
// same 3.5 s observation time after pausing). Ordinary page screenshots (viewport only); the
// page's DOM and CSS are never written to. The evaluate() calls only read.
//
// Written to run from app/build/u122c/ in a worktree: the two fixture imports below are relative
// to that folder. Run with: npx playwright test --config build/u122c/capture.config.ts
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installMidiMock } from '../../tests/e2e/fixtures/midiMock';
import { pressControl } from '../../tests/e2e/scoreControls';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, 'pictures');
mkdirSync(out, { recursive: true });

const CELLS = [
  { width: 568, height: 320 },
  { width: 342, height: 740 },
  { width: 1024, height: 768 },
];

type Facts = Record<string, unknown>;
const facts: Record<string, Facts> = {};

// Read-only observation of the chrome at one moment.
async function observe(page: Page): Promise<Facts> {
  return page.evaluate(() => {
    const screen = document.querySelector('[data-screen="score"]');
    const bar = document.querySelector('#score-bar');
    const play = document.querySelector('#score-play') as HTMLButtonElement | null;
    const rect = (el: Element | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    let hit: string | null = null;
    if (play) {
      const r = play.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      hit = el
        ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${
            el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/).join('.') : ''
          }`
        : null;
    }
    const count = document.querySelector('#score-countin');
    const countRect = count ? count.getBoundingClientRect() : null;
    const marks = [...document.querySelectorAll('#score-stage .is-front svg path, #score-stage .is-front svg text')]
      .map((el) => el.getBoundingClientRect())
      .filter((b) => b.width > 0 && b.height > 0);
    return {
      mode: screen?.getAttribute('data-mode') ?? null,
      running: screen?.getAttribute('data-running') ?? null,
      barVisibleAttr: bar?.getAttribute('data-visible') ?? null,
      playRect: rect(play),
      playLabel: play?.getAttribute('aria-label') ?? null,
      playDisabled: play ? play.disabled : null,
      elementAtPlayCentre: hit,
      countInRect: countRect
        ? { left: countRect.left, top: countRect.top, right: countRect.right, bottom: countRect.bottom }
        : null,
      notationMarks: marks.length,
      notationOverlapsCountIn: countRect
        ? marks.filter(
            (b) =>
              b.left < countRect.right && b.right > countRect.left && b.top < countRect.bottom && b.bottom > countRect.top,
          ).length
        : null,
      viewport: { w: window.innerWidth, h: window.innerHeight },
    };
  });
}

test.afterAll(() => {
  writeFileSync(resolve(here, 'capture-data.json'), JSON.stringify(facts, null, 2));
});

for (const cell of CELLS) {
  const cellName = `${cell.width}x${cell.height}`;

  // The spec's count-in setup, plus the rest picture taken before play is pressed.
  test(`capture rest and count-in at ${cellName}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(cell);
    await page.goto('/#/score/song.folk.hot-cross-buns');
    await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, {
      timeout: 60_000,
    });
    await page.locator('#score-mode').selectOption('tempo');
    // Rest: the screen is ready, tempo mode chosen, play not yet pressed.
    await page.waitForTimeout(500);
    facts[`${cellName}-rest`] = await observe(page);
    await page.screenshot({ path: resolve(out, `before-${cellName}-rest.png`) });
    await page.locator('#score-play').click();
    await expect(page.locator('#score-countin')).toBeVisible({ timeout: 30_000 });
    facts[`${cellName}-count-in`] = await observe(page);
    await page.screenshot({ path: resolve(out, `before-${cellName}-count-in.png`) });
  });

  // The spec's paused setup: wait mode, midi mock granted, play, pause, then 3.5 s.
  test(`capture paused at ${cellName}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(cell);
    await installMidiMock(page, { permission: 'granted' });
    await page.goto('/#/score/song.folk.hot-cross-buns');
    await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, {
      timeout: 60_000,
    });
    await page.locator('#score-mode').selectOption('wait');
    await pressControl(page, '#score-play');
    await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-running', 'true');
    await pressControl(page, '#score-play');
    await page.waitForFunction(() => {
      const api = (window as unknown as {
        __pianopath?: { scoreRun?: () => { paused: boolean } | null };
      }).__pianopath;
      return api?.scoreRun?.()?.paused === true;
    });
    facts[`${cellName}-paused-at-0s`] = await observe(page);
    await page.waitForTimeout(3_500);
    facts[`${cellName}-paused`] = await observe(page);
    await page.screenshot({ path: resolve(out, `before-${cellName}-paused.png`) });
  });
}
