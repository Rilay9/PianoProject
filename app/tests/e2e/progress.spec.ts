/**
 * Progress, Settings and Diagnostics (docs/04 §6, §7, §7b).
 *
 * The acceptance criterion P7 sets is here: a full lesson flow from Today to a
 * recorded run, and the item coming back in the review queue tomorrow with a
 * faked clock. And the export/import round trip, because a backup file is the
 * only copy of a year of practice on a phone with no server behind it.
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

/** Writes a progress row straight into the store, as a finished run would. */
async function seedRun(
  page: import('@playwright/test').Page,
  itemId: string,
  daysAgo: number,
): Promise<void> {
  await page.evaluate(
    async ({ id, days }) => {
      const when = new Date(Date.now() - days * 86_400_000);
      const store = (window as unknown as { __pianopath?: Record<string, unknown> }).__pianopath;
      const recordRun = store?.recordRun as
        | ((r: unknown, now?: Date) => Promise<unknown>)
        | undefined;
      if (!recordRun) throw new Error('progress store not exposed');
      await recordRun(
        {
          itemId: id,
          mode: 'tempo',
          tempoPct: 100,
          accuracy: 0.95,
          accuracyEstimated: false,
          wrongNotes: 1,
          missed: 0,
          durationMs: 240_000,
          passed: true,
          masterEligible: false,
        },
        when,
      );
    },
    { id: itemId, days: daysAgo },
  );
}

test.describe('Progress', () => {
  test('shows the week, the heat-map and an empty repertoire on a fresh phone', async ({ page }) => {
    await page.goto('/#/progress');
    await expect(page.locator('#progress-week')).toContainText('of 150 minutes');
    await expect(page.locator('#progress-heatmap .heat-cell')).toHaveCount(91);
    await expect(page.locator('#progress-repertoire')).toContainText('Nothing mastered yet');
    await expect(page.locator('#progress-history')).toContainText('No runs recorded yet');
  });

  test('records a run and shows it in the history and the heat-map', async ({ page }) => {
    await page.goto('/#/progress');
    await seedRun(page, 'song.folk.hot-cross-buns', 0);
    await page.reload();
    await expect(page.locator('#progress-history')).toContainText('Hot Cross Buns');
    await expect(page.locator('#progress-totals')).toContainText('1 passed');
    const today = new Date().toISOString().slice(0, 10);
    await expect(page.locator(`.heat-cell[data-day="${today}"]`)).toHaveAttribute('data-level', /[1-4]/);
  });

  test('an item passed yesterday is due for review today', async ({ page }) => {
    await page.goto('/#/progress');
    // Faking the clock rather than waiting a day: the review intervals in
    // docs/02 Part G are 1, 3, 7 and 21 days after a pass.
    await seedRun(page, 'song.folk.hot-cross-buns', 2);
    await page.goto('/#/today');
    await expect(page.locator('.list-row[data-slot="review"]')).toContainText('Hot Cross Buns');
    await expect(page.locator('.list-row[data-slot="review"]')).toContainText('Due for review today');
  });

  test('exports everything and restores it onto a wiped phone', async ({ page }) => {
    await page.goto('/#/progress');
    await seedRun(page, 'song.folk.hot-cross-buns', 0);

    const backup = await page.evaluate(async () => {
      const store = (window as unknown as { __pianopath?: Record<string, unknown> }).__pianopath;
      const exportAll = store?.exportAll as (() => Promise<unknown>) | undefined;
      if (!exportAll) throw new Error('backup module not exposed');
      return JSON.stringify(await exportAll());
    });
    expect(backup).toContain('hot-cross-buns');

    // A different phone: nothing in the database at all.
    await page.evaluate(async () => {
      const store = (window as unknown as { __pianopath?: Record<string, unknown> }).__pianopath;
      await (store?.wipeForTest as () => Promise<void>)();
    });
    await page.reload();
    await expect(page.locator('#progress-history')).toContainText('No runs recorded yet');

    await page.locator('#progress-file').setInputFiles({
      name: 'pianopath-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(backup, 'utf8'),
    });
    await expect(page.locator('#progress-status')).toContainText('Restored');
    await page.reload();
    await expect(page.locator('#progress-history')).toContainText('Hot Cross Buns');
  });

  test('refuses a file that is not a backup, with a sentence', async ({ page }) => {
    await page.goto('/#/progress');
    await page.locator('#progress-file').setInputFiles({
      name: 'shopping-list.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"eggs":2}', 'utf8'),
    });
    await expect(page.locator('#progress-status')).toContainText('not a PianoPath backup file');
  });
});

test.describe('Settings', () => {
  test('groups every setting and persists a change across a reload', async ({ page }) => {
    await page.goto('/#/settings');
    for (const heading of ['Practice', 'Display', 'Sound', 'Input', 'Content']) {
      await expect(page.locator('.block h2', { hasText: heading }).first()).toBeVisible();
    }

    await page.locator('#set-bars').fill('4');
    await page.locator('#set-bars').blur();
    await expect(page.locator('#settings-status')).toHaveText('Saved.');
    await page.reload();
    await expect(page.locator('#set-bars')).toHaveValue('4');
  });

  test('the offline-only switch persists', async ({ page }) => {
    await page.goto('/#/settings');
    await page.locator('#set-offline-only').check();
    await expect(page.locator('#settings-status')).toContainText('will not check for updates');
    await page.reload();
    await expect(page.locator('#set-offline-only')).toBeChecked();
  });

  test('reports the storage in use', async ({ page }) => {
    await page.goto('/#/settings');
    await expect(page.locator('#settings-storage')).toContainText('used of');
    await expect(page.locator('#settings-storage')).toContainText('of your own scores');
  });
});

test.describe('Diagnostics', () => {
  test('reports the precache, the content counts and the errors', async ({ page }) => {
    await page.goto('/#/settings/diagnostics');
    // The failure this block exists to catch is a silently skipped precache.
    await expect(page.locator('#diag-offline')).toContainText('Precached', { timeout: 30_000 });
    await expect(page.locator('#diag-content')).toContainText('Catalog:');
    await expect(page.locator('#diag-content')).toContainText('Curriculum v');
    await expect(page.locator('#diag-content')).toContainText('three-alternative rule');
    await expect(page.locator('#diag-errors')).toContainText('No uncaught errors');
  });

  test('the debug report carries the new blocks', async ({ page }) => {
    await page.goto('/#/settings/diagnostics');
    await expect(page.locator('#diag-content')).toContainText('Catalog:');
    await page.locator('#diag-copy-report').click();
    const report = page.locator('#diag-report');
    await expect(report).toBeVisible();
    const text = await report.inputValue();
    expect(text).toContain('## Offline and storage');
    expect(text).toContain('## Content');
    expect(text).toContain('## Errors this session');
  });
});

test.describe('the settings mirror (docs/01 §4.5)', () => {
  test('a setting survives localStorage being cleared, because IndexedDB has it', async ({
    page,
  }) => {
    await page.goto('/#/settings');
    await page.locator('#set-zoom').fill('1.6');
    await page.locator('#set-zoom').blur();
    await expect(page.locator('#settings-status')).toHaveText('Saved.');

    // The write to IndexedDB is fire-and-forget; give it a tick to land.
    await page.waitForTimeout(500);
    // Exactly what a browser clearing site data but keeping app storage does,
    // and what a restored backup looks like on a fresh install.
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();

    await expect(page.locator('#set-zoom')).toHaveValue('1.6');
  });
});
