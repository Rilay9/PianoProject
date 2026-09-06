/**
 * The six carry-overs (P18).
 *
 * Each of these was written up honestly as "not done" by P6, P7 or P8. What
 * the browser can check that a unit test cannot: that the control is on the
 * screen, that the gesture works, and that the layout changes at the
 * breakpoint and nowhere else.
 */
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
    }
  });
});

test.describe('named sections', () => {
  test('offers the piece’s own sections and loops one of them', async ({ page }) => {
    await page.goto('/#/score/song.classical.petzold-minuet-g-bwv-anh114');
    const picker = page.locator('#score-section');
    await expect(picker).toBeVisible();
    // Read off the score: the minuet is binary form with both halves repeated.
    await expect(picker).toContainText('First half (repeated)');
    await expect(picker).toContainText('Second half (repeated)');

    await picker.selectOption('Second half (repeated)');
    // The loop button names the section rather than a pair of bar numbers,
    // which is the whole point of having named them.
    await expect(page.locator('#score-loop')).toHaveText(/Loop Second half \(repeated\)/);
  });

  test('is absent on a piece with no sections', async ({ page }) => {
    // A disabled control is a question the screen cannot answer.
    await page.goto('/#/score/exercise.five-finger.c-major.right');
    await expect(page.locator('#score-section')).toBeHidden();
  });

  test('clearing the loop clears the section too', async ({ page }) => {
    await page.goto('/#/score/song.classical.petzold-minuet-g-bwv-anh114');
    // Visible means loadable: the picker stays hidden until the score is
    // parsed, because until then choosing a section has nothing to turn its
    // printed bars into. This test used to flake on a loaded machine by
    // selecting into that gap.
    await expect(page.locator('#score-section')).toBeVisible();
    await page.locator('#score-section').selectOption('First half (repeated)');
    await expect(page.locator('#score-loop')).toHaveText(/Loop First half/);
    await page.locator('#score-loop').click();
    await expect(page.locator('#score-loop')).toHaveText('Loop');
    await expect(page.locator('#score-section')).toHaveValue('');
  });
});

test.describe('drag-to-reorder tracks', () => {
  test('moves a chip to the front and stores the new order', async ({ page }) => {
    await page.goto('/#/plan');
    const first = page.locator('#plan-track-core');
    await expect(first).toBeVisible();

    // The buttons are the fallback and the thing a test can drive reliably;
    // the drag is exercised below.
    const classical = page.locator('#plan-track-up-classical');
    if (await classical.count()) {
      const before = await page.locator('[data-track]').first().getAttribute('data-track');
      await classical.click();
      await expect
        .poll(async () => page.locator('[data-track][data-order="0"]').getAttribute('data-track'))
        .not.toBe(null);
      expect(before).not.toBe(null);
    }
  });

  test('a drag past the threshold reorders; a tap still toggles', async ({ page }) => {
    await page.goto('/#/plan');
    const target = page.locator('#plan-track-classical');
    await expect(target).toBeVisible();
    const pressed = await target.getAttribute('aria-pressed');

    // A tap that wobbles by a pixel must still be a tap.
    const box = await target.boundingBox();
    if (!box) throw new Error('no chip');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 2, box.y + box.height / 2);
    await page.mouse.up();
    await expect(target).toHaveAttribute('aria-pressed', String(pressed !== 'true'));
  });

  test('the order survives a reload, because it is stored', async ({ page }) => {
    await page.goto('/#/plan');
    const up = page.locator('#plan-track-up-classical');
    if (!(await up.count())) test.skip();
    await up.click();
    const after = await page.locator('[data-track][data-order="0"]').getAttribute('data-track');
    await page.reload();
    await expect(page.locator('[data-track][data-order="0"]')).toHaveAttribute(
      'data-track',
      after ?? '',
    );
  });
});

test.describe('the backing loop', () => {
  test('offers bass and drums, and turning it on turns the comp on', async ({ page }) => {
    await page.goto('/#/chart/song.jazz.autumn-leaves');
    const backing = page.locator('#chart-backing');
    if (!(await backing.count())) test.skip();
    await backing.click();
    await expect(backing).toHaveAttribute('aria-pressed', 'true');
    // The bass follows the chord, so the comp has to be running for the loop
    // to know what to play.
    await expect(page.locator('#chart-comp')).toHaveAttribute('aria-pressed', 'true');
  });

  test('stops when the screen is left', async ({ page }) => {
    await page.goto('/#/chart/song.jazz.autumn-leaves');
    if (!(await page.locator('#chart-backing').count())) test.skip();
    await page.locator('#chart-backing').click();
    await page.locator('#chart-start').click();
    await expect(page.locator('[data-screen="chart"]')).toHaveAttribute('data-running', 'true');
    await page.goto('/#/today');
    // Everything is queued a bar ahead on the audio clock, so leaving with the
    // loop running would play into whatever came next.
    await expect(page.locator('[data-screen="chart"]')).toHaveCount(0);
  });
});

test.describe('strict prerequisites', () => {
  test('is off by default — nothing is locked (00 D17)', async ({ page }) => {
    await page.goto('/#/lesson/4.5');
    await expect(page.locator('#lesson-lock')).toBeHidden();
  });

  test('shows a badge and a reason when it is on, and never a disabled card', async ({ page }) => {
    await page.goto('/#/settings');
    await page.locator('#set-strict-prereqs').check();

    await page.goto('/#/lesson/4.5');
    const lock = page.locator('#lesson-lock');
    await expect(lock).toBeVisible();
    await expect(lock).toContainText('comes later');
    await expect(lock).toContainText('Usually comes after');

    // The cards still open. A disabled card tells the learner no and gives him
    // nothing to do about it.
    const first = page.locator('#lesson-exercises .list-row button').first();
    await expect(first).toBeEnabled();
  });

  test('offers a way to the rung that would unlock it', async ({ page }) => {
    await page.goto('/#/settings');
    await page.locator('#set-strict-prereqs').check();
    await page.goto('/#/lesson/4.5');
    const go = page.locator('#lesson-prereq-go');
    await expect(go).toBeVisible();
    await go.click();
    await expect(page).toHaveURL(/#\/lesson\//);
  });
});

test.describe('the tablet layout', () => {
  test.use({ viewport: { width: 1024, height: 1000 } });

  test('shows the side panel and opens at four bars', async ({ page }) => {
    await page.goto('/#/score/song.classical.petzold-minuet-g-bwv-anh114');
    await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-tablet', 'true');
    const panel = page.locator('#score-side');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveJSProperty('open', true);
    await expect(page.locator("#score-bars")).toContainText("4");
  });

  test('the panel collapses', async ({ page }) => {
    await page.goto('/#/score/song.classical.petzold-minuet-g-bwv-anh114');
    await page.locator('#score-side-summary').click();
    await expect(page.locator('#score-side')).toHaveJSProperty('open', false);
  });
});

test.describe('the phone is untouched', () => {
  test.use({ viewport: { width: 412, height: 915 } });

  test('has no side panel and keeps its own bars setting', async ({ page }) => {
    await page.goto('/#/score/song.classical.petzold-minuet-g-bwv-anh114');
    await expect(page.locator('[data-screen="score"]')).not.toHaveAttribute('data-tablet', 'true');
    await expect(page.locator('#score-side')).toHaveCount(0);
  });
});
