// U74's product-look pictures (temporary): the two-bar blues scale at 342 x 740 from Today and by a
// link after a fresh load, photographed as D4 did (as soon as the sheet draws) and once settled.
// U74_WHEN names the build: before (the committed renderer) or after (U74's).
import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const WHEN = process.env.U74_WHEN ?? 'after';
const OUT = '../docs/prompts/pictures/u74';
const READING_ROW = 'drill.reading.sight-reading-2-right';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
      localStorage.setItem('pianopath.firstSight', '["*"]');
    }
  });
});

async function seed(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 30_000 });
  await page.evaluate(async (row) => {
    const day = (back: number, hour: number): string => {
      const at = new Date();
      at.setDate(at.getDate() - back);
      at.setHours(hour, 0, 0, 0);
      return at.toISOString();
    };
    const run = (itemId: string, at: string, over: Record<string, unknown>) => ({
      itemId, tempoPct: 100, accuracy: 1, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 60_000, at, ...over,
    });
    const read = (back: number, seed: number) => {
      const at = day(back, 18);
      const material = {
        kind: 'generator', family: 'sight-reading', version: 2, seed,
        recipe: { level: 2, hands: 'R', bars: 4, fifths: 0, timeSig: { beats: 4, beatType: 4 }, eighths: true, skips: true },
        tempoBpm: 72,
      };
      const context = { itemId: row, seed, material, firstContact: true, met: ['keep-tempo', 'unseen', 'guide-off'], unattributed: 0, estimated: false };
      const evidence = (skill: string, demands: string[]) => ({
        kind: 'measured', skill, observationId: null, standard: 'full', n: 12, right: 12, at, context,
        byDemand: demands.map((demand) => ({ demand, n: 4, right: 4, steps: [0, 1, 2, 3], wrong: [] })),
      });
      return run(row, at, {
        mode: 'tempo', tempoMeasured: true, seed, unseen: true, generator: { family: 'sight-reading', version: 2, seed }, material,
        hands: { played: 'R', appPlayed: 'none' }, keys: { view: 'strip', guide: 'off', fingers: false, names: false }, evidenceDefinitions: 3,
        evidence: [
          evidence('sight-reading', ['interval.step', 'interval.skip', 'rhythm.eighths', 'rhythm.shorter-than-quarter', 'range.beyond-position']),
          evidence('interval-reading', ['interval.step', 'interval.skip']),
          evidence('position-shift', ['range.beyond-position']),
        ],
      });
    };
    const hooks = (window as unknown as { __pianopath?: { importAll: (raw: unknown) => Promise<unknown> } }).__pianopath;
    if (!hooks) throw new Error('storage hooks not exposed');
    await hooks.importAll({
      app: 'pianopath', version: 1, exportedAt: new Date().toISOString(),
      stores: {
        plan: [{ id: 'current', stage: 3, unitId: '3.4', trackOrder: ['core', 'ragtime'], placement: { unitId: '3.4', at: day(3, 9) } }],
        sessions: [
          read(2, 101), read(1, 102),
          run('drill.reading.note-flash-extended', day(1, 19), { mode: 'drill:note-flash', tempoMeasured: false, lessonId: '3.4' }),
          run('song.classical.petzold-minuet-g-bwv-anh114', day(1, 20), { mode: 'tempo', tempoMeasured: true, lessonId: '3.4' }),
        ],
      },
    });
  }, READING_ROW);
  await page.reload();
  await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', '3.4', { timeout: 30_000 });
}

async function firstDraw(page: Page, name: string): Promise<void> {
  await page.waitForFunction(() => {
    const svg = document.querySelector('#score-stage .is-front svg');
    return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
  }, undefined, { timeout: 60_000 });
  await page.screenshot({ path: `${OUT}/${WHEN}-${name}-first-draw-342x740.png` });
}

async function settledShot(page: Page, name: string): Promise<void> {
  await expect(page.locator('#score-stage[data-settled="true"]')).toHaveCount(1, { timeout: 60_000 });
  await page.waitForTimeout(1500);
  await expect(page.locator('#score-stage[data-settled="true"]')).toHaveCount(1, { timeout: 60_000 });
  await page.screenshot({ path: `${OUT}/${WHEN}-${name}-settled-342x740.png` });
}

test.use({ viewport: { width: 342, height: 740 } });

test('pictures: from Today, then by a link after a fresh load', async ({ page }) => {
  test.setTimeout(180_000);
  mkdirSync(OUT, { recursive: true });
  await seed(page);
  await page.goto('/');
  const offer = page.locator('#today-card .list-row[data-slot="new"][data-claim="transfer"]');
  await expect(offer).toHaveCount(1, { timeout: 30_000 });
  const title = (await offer.locator('.list-row__title').innerText()).trim();
  await offer.getByRole('button', { name: `Open ${title}` }).click();
  await firstDraw(page, 'today');
  await settledShot(page, 'today');
  const url = page.url();
  await page.goto('about:blank');
  await page.goto(url);
  await firstDraw(page, 'link');
  await settledShot(page, 'link');
});
