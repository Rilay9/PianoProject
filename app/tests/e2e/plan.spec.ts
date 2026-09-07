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
    // Choosing and ordering tracks moved into a sheet (`04` §0 R3): fifteen
    // chips and eight arrows were 470 px of the daily screen for a thing done
    // once. The header shows the answer; the sheet holds the question.
    await expect(page.locator('#plan-active-core')).toBeVisible();
    await page.locator('#plan-tracks-open').click();
    await expect(page.locator('#plan-tracks-sheet')).toBeVisible();
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
    // The screen draws fifty concepts and then `Show all` (`04` §3a): 266 of
    // them at once was 478 interactive elements on arrival. Wait for the list
    // before looking for the button — it is built after the catalogue loads.
    await expect(page.locator('#skills-list .list-row').first()).toBeVisible();
    const showAll = page.locator('#skills-show-all');
    if (await showAll.count()) await showAll.click();
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

/**
 * `04` §0 on Plan. The header used to be fifteen chips and eight arrows —
 * about 470 px of a 780 px screen — for a choice made once a year.
 */
test.describe('Plan obeys 04 §0', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('Stage 0 starts inside the first screenful, with every track on (R1)', async ({ page }) => {
    await page.goto('/#/plan');
    // Turn everything on: the worst case for the header is every track active.
    await page.locator('#plan-tracks-open').click();
    for (const chipEl of await page.locator('#plan-tracks-list [data-track]').all()) {
      if ((await chipEl.getAttribute('aria-pressed')) !== 'true') await chipEl.click();
    }
    await page.locator('#plan-tracks-sheet-close').click();
    const stage = page.locator('.list-row[data-stage="0"]');
    await expect(stage).toBeVisible();
    const box = await stage.boundingBox();
    expect(box?.y ?? 0).toBeLessThan(200);
  });

  test('a lesson card never repeats its unit title (D26)', async ({ page }) => {
    await page.goto('/#/plan');
    // The stage being worked on is already open on arrival; clicking it would
    // close it, and there would be no lesson rows to look at.
    const stage = page.locator('.list-row[data-stage="0"]');
    if ((await stage.getAttribute('data-open')) !== 'true') await stage.click();
    const rows = await page.locator('.list-row[data-lesson]').all();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const title = (await row.locator('.list-row__title').textContent()) ?? '';
      // The subtitle was the unit's title, under a card whose own title is
      // usually the same words, under a heading that says it a third time.
      await expect(row.locator('.list-row__sub')).toHaveCount(0);
      expect(title.trim()).not.toBe('');
    }
  });

  test('ordering tracks lives in the sheet, not on the screen (R3)', async ({ page }) => {
    await page.goto('/#/plan');
    await expect(page.locator('#plan-track-up-classical')).toHaveCount(0);
    await page.locator('#plan-tracks-open').click();
    await expect(page.locator('#plan-tracks-sheet')).toBeVisible();
    // Present once the sheet is open, if classical is on.
    const chipEl = page.locator('#plan-track-classical');
    if ((await chipEl.getAttribute('aria-pressed')) === 'true') {
      await expect(page.locator('#plan-track-up-classical')).toHaveCount(1);
    }
  });
});

/**
 * `04` §0 on the lesson page. The options — the reason the page exists — used
 * to start about 560 px down a 780 px screen, under a status line, three
 * buttons, a link, the needs line, two more buttons, a link and a paragraph.
 */
test.describe('the lesson page obeys 04 §0', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('the options start inside the first screenful (R1)', async ({ page }) => {
    await page.goto('/#/lesson/2.1');
    await expect(page.locator('#lesson-exercises .list-row').first()).toBeVisible();
    const heading = page.getByRole('heading', { name: 'Exercise options' });
    const box = await heading.boundingBox();
    expect(box?.y ?? 0).toBeLessThan(260);
  });

  test('one filled button per option card and none in the chrome (R3)', async ({ page }) => {
    await page.goto('/#/lesson/2.1');
    await expect(page.locator('#lesson-exercises .list-row').first()).toBeVisible();
    // The play button on a row is the row's own subject; the rule is about the
    // screen's chrome, which should have none.
    await expect(page.locator('#lesson-actions .button--primary')).toHaveCount(0);
    await expect(page.locator('#lesson-find .button--primary')).toHaveCount(0);
  });

  test('the rarely-used things moved below the options (R1)', async ({ page }) => {
    await page.goto('/#/lesson/2.1');
    await expect(page.locator('#lesson-exercises .list-row').first()).toBeVisible();
    const options = await page.getByRole('heading', { name: 'Exercise options' }).boundingBox();
    const more = await page.getByRole('heading', { name: 'More for this rung' }).boundingBox();
    expect(more?.y ?? 0).toBeGreaterThan(options?.y ?? 0);
    // And they still work: the finder and the paper form are the two the
    // existing tests drive.
    await expect(page.locator('#lesson-find-more')).toBeVisible();
    await expect(page.locator('#lesson-needs')).toContainText('option');
  });
});

/**
 * `04` §3a. Skills drew all 266 concepts on arrival — 478 interactive
 * elements, where every other screen in the app is in double figures.
 */
test.describe('Skills obeys 04 §0', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('draws a page, not the whole curriculum (R1)', async ({ page }) => {
    await page.goto('/#/plan/skills');
    await expect(page.locator('#skills-list .list-row').first()).toBeVisible();
    const controls = await page
      .locator('[data-screen="skills"] button, [data-screen="skills"] select')
      .count();
    expect(controls).toBeLessThan(200);
    // And everything is still reachable.
    await expect(page.locator('#skills-show-all')).toBeVisible();
  });

  test('Show all reaches every concept', async ({ page }) => {
    await page.goto('/#/plan/skills');
    await expect(page.locator('#skills-list .list-row').first()).toBeVisible();
    const before = await page.locator('.list-row[data-concept]').count();
    await page.locator('#skills-show-all').click();
    const after = await page.locator('.list-row[data-concept]').count();
    expect(after).toBeGreaterThan(before);
    await expect(page.locator('#skills-show-all')).toHaveCount(0);
  });

  test('at most one filled button per concept, and it is Drill it (R3)', async ({ page }) => {
    await page.goto('/#/plan/skills');
    await expect(page.locator('.list-row[data-concept]').first()).toBeVisible();
    let drills = 0;
    for (const row of await page.locator('.list-row[data-concept]').all()) {
      const filled = await row.locator('.button--primary').count();
      // A concept with nothing to practise yet has none, which is right. What
      // must never happen is two boxes competing for the eye on one row.
      expect(filled).toBeLessThanOrEqual(1);
      if (filled === 1) {
        drills += 1;
        await expect(row.getByRole('button', { name: 'Drill it' })).toBeVisible();
      }
      // `Find more` is text beside it, never a second box.
      await expect(row.locator('.button--secondary')).toHaveCount(0);
    }
    expect(drills).toBeGreaterThan(0);
  });
});
