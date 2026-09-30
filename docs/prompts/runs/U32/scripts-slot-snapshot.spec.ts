/**
 * U32's lane-only probe (item 8): pieces of 48 bars or fewer are unchanged.
 *
 * Copied into `app/tests/e2e/` for its run and removed afterwards. For every piece of 48 bars or
 * fewer among `score.window-rule.spec.ts`'s pieces, the state gallery's four songs and the corpus,
 * at `window-rule`'s five shapes and Bars 1, 2, 4 and 8, it records at `data-settled` what the
 * renderer says of the window (`debugFit()`: the arrangement, the slot count, the systems, the bars
 * shown, the zoom, the sheets made), the stage's `data-slots`, and the front sheet's transform.
 * One JSON file per piece and shape under `test-results/u32-slot-snapshot/`; the lane merges them.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

import { withScoreMenu } from './scoreControls';

const SHAPES = [
  { name: 'phone-upright-342', width: 342, height: 740 },
  { name: 'phone-upright-390', width: 390, height: 844 },
  { name: 'phone-sideways', width: 740, height: 342 },
  { name: 'tablet-upright', width: 768, height: 1024 },
  { name: 'tablet-sideways', width: 1024, height: 768 },
];

/** window-rule's pieces, the gallery's four songs and the corpus's pieces, before the bar filter. */
const CANDIDATES = [
  'exercise.five-finger.c-major.right',
  'song.folk.twinkle.ht',
  'song.classical.chopin-nocturne-op48-1.nifc',
  'song.folk.hot-cross-buns',
  'song.folk.happy-birthday.simple',
  'song.folk.when-the-saints.alternating',
  'song.folk.mary-had-a-little-lamb',
  'song.folk.greensleeves.68',
  'song.folk.greensleeves.chords',
  'song.holiday.jingle-bells.g',
  'song.classical.ode-to-joy.full',
  'song.classical.petzold-minuet-g-bwv-anh114',
  'song.classical.chopin-scherzo-2.nifc',
  'song.classical.satie-gnossienne-1',
];

const BARS = [1, 2, 4, 8];
const OUT = resolve('test-results/u32-slot-snapshot');

interface Row {
  id: string;
  notation?: { bars?: number };
}

function barsOf(): Map<string, number | null> {
  const rows = JSON.parse(readFileSync(resolve('public/content/catalog.json'), 'utf8')) as Row[];
  const byId = new Map(rows.map((row) => [row.id, row]));
  return new Map(CANDIDATES.map((id) => [id, byId.get(id)?.notation?.bars ?? null]));
}

const BAR_COUNTS = barsOf();

async function settled(page: Page): Promise<void> {
  await page.waitForSelector('#score-stage.score-view[data-settled], .score-view[data-settled]', { timeout: 60_000 });
  // And a stability poll over the renderer's own shape, as window-rule's settle does.
  await page.waitForFunction(
    () => {
      const hooks = window as unknown as { __pianopath?: { scoreFit?: () => Record<string, unknown> | null } };
      const fit = hooks.__pianopath?.scoreFit?.();
      if (!fit) return false;
      const stage = document.querySelector<HTMLElement>('.score-view');
      if (!stage?.dataset.settled) return false;
      const key = JSON.stringify([
        fit.zoom,
        fit.barsShown,
        fit.slotCount,
        fit.systemsPerWindow,
        stage.dataset.slots,
        document.querySelector<HTMLElement>('#score-stage .score-buffer.is-cursor')?.style.transform ?? '',
      ]);
      const seen = window as unknown as { __u32Key?: string; __u32Same?: number };
      if (seen.__u32Key === key) seen.__u32Same = (seen.__u32Same ?? 0) + 1;
      else {
        seen.__u32Key = key;
        seen.__u32Same = 0;
      }
      return (seen.__u32Same ?? 0) >= 3;
    },
    undefined,
    { timeout: 60_000, polling: 200 },
  );
  await page.evaluate(() => {
    const seen = window as unknown as { __u32Key?: string; __u32Same?: number };
    delete seen.__u32Key;
    delete seen.__u32Same;
  });
}

async function setBars(page: Page, bars: number): Promise<void> {
  await withScoreMenu(page, async () => {
    const down = page.locator('#score-bars-down');
    for (let i = 0; i < 8 && (await down.isEnabled()); i += 1) await down.click();
    const up = page.locator('#score-bars-up');
    for (let i = 1; i < bars && (await up.isEnabled()); i += 1) await up.click();
  });
  await page.waitForTimeout(200);
  await settled(page);
}

async function record(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    const hooks = window as unknown as { __pianopath?: { scoreFit?: () => Record<string, unknown> | null } };
    const fit = hooks.__pianopath?.scoreFit?.() ?? {};
    const stage = document.querySelector<HTMLElement>('.score-view');
    const front = document.querySelector<HTMLElement>('#score-stage .score-buffer.is-cursor');
    const slots = Array.isArray(fit.slots) ? (fit.slots as unknown[]) : [];
    return {
      readAhead: fit.readAhead ?? null,
      slotCount: fit.slotCount ?? null,
      systemsPerWindow: fit.systemsPerWindow ?? null,
      barsShown: fit.barsShown ?? null,
      zoom: fit.zoom ?? null,
      sheetsMade: slots.length,
      dataSlots: stage?.dataset.slots ?? null,
      frontTransform: front?.style.transform ?? null,
    };
  });
}

for (const [id, bars] of BAR_COUNTS) {
  if (bars === null || bars > 48) continue;
  for (const shape of SHAPES) {
    test(`slot snapshot ${id} ${shape.name}`, async ({ page }) => {
      test.setTimeout(300_000);
      await page.setViewportSize({ width: shape.width, height: shape.height });
      await page.goto(`/#/score/${id}`);
      await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 90_000 });
      await settled(page);
      const cells: Record<string, unknown> = {};
      for (const asked of BARS) {
        await setBars(page, asked);
        cells[String(asked)] = await record(page);
      }
      mkdirSync(OUT, { recursive: true });
      writeFileSync(
        resolve(OUT, `${id}__${shape.name}.json`),
        `${JSON.stringify({ id, bars, shape: shape.name, cells }, null, 1)}\n`,
      );
    });
  }
}

test('slot snapshot: the pieces it covers', () => {
  const covered = [...BAR_COUNTS].filter(([, bars]) => bars !== null && bars <= 48).map(([id]) => id);
  const absent = [...BAR_COUNTS].filter(([, bars]) => bars === null).map(([id]) => id);
  const longer = [...BAR_COUNTS].filter(([, bars]) => bars !== null && bars > 48).map(([id, bars]) => `${id} (${String(bars)})`);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(resolve(OUT, '_pieces.json'), `${JSON.stringify({ covered, absent, longer }, null, 1)}\n`);
  expect(covered.length).toBeGreaterThan(0);
});
