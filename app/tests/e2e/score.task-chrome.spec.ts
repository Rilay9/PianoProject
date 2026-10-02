import { expect, test } from '@playwright/test';
import { installMidiMock } from './fixtures/midiMock';
import { pressControl } from './scoreControls';

const CELLS = [
  { width: 568, height: 320 },
  { width: 342, height: 740 },
  { width: 1024, height: 768 },
];

for (const cell of CELLS) {
  test(`paused learner keeps direct resume at ${cell.width}x${cell.height}`, async ({ page }) => {
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
    // Cross the current three-second idle fold, rather than inspecting only the
    // immediate post-tap frame. This is observation time, not a UX deadline.
    await page.waitForTimeout(3_500);
    const resume = page.locator('#score-play');
    await expect(resume, 'resume remains on the glass without revealing the bar').toBeVisible();
    await expect(resume).toBeEnabled();
    await resume.click();
    await page.waitForFunction(() => {
      const api = (window as unknown as {
        __pianopath?: { scoreRun?: () => { paused: boolean } | null };
      }).__pianopath;
      return api?.scoreRun?.()?.paused === false;
    });
  });

  test(`count-in leaves entrance notation clear at ${cell.width}x${cell.height}`, async ({ page }) => {
    await page.setViewportSize(cell);
    await page.goto('/#/score/song.folk.hot-cross-buns');
    await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, {
      timeout: 60_000,
    });
    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-play').click();
    await expect(page.locator('#score-countin')).toBeVisible({ timeout: 30_000 });
    const clashes = await page.evaluate(() => {
      const count = document.querySelector('#score-countin')!.getBoundingClientRect();
      const marks = [...document.querySelectorAll('#score-stage .is-front svg path, #score-stage .is-front svg text')]
        .map((el) => el.getBoundingClientRect())
        .filter((box) => box.width > 0 && box.height > 0);
      return {
        marks: marks.length,
        overlaps: marks.filter((box) =>
          box.left < count.right && box.right > count.left &&
          box.top < count.bottom && box.bottom > count.top,
        ).length,
      };
    });
    expect(clashes.marks, 'the test must inspect drawn notation').toBeGreaterThan(0);
    expect(clashes.overlaps, 'the count-in box must not cover entrance ink').toBe(0);
  });
}
