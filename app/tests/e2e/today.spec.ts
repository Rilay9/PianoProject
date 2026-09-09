/**
 * Today (docs/04 §2).
 *
 * The two things worth guarding are the ones the owner asked for by name: a
 * session built from the templates in curriculum Part A §8, and **"Swap this"
 * on every row** with a "not a song" filter — because half the point of the
 * exercise breadth is that a skill can be practised without a tune attached
 * (`00` D21).
 */
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      // A cleared origin is a first launch, and a first launch is the setup
      // tour (docs/04 §7d); this spec is about what comes after it.
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
    }
  });
});

test.describe('Today', () => {
  test('shows a weekly goal, an input chip, and a session card', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#today-goal')).toContainText('min this week');
    await expect(page.locator('#today-input')).toBeVisible();
    await expect(page.locator('#today-card .list-row').first()).toBeVisible();
    await expect(page.locator('#today-status')).toContainText('Working on Stage');
  });

  test('the four session lengths build different cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#today-length-15')).toBeVisible();
    await page.locator('#today-length-15').click();
    await expect(page.locator('#today-length-15')).toHaveAttribute('aria-pressed', 'true');
    const short = await page.locator('#today-card .list-row').count();

    await page.locator('#today-length-120').click();
    const long = await page.locator('#today-card .list-row').count();
    expect(long).toBeGreaterThan(short);
    // docs/02 §8: the two-hour session is two halves with a break between.
    await expect(page.locator('#today-break')).toBeVisible();
  });

  test('remembers the session length across a reload', async ({ page }) => {
    await page.goto('/');
    await page.locator('#today-length-60').click();
    await page.reload();
    await expect(page.locator('#today-length-60')).toHaveAttribute('aria-pressed', 'true');
  });

  test('"Swap this" offers alternatives and can exclude songs', async ({ page }) => {
    await page.goto('/');
    const firstRow = page.locator('#today-card .list-row').first();
    await firstRow.getByRole('button', { name: 'Swap' }).click();
    await expect(page.locator('#today-swap')).toBeVisible();
    await expect(page.locator('#today-swap-notasong')).toBeVisible();

    const options = page.locator('#today-swap .list-row');
    await expect(options.first()).toBeVisible();
    const title = await firstRow.locator('.list-row__title').textContent();

    await options.first().click();
    await expect(page.locator('#today-swap')).toHaveCount(0);
    await expect(firstRow.locator('.list-row__title')).not.toHaveText(title ?? '');
    await expect(firstRow).toContainText('You chose this one');
  });

  test('the "not a song" filter removes songs from the swap sheet', async ({ page }) => {
    await page.goto('/');
    // The "New" row is the one that offers songs, so it is the one where the
    // filter has anything to do.
    const newRow = page.locator('#today-card .list-row[data-slot="new"]').first();
    await newRow.getByRole('button', { name: 'Swap' }).click();
    const sheet = page.locator('#today-swap');
    await expect(sheet).toBeVisible();

    const withSongs = await sheet.locator('.list-row').count();
    await page.locator('#today-swap-notasong').click();
    await expect(page.locator('#today-swap-notasong')).toHaveAttribute('aria-pressed', 'true');
    const withoutSongs = await sheet.locator('.list-row').count();
    expect(withoutSongs).toBeLessThanOrEqual(withSongs);
    await expect(sheet.locator('.list-row', { hasText: '· song' })).toHaveCount(0);
  });

  test('shuffle rebuilds the card', async ({ page }) => {
    await page.goto('/');
    const before = await page.locator('#today-card').textContent();
    await page.locator('#today-shuffle').click();
    await expect
      .poll(async () => page.locator('#today-card').textContent())
      .not.toBe(before);
  });

  test('the tracks the data switches on are on before he touches a chip (C2)', async ({
    page,
  }) => {
    // Three screens used to answer this differently. Settings is the cheapest
    // place to see it: on a fresh phone the stored order is ['core'] and the
    // chip for a default-active track read as off while Plan showed it on.
    await page.goto('/#/settings');
    await expect(page.locator('#settings-track-core')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#settings-track-classical')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // And one the data leaves off is still off.
    await expect(page.locator('#settings-track-blues-boogie')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('Today keeps recommending after the core path, from a track he never turned on', async ({
    page,
  }) => {
    // The failure this replaces: Today walked the raw ['core'] order, so the
    // moment the core path was finished it said "Every lesson in the plan is
    // complete" — to a learner who had done Stage 0 to 4 and nothing else.
    await page.goto('/');
    const coreLessons = await page.evaluate(async () => {
      const response = await fetch('content/curriculum.json');
      const curriculum = (await response.json()) as {
        stages: { units: { track: string; lessons: { id: string; exerciseOptions: string[]; songOptions: string[] }[] }[] }[];
      };
      const store = (window as unknown as { __pianopath?: Record<string, unknown> }).__pianopath;
      const recordRun = store?.recordRun as ((r: unknown) => Promise<unknown>) | undefined;
      if (!recordRun) throw new Error('progress store not exposed');
      const ids: string[] = [];
      for (const stage of curriculum.stages) {
        for (const unit of stage.units) {
          if (unit.track !== 'core') continue;
          for (const lesson of unit.lessons) {
            ids.push(lesson.id);
            for (const itemId of [...lesson.exerciseOptions, ...lesson.songOptions]) {
              await recordRun({
                itemId,
                mode: 'tempo',
                tempoPct: 100,
                accuracy: 0.98,
                accuracyEstimated: false,
                wrongNotes: 0,
                missed: 0,
                durationMs: 120_000,
                passed: true,
                masterEligible: false,
              });
            }
          }
        }
      }
      return ids;
    });
    expect(coreLessons.length).toBeGreaterThan(20);

    await page.reload();
    const status = page.locator('#today-status');
    await expect(status).toContainText('Working on Stage');
    const line = (await status.textContent()) ?? '';
    const named = /lesson (\S+)$/.exec(line.trim())?.[1] ?? '';
    expect(named).not.toBe('');
    expect(coreLessons).not.toContain(named);
  });

  test('starting the session opens the first row', async ({ page }) => {
    await page.goto('/');
    await page.locator('#today-start').click();
    // The warm-up row is usually a drill, which since P8 has a screen of its
    // own; a bundled exercise is notation and opens the Score screen.
    await expect(page).toHaveURL(/#\/(score|drill)\//);
    await expect(page.locator('[data-screen="drill"], [data-screen="score"]')).toBeVisible();
  });
});

/**
 * The rules of `04` §0, on the screen they were written for.
 *
 * These are pixel assertions on purpose. R1 and R2 are claims about what a
 * person sees without scrolling, and the only honest way to check that is to
 * measure it at the size he holds.
 */
test.describe('Today obeys 04 §0', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('the session card starts inside the first screenful (R1)', async ({ page }) => {
    await page.goto('/');
    const first = page.locator('#today-card .list-row').first();
    await expect(first).toBeVisible();
    const box = await first.boundingBox();
    expect(box).not.toBeNull();
    // The header is a title, a goal line and four chips. Anything more and the
    // thing the screen is for has left the screen.
    expect(box?.y ?? 0).toBeLessThan(300);
  });

  test('a row is one line of detail and no taller than 96 px (R2)', async ({ page }) => {
    await page.goto('/');
    const rows = page.locator('#today-card .list-row');
    await expect(rows.first()).toBeVisible();
    const metas = await page.locator('#today-card .list-row__meta').all();
    expect(metas.length).toBeGreaterThan(0);
    for (const meta of metas) {
      const wrapped = await meta.evaluate((el) => {
        const line = Number.parseFloat(getComputedStyle(el).lineHeight);
        // Two lines or more is a wrap; the line-height is the unit that says so.
        return Number.isFinite(line) ? el.scrollHeight > line * 1.6 : false;
      });
      expect(wrapped, `meta wrapped: ${(await meta.textContent()) ?? ''}`).toBe(false);
    }
    // One title line and one detail line, plus padding and a badge row.
    for (const row of await rows.all()) {
      const box = await row.boundingBox();
      expect(box?.height ?? 0).toBeLessThanOrEqual(96);
    }
  });

  test('one filled button on the screen, and it is Start session (R3)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#today-card .list-row').first()).toBeVisible();
    // Row play buttons are the exception the rule names: one per row, and the
    // row is the subject. The rule is about the screen's own chrome.
    const filled = page.locator('#today-actions .button--primary');
    await expect(filled).toHaveCount(1);
    await expect(filled).toHaveAttribute('id', 'today-start');
    // Both left for Plan, which is where they already were.
    await expect(page.locator('#today-skills')).toHaveCount(0);
    await expect(page.locator('#today-practice')).toHaveCount(0);
  });
});
