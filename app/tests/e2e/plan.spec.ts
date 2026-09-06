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

  test('lists every exercise for a concept, easiest first, collapsed after three', async ({
    page,
  }) => {
    // replan §3.2: "always something to work on for one skill". Before P12a the
    // screen offered one exercise per concept — whichever was found first — so a
    // skill could only be practised at whatever level that item happened to be.
    await page.goto('/#/plan/skills');
    // A concept with more than three exercises — plenty of concepts have one or
    // two (a stage-0 checklist has exactly one), and those correctly show no
    // toggle at all, so picking the first row would test the wrong thing.
    //
    // Resolved to a *stable* selector before anything is clicked: a filtered
    // locator is re-evaluated on every use, so once the button says "Show
    // fewer" the filter stops matching and the locator silently moves to the
    // next concept that still says "Show all".
    const concept = await page
      .locator('.skill-options')
      .filter({ has: page.locator('button', { hasText: /Show all \d+/ }) })
      .first()
      .getAttribute('data-options-for');
    expect(concept).toBeTruthy();
    const options = page.locator(`.skill-options[data-options-for="${concept ?? ''}"]`);
    await expect(options).toBeVisible();

    const shown = options.locator('.list-row[data-skill-item]');
    await expect(shown).toHaveCount(3);

    const more = options.locator('button', { hasText: /Show all \d+/ });
    await expect(more).toBeVisible();
    await more.click();
    expect(await shown.count()).toBeGreaterThan(3);

    // Easiest first: the levels printed on the rows never decrease.
    const levels = await shown.locator('.list-row__meta').allTextContents();
    const numbers = levels.map((text) => Number(/L(\d+\.\d)/.exec(text)?.[1] ?? '0'));
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));

    await options.locator('button', { hasText: 'Show fewer' }).click();
    await expect(shown).toHaveCount(3);
  });

  test('a concept with many exercises reaches the upper levels', async ({ page }) => {
    // The point of the level table: `scale` is practisable at stage 8, not just
    // wherever the first scale exercise happened to sit.
    await page.goto('/#/plan/skills');
    const scaleRow = page.locator('.list-row[data-concept="scale"]');
    await expect(scaleRow).toBeVisible();
    await expect(scaleRow).toContainText('to practise');
    const options = page.locator('.skill-options[data-options-for="scale"]');
    await options.locator('button', { hasText: /Show all \d+/ }).click();
    const metas = await options.locator('.list-row[data-skill-item] .list-row__meta').allTextContents();
    const highest = Math.max(...metas.map((t) => Number(/L(\d+\.\d)/.exec(t)?.[1] ?? '0')));
    expect(highest).toBeGreaterThanOrEqual(6);
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
