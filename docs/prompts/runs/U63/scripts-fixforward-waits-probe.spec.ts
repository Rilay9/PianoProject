// U63 fix-forward probe (throwaway): the new row for the waiting learner at 3.4, with the old counted song
// (`…fur-elise.beginner`) and with 3.4's song as the built curriculum lists it today.
import { expect, test } from '@playwright/test';

const DAY = 86_400_000;
for (const song of ['song.classical.beethoven-fur-elise.beginner', 'song.classical.petzold-minuet-g-bwv-anh114']) {
  test(`waiting learner counting ${song}`, async ({ page }) => {
    await page.setViewportSize({ width: 342, height: 740 });
    const yesterday = new Date(Date.now() - DAY).toISOString();
    const counted = ['exercise.interval-reading.c-position.right.05', song];
    await page.goto('/');
    await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 30_000 });
    await page.evaluate(async (stores) => {
      const hooks = (window as unknown as { __pianopath?: { importAll: (raw: unknown) => Promise<unknown> } }).__pianopath;
      await hooks?.importAll({ app: 'pianopath', version: 1, exportedAt: new Date().toISOString(), stores });
    }, {
      plan: [{ id: 'current', stage: 3, unitId: '3.4', trackOrder: ['core', 'ragtime'], placement: { unitId: '3.4', at: new Date().toISOString() } }],
      sessions: counted.map((itemId) => ({ itemId, lessonId: '3.4', mode: 'tempo', tempoPct: 100, tempoMeasured: true, accuracy: 0.97, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 120_000, at: yesterday })),
      progress: counted.map((itemId) => ({ itemId, status: 'passed', bestAccuracy: 0.97, bestTempoPct: 100, attempts: 1, lastPracticedAt: yesterday, minutes: 2, passedOn: [yesterday.slice(0, 10)] })),
    });
    await page.reload();
    await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', '3.4', { timeout: 30_000 });
    const row = page.locator('#today-card .list-row[data-slot="new"]');
    await expect(row).toHaveCount(1, { timeout: 30_000 });
    console.log(JSON.stringify({ song, item: await row.getAttribute('data-item'), claim: await row.getAttribute('data-claim'), reason: await row.locator('.list-row__sub').textContent() }));
  });
}
