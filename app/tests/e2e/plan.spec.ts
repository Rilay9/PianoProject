/**
 * Plan, the lesson page and Skills review (docs/04 §3, §3a).
 *
 * The behaviour worth pinning down is that **every lesson is openable** and
 * that "I already know this" records a self-pass with a *different* badge from
 * a measured one — six months on, the difference between "the app watched me
 * play this" and "I said I could" is what makes the record worth anything.
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

test.describe('Plan', () => {
  test('lists every stage with its completion, and expands to lessons', async ({ page }) => {
    await page.goto('/#/plan');
    await expect(page.locator('.list-row[data-stage="0"]')).toBeVisible();
    await expect(page.locator('.list-row[data-stage="4"]')).toBeVisible();
    // The stage being worked on is expanded on arrival.
    await expect(page.locator('.list-row[data-lesson]').first()).toBeVisible();

    await page.locator('.list-row[data-stage="2"]').click();
    await expect(page.locator('.list-row[data-lesson="2.1"]')).toBeVisible();
  });

  test('opens a lesson far ahead of where the learner is — nothing is locked', async ({ page }) => {
    await page.goto('/#/plan');
    await page.locator('.list-row[data-stage="4"]').click();
    await page.locator('.list-row[data-lesson="4.1"]').click();
    await expect(page).toHaveURL(/#\/lesson\/4\.1/);
    await expect(page.locator('#lesson-exercises .list-row').first()).toBeVisible();
  });

  test('track chips filter the units, and the core path cannot be switched off', async ({ page }) => {
    await page.goto('/#/plan');
    await expect(page.locator('#plan-track-core')).toBeVisible();
    await page.locator('#plan-track-core').click();
    await expect(page.locator('#plan-status')).toContainText('core path is always on');
  });
});

test.describe('the lesson page', () => {
  test('shows the concept text, the options and the videos', async ({ page }) => {
    await page.goto('/#/lesson/1.1');
    await expect(page.locator('.screen h1')).toContainText('Right hand C position');
    await expect(page.locator('#lesson-exercises .list-row').first()).toBeVisible();
    await expect(page.locator('#lesson-songs .list-row').first()).toBeVisible();
    await expect(page.locator('#lesson-text p').first()).toBeVisible();
    // docs/04 §8: a link-out says it needs the network before you tap it.
    await expect(page.locator('#lesson-videos')).toContainText('needs internet');
  });

  test('"I already know this" records a self-pass with its own badge', async ({ page }) => {
    await page.goto('/#/lesson/1.1');
    await page.locator('#lesson-know').click();
    await expect(page.locator('#lesson-status')).toContainText('already known');
    await expect(page.locator('#lesson-exercises')).toContainText('you said you know it');
    await expect(page.locator('#lesson-state')).toContainText('complete');

    // And it survives a reload — this is IndexedDB, not screen state.
    await page.reload();
    await expect(page.locator('#lesson-exercises')).toContainText('you said you know it');
  });

  test('an option that needs importing offers no play button', async ({ page }) => {
    await page.goto('/#/lesson/0.1');
    const importNeeded = page.locator('#lesson-exercises .list-row', { hasText: 'import needed' });
    await expect(importNeeded.first()).toBeVisible();
    await expect(importNeeded.first().getByRole('button', { name: '▶' })).toHaveCount(0);
  });
});

test.describe('Skills review', () => {
  test('lists every concept with a state and a way to drill it', async ({ page }) => {
    await page.goto('/#/plan/skills');
    await expect(page.locator('.screen h1')).toHaveText('Review a skill');
    await expect(page.locator('#skills-status')).toContainText('concepts');
    const first = page.locator('#skills-list .list-row').first();
    await expect(first).toBeVisible();
    await expect(first).toHaveAttribute('data-state', /unseen|learning|known|rusty/);
  });

  test('filters by stage', async ({ page }) => {
    await page.goto('/#/plan/skills');
    const all = await page.locator('#skills-status').textContent();
    await page.locator('#skills-stage').selectOption('1');
    await expect(page.locator('#skills-status')).not.toHaveText(all ?? '');
  });

  test('drilling a concept opens whichever screen the item belongs on', async ({ page }) => {
    // Since P8 a runtime drill goes to the drill screen and generated notation
    // to the Score screen; `ui/openItem` decides, and this is the seam.
    await page.goto('/#/plan/skills');
    await page.locator('#skills-list .list-row').filter({ hasText: 'Drill it' }).first()
      .getByRole('button', { name: 'Drill it' })
      .click();
    await expect(page).toHaveURL(/#\/(score|drill)\//);
  });
});
